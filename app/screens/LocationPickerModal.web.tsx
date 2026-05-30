import React, { useState } from 'react';
import {
  Modal,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ScrollView,
} from 'react-native';

export interface PickedLocation {
  name: string;
  lat: number;
  lng: number;
}

interface LocationPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onPick: (location: PickedLocation) => void;
  initial: PickedLocation | null;
}

const STANFORD_CENTER = { lat: 37.4275, lng: -122.1697 };

// Common Stanford locations for quick selection
const STANFORD_LOCATIONS = [
  { name: 'Main Quad', lat: 37.4270, lng: -122.1699 },
  { name: 'White Plaza', lat: 37.4267, lng: -122.1695 },
  { name: 'Tresidder Union', lat: 37.4261, lng: -122.1691 },
  { name: 'Green Library', lat: 37.4267, lng: -122.1677 },
  { name: 'Meyer Library', lat: 37.4277, lng: -122.1708 },
  { name: 'Old Union', lat: 37.4267, lng: -122.1690 },
  { name: 'CoHo', lat: 37.4246, lng: -122.1702 },
  { name: 'Arrillaga Alumni Center', lat: 37.4298, lng: -122.1669 },
  { name: 'Frost Amphitheater', lat: 37.4298, lng: -122.1732 },
  { name: 'Lake Lagunita', lat: 37.4216, lng: -122.1768 },
];

/**
 * Web-compatible LocationPickerModal
 *
 * Phase 1: Simple location picker with preset Stanford locations
 * Phase 2: Will add interactive map with Leaflet or Mapbox GL JS
 */
export default function LocationPickerModal({
  visible,
  onClose,
  onPick,
  initial,
}: LocationPickerModalProps) {
  const [locationName, setLocationName] = useState<string>(
    initial?.name || ''
  );
  const [selectedPreset, setSelectedPreset] = useState<PickedLocation | null>(
    initial
  );

  const handleSelectPreset = (location: PickedLocation) => {
    setSelectedPreset(location);
    setLocationName(location.name);
  };

  const handleConfirm = () => {
    if (selectedPreset) {
      onPick(selectedPreset);
    } else if (locationName.trim().length > 0) {
      // If user typed a custom location, use Stanford center coordinates
      onPick({
        name: locationName.trim(),
        ...STANFORD_CENTER,
      });
    }
  };

  const handleCancel = () => {
    setLocationName(initial?.name || '');
    setSelectedPreset(initial);
    onClose();
  };

  const canConfirm = selectedPreset !== null || locationName.trim().length > 0;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={handleCancel}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleCancel}>
            <Text style={styles.cancelButton}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Pick Location</Text>
          <TouchableOpacity
            onPress={handleConfirm}
            disabled={!canConfirm}
          >
            <Text
              style={[
                styles.confirmButton,
                !canConfirm && styles.confirmButtonDisabled,
              ]}
            >
              Confirm
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Custom Location</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter location name..."
              placeholderTextColor="#999999"
              value={locationName}
              onChangeText={(text) => {
                setLocationName(text);
                setSelectedPreset(null);
              }}
            />
            <Text style={styles.hint}>
              Or select a preset location below
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Stanford Locations</Text>
            {STANFORD_LOCATIONS.map((location, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.presetItem,
                  selectedPreset?.name === location.name &&
                    styles.presetItemSelected,
                ]}
                onPress={() => handleSelectPreset(location)}
              >
                <View style={styles.presetItemContent}>
                  <Text style={styles.presetIcon}>📍</Text>
                  <Text
                    style={[
                      styles.presetName,
                      selectedPreset?.name === location.name &&
                        styles.presetNameSelected,
                    ]}
                  >
                    {location.name}
                  </Text>
                </View>
                {selectedPreset?.name === location.name && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Interactive map coming soon on web!
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  cancelButton: {
    fontSize: 16,
    color: '#8C1515',
  },
  confirmButton: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8C1515',
  },
  confirmButtonDisabled: {
    color: '#CCCCCC',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#000000',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  hint: {
    fontSize: 12,
    color: '#999999',
    marginTop: 8,
  },
  presetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#F5F5F5',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  presetItemSelected: {
    backgroundColor: '#FEF0F0',
    borderColor: '#8C1515',
  },
  presetItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  presetIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  presetName: {
    fontSize: 16,
    color: '#333333',
  },
  presetNameSelected: {
    fontWeight: '600',
    color: '#8C1515',
  },
  checkmark: {
    fontSize: 20,
    color: '#8C1515',
    fontWeight: '700',
  },
  footer: {
    padding: 16,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#999999',
    textAlign: 'center',
  },
});
