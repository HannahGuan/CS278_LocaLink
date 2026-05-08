import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { mockFriends } from '../data/mockData';
import { useEvents } from '../api/eventClient';
import { getCurrentUser } from '../../database/auth';
import { databaseClient } from '../../database/databaseClient';
import { Event } from '../types';

export default function EventsScreen({ navigation }: any) {
  const [selectedTab, setSelectedTab] = useState<'now' | 'today' | 'week'>('now');
  const { events, isLoading, errorMessage } = useEvents();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [rsvpedEventIds, setRsvpedEventIds] = useState<Set<string>>(new Set());
  const [pendingRsvpEventId, setPendingRsvpEventId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const user = await getCurrentUser();
      if (cancelled || user === null) {
        return;
      }
      setCurrentUserId(user.id);
      try {
        const ids = await databaseClient.getMyRsvpEventIds(user.id);
        if (!cancelled) {
          setRsvpedEventIds(ids);
        }
      } catch (error) {
        console.error('Error loading RSVPs:', error);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleToggleRsvp = async (event: Event) => {
    if (pendingRsvpEventId !== null) {
      return;
    }

    let userId = currentUserId;
    if (userId === null) {
      const user = await getCurrentUser();
      if (user === null) {
        Alert.alert('Not signed in', 'Please log in again to RSVP.');
        return;
      }
      userId = user.id;
      setCurrentUserId(userId);
    }

    const isGoing = rsvpedEventIds.has(event.id);
    setPendingRsvpEventId(event.id);
    setRsvpedEventIds((prev) => {
      const next = new Set(prev);
      if (isGoing) {
        next.delete(event.id);
      } else {
        next.add(event.id);
      }
      return next;
    });
    try {
      if (isGoing) {
        await databaseClient.deleteEventRsvp(userId, event.id);
        console.log('[RSVP] removed', event.id);
      } else {
        await databaseClient.createEventRsvp(
          userId,
          event.id,
          event.title,
          event.date,
          event.location
        );
        console.log('[RSVP] created', event.id);
      }
    } catch (error) {
      console.error('[RSVP] error toggling:', error);
      setRsvpedEventIds((prev) => {
        const next = new Set(prev);
        if (isGoing) {
          next.add(event.id);
        } else {
          next.delete(event.id);
        }
        return next;
      });
      const message =
        error instanceof Error ? error.message : 'Please try again in a moment.';
      Alert.alert('Could not update RSVP', message);
    } finally {
      setPendingRsvpEventId(null);
    }
  };

  const tabs = [
    { id: 'now' as const, label: 'Happening Now' },
    { id: 'today' as const, label: 'Today' },
    { id: 'week' as const, label: 'This Week' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Events</Text>
          <TouchableOpacity style={styles.addButton}>
            <Text style={styles.addButtonText}>+</Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal={true} showsHorizontalScrollIndicator={false as boolean} style={styles.tabsScroll}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              onPress={() => setSelectedTab(tab.id)}
              style={[
                styles.tab,
                selectedTab === tab.id && styles.tabActive,
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  selectedTab === tab.id && styles.tabTextActive,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false as boolean}>
        <View style={styles.calendarCard}>
          <View style={styles.calendarHeader}>
            <Text style={styles.calendarIcon}>📅</Text>
            <Text style={styles.calendarTitle}>Your Calendar</Text>
          </View>
          <View style={styles.calendarGrid}>
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
              <Text key={i} style={styles.calendarDay}>
                {day}
              </Text>
            ))}
            {Array.from({ length: 30 }, (_, i) => (
              <View
                key={i}
                style={[
                  styles.calendarDate,
                  i === 23 && styles.calendarDateToday,
                  (i === 24 || i === 25) && styles.calendarDateEvent,
                ]}
              >
                <Text
                  style={[
                    styles.calendarDateText,
                    i === 23 && styles.calendarDateTextToday,
                  ]}
                >
                  {i + 1}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <Text style={styles.sectionTitle}>
          {selectedTab === 'now'
            ? 'Happening Now'
            : selectedTab === 'today'
            ? "Today's Events"
            : 'This Week'}
        </Text>

        {isLoading && (
          <View style={styles.statusContainer}>
            <ActivityIndicator size="large" color="#8C1515" />
            <Text style={styles.statusText}>Loading Stanford events…</Text>
          </View>
        )}

        {errorMessage !== null && !isLoading && (
          <View style={styles.statusContainer}>
            <Text style={styles.errorText}>Couldn’t load events: {errorMessage}</Text>
          </View>
        )}

        {!isLoading && errorMessage === null && events.length === 0 && (
          <View style={styles.statusContainer}>
            <Text style={styles.statusText}>No upcoming events found.</Text>
          </View>
        )}

        {events.map((event) => {
          const isGoing = rsvpedEventIds.has(event.id);
          const isPending = pendingRsvpEventId === event.id;
          const attendeeCount = event.attendees.length + (isGoing ? 1 : 0);
          return (
            <View key={event.id} style={styles.eventCard}>
              <View style={styles.eventHeader}>
                {event.imageUrl !== undefined ? (
                  <Image source={{ uri: event.imageUrl }} style={styles.eventImage} />
                ) : (
                  <View style={styles.eventIconBox}>
                    <Text style={styles.eventIcon}>{event.icon}</Text>
                  </View>
                )}
                <View style={styles.eventInfo}>
                  <Text style={styles.eventTitle}>{event.title}</Text>
                  <Text style={styles.eventDescription}>{event.description}</Text>
                  <Text style={styles.eventDetail}>📍 {event.location}</Text>
                  <Text style={styles.eventDetail}>
                    🕐 {event.time} • {event.date}
                  </Text>
                </View>
              </View>

              <View style={styles.eventFooter}>
                <View style={styles.attendeesRow}>
                  <View style={styles.attendeesAvatars}>
                    {mockFriends.slice(0, 3).map((friend, index) => (
                      <Image
                        key={friend.id}
                        source={{ uri: friend.photo }}
                        style={[styles.attendeeAvatar, { marginLeft: index > 0 ? -8 : 0 }]}
                      />
                    ))}
                  </View>
                  <Text style={styles.attendeesText}>
                    {attendeeCount} attending
                  </Text>
                </View>
                <View style={styles.eventActions}>
                  <TouchableOpacity
                    style={[
                      styles.rsvpButton,
                      isGoing && styles.rsvpButtonGoing,
                      isPending && styles.rsvpButtonDisabled,
                    ]}
                    onPress={() => handleToggleRsvp(event)}
                    disabled={isPending}
                  >
                    {isPending ? (
                      <ActivityIndicator
                        color={isGoing ? '#8C1515' : '#FFFFFF'}
                        size="small"
                      />
                    ) : (
                      <Text
                        style={[
                          styles.rsvpButtonText,
                          isGoing && styles.rsvpButtonTextGoing,
                        ]}
                      >
                        {isGoing ? '✓ Going' : 'RSVP'}
                      </Text>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.shareButton}>
                    <Text style={styles.shareButtonText}>⋮</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    color: '#000000',
    letterSpacing: -0.5,
  },
  addButton: {
    width: 40,
    height: 40,
    backgroundColor: '#8C1515',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: '300',
  },
  tabsScroll: {
    flexGrow: 0,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
    marginRight: 8,
  },
  tabActive: {
    backgroundColor: '#8C1515',
  },
  tabText: {
    fontSize: 14,
    color: '#666666',
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  calendarCard: {
    backgroundColor: '#F3E8FF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  calendarIcon: {
    fontSize: 20,
  },
  calendarTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#7C3AED',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  calendarDay: {
    width: 36,
    textAlign: 'center',
    fontSize: 12,
    color: '#666666',
  },
  calendarDate: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  calendarDateToday: {
    backgroundColor: '#7C3AED',
  },
  calendarDateEvent: {
    backgroundColor: '#DDD6FE',
  },
  calendarDateText: {
    fontSize: 14,
    color: '#000000',
  },
  calendarDateTextToday: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 12,
  },
  eventCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
  },
  eventHeader: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  eventIconBox: {
    width: 64,
    height: 64,
    backgroundColor: '#7C3AED',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventImage: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: '#E5E5EA',
  },
  eventIcon: {
    fontSize: 30,
  },
  eventInfo: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 4,
  },
  eventDescription: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
  },
  eventDetail: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  eventFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  attendeesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  attendeesAvatars: {
    flexDirection: 'row',
  },
  attendeeAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  attendeesText: {
    fontSize: 14,
    color: '#666666',
  },
  eventActions: {
    flexDirection: 'row',
    gap: 8,
  },
  rsvpButton: {
    backgroundColor: '#8C1515',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
    minWidth: 88,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rsvpButtonGoing: {
    backgroundColor: '#F4E8E9',
    borderWidth: 1,
    borderColor: '#8C1515',
  },
  rsvpButtonDisabled: {
    opacity: 0.7,
  },
  rsvpButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  rsvpButtonTextGoing: {
    color: '#8C1515',
  },
  shareButton: {
    backgroundColor: '#F2F2F7',
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareButtonText: {
    fontSize: 18,
    color: '#666666',
  },
  statusContainer: {
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  statusText: {
    fontSize: 14,
    color: '#666666',
  },
  errorText: {
    fontSize: 14,
    color: '#8C1515',
    textAlign: 'center',
  },
});
