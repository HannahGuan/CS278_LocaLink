import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Modal,
  Pressable,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Event } from '../types';
import { databaseClient } from '../../database/databaseClient';
import { Profile } from '../../types';

const { height: WINDOW_HEIGHT } = Dimensions.get('window');

interface EventDetailsModalProps {
  event: Event | null;
  onClose: () => void;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function EventDetailsModal({ event, onClose }: EventDetailsModalProps) {
  const [attendees, setAttendees] = useState<Profile[]>([]);
  const [attendeesLoading, setAttendeesLoading] = useState<boolean>(false);
  const [organizerName, setOrganizerName] = useState<string | null>(null);

  useEffect(() => {
    if (event === null) {
      setAttendees([]);
      setOrganizerName(null);
      return;
    }
    let cancelled = false;
    setAttendeesLoading(true);
    databaseClient
      .getEventAttendees(event.id)
      .then((rows) => {
        if (!cancelled) {
          setAttendees(rows);
        }
      })
      .catch((error) => {
        console.error('Error loading attendees:', error);
        if (!cancelled) {
          setAttendees([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setAttendeesLoading(false);
        }
      });

    // For user-created events the Event.organizer field carries the creator's
    // user id — look up their name so we don't render a raw UUID.
    if (UUID_PATTERN.test(event.organizer)) {
      setOrganizerName(null);
      databaseClient
        .getUserProfile(event.organizer)
        .then((profile) => {
          if (!cancelled && profile !== null) {
            setOrganizerName(profile.name);
          }
        })
        .catch((error) => {
          console.error('Error loading organizer profile:', error);
        });
    } else {
      setOrganizerName(event.organizer);
    }

    return () => {
      cancelled = true;
    };
  }, [event]);

  return (
    <Modal
      visible={event !== null}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        <Pressable style={styles.modalCard} onPress={() => {}}>
          {event !== null && (
            <ScrollView
              style={styles.modalScroll}
              contentContainerStyle={styles.modalScrollContent}
              showsVerticalScrollIndicator={true as boolean}
              bounces={true}
            >
              <View style={styles.modalHero}>
                {event.imageUrl !== undefined ? (
                  <Image
                    source={{ uri: event.imageUrl }}
                    style={styles.modalHeroImage}
                  />
                ) : (
                  <View style={styles.modalHeroFallback}>
                    <Text style={styles.modalHeroIcon}>{event.icon}</Text>
                  </View>
                )}
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={onClose}
                >
                  <Text style={styles.modalCloseText}>✕</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.modalBody}>
                <View style={styles.modalCategoryBadge}>
                  <Text style={styles.modalCategoryText}>
                    {event.icon} {event.category}
                  </Text>
                </View>

                <Text style={styles.modalTitle}>{event.title}</Text>
                {organizerName !== null && (
                  <Text style={styles.modalOrganizer}>by {organizerName}</Text>
                )}

                <View style={styles.modalDivider} />

                <View style={styles.modalInfoRow}>
                  <Text style={styles.modalInfoIcon}>📅</Text>
                  <View style={styles.modalInfoContent}>
                    <Text style={styles.modalInfoLabel}>Date</Text>
                    <Text style={styles.modalInfoValue}>{event.date}</Text>
                  </View>
                </View>

                <View style={styles.modalInfoRow}>
                  <Text style={styles.modalInfoIcon}>🕒</Text>
                  <View style={styles.modalInfoContent}>
                    <Text style={styles.modalInfoLabel}>Time</Text>
                    <Text style={styles.modalInfoValue}>{event.time}</Text>
                  </View>
                </View>

                <View style={styles.modalInfoRow}>
                  <Text style={styles.modalInfoIcon}>📍</Text>
                  <View style={styles.modalInfoContent}>
                    <Text style={styles.modalInfoLabel}>Location</Text>
                    <Text style={styles.modalInfoValue}>{event.location}</Text>
                  </View>
                </View>

                {event.description.length > 0 && (
                  <>
                    <View style={styles.modalDivider} />
                    <Text style={styles.modalSectionLabel}>About</Text>
                    <Text style={styles.modalDescription}>
                      {event.description}
                    </Text>
                  </>
                )}

                <View style={styles.modalDivider} />
                <Text style={styles.modalSectionLabel}>
                  Attending {attendees.length > 0 && `(${attendees.length})`}
                </Text>
                {attendeesLoading ? (
                  <ActivityIndicator
                    color="#8C1515"
                    size="small"
                    style={styles.attendeesLoading}
                  />
                ) : attendees.length === 0 ? (
                  <Text style={styles.attendeesEmpty}>
                    No one you know is going yet.
                  </Text>
                ) : (
                  attendees.map((attendee) => (
                    <View key={attendee.id} style={styles.attendeeRow}>
                      {attendee.avatar_url !== undefined &&
                      attendee.avatar_url !== null ? (
                        <Image
                          source={{ uri: attendee.avatar_url }}
                          style={styles.attendeeAvatar}
                        />
                      ) : (
                        <View
                          style={[styles.attendeeAvatar, styles.attendeeAvatarFallback]}
                        >
                          <Text style={styles.attendeeAvatarFallbackText}>
                            {attendee.name.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                      )}
                      <Text style={styles.attendeeName}>{attendee.name}</Text>
                    </View>
                  ))
                )}
              </View>
            </ScrollView>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    height: WINDOW_HEIGHT * 0.85,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  modalScroll: {
    flex: 1,
  },
  modalScrollContent: {
    paddingBottom: 24,
  },
  modalHero: {
    height: 180,
    position: 'relative',
    backgroundColor: '#F4E8E9',
  },
  modalHeroImage: {
    width: '100%',
    height: '100%',
  },
  modalHeroFallback: {
    flex: 1,
    backgroundColor: '#8C1515',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalHeroIcon: {
    fontSize: 72,
  },
  modalCloseButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalBody: {
    padding: 20,
  },
  modalCategoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#F4E8E9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
  },
  modalCategoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8C1515',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000000',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  modalOrganizer: {
    fontSize: 14,
    color: '#666666',
  },
  modalDivider: {
    height: 1,
    backgroundColor: '#E5E5EA',
    marginVertical: 16,
  },
  modalInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalInfoIcon: {
    fontSize: 20,
    width: 32,
  },
  modalInfoContent: {
    flex: 1,
  },
  modalInfoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8C1515',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  modalInfoValue: {
    fontSize: 15,
    color: '#000000',
    marginTop: 2,
  },
  modalSectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666666',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: 15,
    color: '#000000',
    lineHeight: 22,
  },
  attendeesLoading: {
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  attendeesEmpty: {
    fontSize: 14,
    color: '#999999',
  },
  attendeeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  attendeeAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
    backgroundColor: '#E5E5EA',
  },
  attendeeAvatarFallback: {
    backgroundColor: '#F4E8E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  attendeeAvatarFallbackText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#8C1515',
  },
  attendeeName: {
    fontSize: 15,
    color: '#000000',
    fontWeight: '500',
  },
});
