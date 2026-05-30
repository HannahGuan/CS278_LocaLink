import React, { useEffect, useState } from 'react';
import {
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { databaseClient } from '../../database/databaseClient';
import { formatDateLabel, formatTimeLabel } from '../api/eventClient';
import LocationPickerModal, { PickedLocation } from './LocationPickerModal';
import { notifyFriendsAboutEvent } from '../../services/notifications';

interface CreateEventModalProps {
  visible: boolean;
  currentUserId: string | null;
  onClose: () => void;
  onCreated: () => void;
}

interface CategoryOption {
  label: string;
  icon: string;
}

const CATEGORY_OPTIONS: CategoryOption[] = [
  { label: 'Social', icon: '🎉' },
  { label: 'Academic', icon: '📚' },
  { label: 'Sports', icon: '⚽' },
  { label: 'Music', icon: '🎵' },
  { label: 'Food', icon: '🍽️' },
  { label: 'Film/Video', icon: '🎬' },
  { label: 'Workshop', icon: '🛠️' },
  { label: 'Other', icon: '✨' },
];

function combineDateAndTime(date: Date, time: Date): Date {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    time.getHours(),
    time.getMinutes(),
    0,
    0
  );
}

function defaultStartTime(): Date {
  const next = new Date();
  next.setMinutes(0, 0, 0);
  next.setHours(next.getHours() + 1);
  return next;
}

export default function CreateEventModal({
  visible,
  currentUserId,
  onClose,
  onCreated,
}: CreateEventModalProps) {
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [pickedLocation, setPickedLocation] = useState<PickedLocation | null>(null);
  const [eventDate, setEventDate] = useState<Date>(new Date());
  const [eventTime, setEventTime] = useState<Date>(defaultStartTime());
  const [selectedCategoryIndex, setSelectedCategoryIndex] = useState<number>(0);
  const [isFriendOnly, setIsFriendOnly] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [showLocationPicker, setShowLocationPicker] = useState<boolean>(false);
  const [pickerMode, setPickerMode] = useState<'date' | 'time' | null>(null);

  useEffect(() => {
    if (visible) {
      setEventDate(new Date());
      setEventTime(defaultStartTime());
    }
  }, [visible]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setPickedLocation(null);
    setEventDate(new Date());
    setEventTime(defaultStartTime());
    setSelectedCategoryIndex(0);
    setIsFriendOnly(false);
  };

  const handleClose = () => {
    if (isSaving) return;
    resetForm();
    onClose();
  };

  const handleDateChange = (event: DateTimePickerEvent, picked: Date | undefined) => {
    // Android dismisses itself on each interaction; iOS keeps the spinner
    // open until the user taps Done in our own header.
    if (Platform.OS === 'android') {
      setPickerMode(null);
    }
    if (event.type === 'dismissed' || picked === undefined) return;
    setEventDate(picked);
  };

  const handleTimeChange = (event: DateTimePickerEvent, picked: Date | undefined) => {
    if (Platform.OS === 'android') {
      setPickerMode(null);
    }
    if (event.type === 'dismissed' || picked === undefined) return;
    setEventTime(picked);
  };

  const handleCreate = async () => {
    console.log('=== handleCreate called ===');
    console.log('currentUserId:', currentUserId);
    console.log('title:', title);
    console.log('pickedLocation:', pickedLocation);

    if (currentUserId === null) {
      console.log('ERROR: No currentUserId');
      Alert.alert('Not signed in', 'Please log in again to create an event.');
      return;
    }
    const trimmedTitle = title.trim();
    if (trimmedTitle.length === 0) {
      console.log('ERROR: No title');
      Alert.alert('Missing title', 'Please give your event a name.');
      return;
    }
    if (pickedLocation === null) {
      console.log('ERROR: No location');
      Alert.alert('Pick a location', 'Drop a pin on the map for where your event will happen.');
      return;
    }

    console.log('✓ Validation passed. Creating event:', trimmedTitle);
    const startsAt = combineDateAndTime(eventDate, eventTime);
    const category = CATEGORY_OPTIONS[selectedCategoryIndex];
    console.log('Event details - Date:', formatDateLabel(startsAt), 'Time:', formatTimeLabel(startsAt));

    setIsSaving(true);
    try {
      console.log('Calling createUserEvent...');
      const newEvent = await databaseClient.createUserEvent(currentUserId, {
        title: trimmedTitle,
        description: description.trim(),
        location: pickedLocation.name,
        locationLat: pickedLocation.lat,
        locationLng: pickedLocation.lng,
        eventDate: formatDateLabel(startsAt),
        eventTime: formatTimeLabel(startsAt),
        startsAt,
        category: category.label,
        icon: category.icon,
        isFriendOnly: isFriendOnly,
      });

      // Get user's profile name for notification
      const { data: profile } = await databaseClient.client
        .from('profiles')
        .select('name')
        .eq('id', currentUserId)
        .single();

      // Notify friends about the new event (don't await - fire and forget)
      if (profile?.name) {
        notifyFriendsAboutEvent(
          currentUserId,
          profile.name,
          trimmedTitle,
          newEvent.id
        ).catch((err) => {
          console.error('Failed to send notifications:', err);
        });
      }

      console.log('✓ Event created successfully! ID:', newEvent.id);
      console.log('Calling onCreated callback...');
      resetForm();
      onCreated();
      console.log('Calling onClose...');
      onClose();
    } catch (error) {
      console.error('ERROR creating event:', error);
      const message =
        error instanceof Error ? error.message : 'Please try again in a moment.';
      Alert.alert('Could not create event', message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={handleClose} disabled={isSaving}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>New Event</Text>
          <TouchableOpacity
            onPress={handleCreate}
            disabled={isSaving}
            style={[styles.createButton, isSaving && styles.createButtonDisabled]}
          >
            {isSaving ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.createButtonText}>Post</Text>
            )}
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false as boolean}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: 40 }}
          >
            <View style={styles.previewCard}>
              <View style={styles.previewBox}>
                <Text style={styles.previewIcon}>
                  {CATEGORY_OPTIONS[selectedCategoryIndex].icon}
                </Text>
              </View>
              <View style={styles.previewMeta}>
                <Text style={styles.previewLabel}>
                  {CATEGORY_OPTIONS[selectedCategoryIndex].label} event
                </Text>
                <Text style={styles.previewSubtitle}>
                  {formatDateLabel(eventDate)} • {formatTimeLabel(eventTime)}
                </Text>
                {pickedLocation !== null && (
                  <Text style={styles.previewSubtitle}>📍 {pickedLocation.name}</Text>
                )}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Title</Text>
              <TextInput
                style={styles.textInput}
                placeholder="What's the event?"
                placeholderTextColor="#999999"
                value={title}
                onChangeText={setTitle}
                maxLength={80}
                returnKeyType="next"
                autoCapitalize="sentences"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="Add a few details (optional)"
                placeholderTextColor="#999999"
                value={description}
                onChangeText={setDescription}
                multiline={true}
                maxLength={300}
                returnKeyType="done"
                blurOnSubmit={true}
                autoCapitalize="sentences"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Location</Text>
              <TouchableOpacity
                style={styles.fieldButton}
                onPress={() => setShowLocationPicker(true)}
              >
                <Text
                  style={[
                    styles.fieldButtonText,
                    pickedLocation === null && styles.fieldButtonPlaceholder,
                  ]}
                >
                  {pickedLocation !== null
                    ? pickedLocation.name
                    : 'Drop a pin on the map'}
                </Text>
                <Text style={styles.fieldButtonChevron}>›</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Date & Time</Text>
              <View style={styles.dateTimeRow}>
                <TouchableOpacity
                  style={[
                    styles.fieldButton,
                    styles.dateTimeButton,
                    pickerMode === 'date' && styles.dateTimeButtonActive,
                  ]}
                  onPress={() =>
                    setPickerMode((prev) => (prev === 'date' ? null : 'date'))
                  }
                >
                  <Text style={styles.fieldButtonText}>
                    {formatDateLabel(eventDate)}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.fieldButton,
                    styles.dateTimeButton,
                    pickerMode === 'time' && styles.dateTimeButtonActive,
                  ]}
                  onPress={() =>
                    setPickerMode((prev) => (prev === 'time' ? null : 'time'))
                  }
                >
                  <Text style={styles.fieldButtonText}>
                    {formatTimeLabel(eventTime)}
                  </Text>
                </TouchableOpacity>
              </View>
              {Platform.OS === 'ios' && pickerMode === 'date' && (
                <View style={styles.inlinePickerWrap}>
                  <DateTimePicker
                    value={eventDate}
                    mode="date"
                    display="inline"
                    minimumDate={new Date()}
                    onChange={handleDateChange}
                    themeVariant="light"
                    accentColor="#8C1515"
                    style={styles.inlineDatePicker}
                  />
                </View>
              )}
              {Platform.OS === 'ios' && pickerMode === 'time' && (
                <View style={styles.inlinePickerWrap}>
                  <DateTimePicker
                    value={eventTime}
                    mode="time"
                    display="spinner"
                    onChange={handleTimeChange}
                    themeVariant="light"
                    style={styles.inlineTimePicker}
                  />
                </View>
              )}
              {Platform.OS === 'android' && pickerMode === 'date' && (
                <DateTimePicker
                  value={eventDate}
                  mode="date"
                  display="default"
                  minimumDate={new Date()}
                  onChange={handleDateChange}
                />
              )}
              {Platform.OS === 'android' && pickerMode === 'time' && (
                <DateTimePicker
                  value={eventTime}
                  mode="time"
                  display="default"
                  onChange={handleTimeChange}
                />
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Category</Text>
              <View style={styles.categoryGrid}>
                {CATEGORY_OPTIONS.map((option, index) => {
                  const isActive = index === selectedCategoryIndex;
                  return (
                    <TouchableOpacity
                      key={option.label}
                      style={[
                        styles.categoryChip,
                        isActive && styles.categoryChipActive,
                      ]}
                      onPress={() => setSelectedCategoryIndex(index)}
                    >
                      <Text style={styles.categoryIcon}>{option.icon}</Text>
                      <Text
                        style={[
                          styles.categoryLabel,
                          isActive && styles.categoryLabelActive,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Visibility</Text>
              <TouchableOpacity
                style={styles.visibilityToggle}
                onPress={() => setIsFriendOnly(!isFriendOnly)}
              >
                <View style={styles.visibilityInfo}>
                  <Text style={styles.visibilityTitle}>
                    {isFriendOnly ? '🔒 Friends Only' : '🌍 Public'}
                  </Text>
                  <Text style={styles.visibilityDescription}>
                    {isFriendOnly
                      ? 'Only your friends can see this event'
                      : 'Everyone on campus can see this event'}
                  </Text>
                </View>
                <View style={[styles.toggleSwitch, isFriendOnly && styles.toggleSwitchActive]}>
                  <View style={[styles.toggleThumb, isFriendOnly && styles.toggleThumbActive]} />
                </View>
              </TouchableOpacity>
            </View>

            <View style={{ height: 40 }} />
          </ScrollView>
        </KeyboardAvoidingView>

        <LocationPickerModal
          visible={showLocationPicker}
          initial={pickedLocation}
          onClose={() => setShowLocationPicker(false)}
          onPick={(loc) => setPickedLocation(loc)}
        />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
  },
  cancelText: {
    fontSize: 17,
    color: '#8C1515',
    width: 70,
  },
  createButton: {
    backgroundColor: '#8C1515',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minWidth: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  previewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  previewBox: {
    width: 56,
    height: 56,
    backgroundColor: '#F4E8E9',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewIcon: {
    fontSize: 28,
  },
  previewMeta: {
    flex: 1,
  },
  previewLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 2,
  },
  previewSubtitle: {
    fontSize: 13,
    color: '#666666',
  },
  inputGroup: {
    marginBottom: 18,
    gap: 8,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666666',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    fontSize: 16,
    color: '#000000',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  textArea: {
    minHeight: 88,
    textAlignVertical: 'top',
  },
  fieldButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  fieldButtonText: {
    fontSize: 16,
    color: '#000000',
    flex: 1,
  },
  fieldButtonPlaceholder: {
    color: '#999999',
  },
  fieldButtonChevron: {
    fontSize: 18,
    color: '#999999',
    marginLeft: 8,
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dateTimeButton: {
    flex: 1,
  },
  dateTimeButtonActive: {
    borderColor: '#8C1515',
    backgroundColor: '#F4E8E9',
  },
  inlinePickerWrap: {
    marginTop: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    overflow: 'hidden',
    paddingVertical: 4,
  },
  inlineDatePicker: {
    height: 360,
    width: '100%',
  },
  inlineTimePicker: {
    height: 216,
    width: '100%',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  categoryChipActive: {
    backgroundColor: '#F4E8E9',
    borderColor: '#8C1515',
  },
  categoryIcon: {
    fontSize: 16,
  },
  categoryLabel: {
    fontSize: 13,
    color: '#666666',
    fontWeight: '500',
  },
  categoryLabelActive: {
    color: '#8C1515',
    fontWeight: '600',
  },
  visibilityToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  visibilityInfo: {
    flex: 1,
    marginRight: 12,
  },
  visibilityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  visibilityDescription: {
    fontSize: 13,
    color: '#666666',
  },
  toggleSwitch: {
    width: 51,
    height: 31,
    borderRadius: 16,
    backgroundColor: '#E5E5EA',
    padding: 2,
    justifyContent: 'center',
  },
  toggleSwitchActive: {
    backgroundColor: '#8C1515',
  },
  toggleThumb: {
    width: 27,
    height: 27,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleThumbActive: {
    transform: [{ translateX: 20 }],
  },
});
