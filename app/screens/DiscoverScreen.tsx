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
import { useEvents, formatDateLabel } from '../api/eventClient';
import { Event } from '../types';
import { getCurrentUser } from '../../database/auth';
import { databaseClient } from '../../database/databaseClient';

type DiscoverTab = 'now' | 'today' | 'week';

// event.time is "3:00 PM" — return minutes since midnight, or null if unparseable.
function parseEventTimeToMinutes(time: string): number | null {
  const match = time.match(/^(\d{1,2}):(\d{2})\s+(AM|PM)$/);
  if (match === null) return null;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  if (match[3] === 'PM' && hours !== 12) hours += 12;
  if (match[3] === 'AM' && hours === 12) hours = 0;
  return hours * 60 + minutes;
}

function filterEventsForTab(events: Event[], tab: DiscoverTab): Event[] {
  const now = new Date();
  const todayLabel = formatDateLabel(now);

  if (tab === 'today') {
    return events.filter((event) => event.date === todayLabel);
  }

  if (tab === 'week') {
    const weekLabels = new Set<string>();
    for (let offset = 0; offset < 7; offset++) {
      const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset);
      weekLabels.add(formatDateLabel(day));
    }
    return events.filter((event) => weekLabels.has(event.date));
  }

  // 'now': today's events that started in the last 2 hours or start in the next 30 min
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  return events.filter((event) => {
    if (event.date !== todayLabel) return false;
    const eventMinutes = parseEventTimeToMinutes(event.time);
    if (eventMinutes === null) return false;
    return eventMinutes >= nowMinutes - 120 && eventMinutes <= nowMinutes + 30;
  });
}

export default function DiscoverScreen() {
  const [selectedTab, setSelectedTab] = useState<DiscoverTab>('today');
  const { events, isLoading, errorMessage } = useEvents();
  const visibleEvents = filterEventsForTab(events, selectedTab);
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
      } else {
        await databaseClient.createEventRsvp(
          userId,
          event.id,
          event.title,
          event.date,
          event.location
        );
      }
    } catch (error) {
      console.error('Error toggling RSVP:', error);
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
    { id: 'now' as const, label: 'Now' },
    { id: 'today' as const, label: 'Today' },
    { id: 'week' as const, label: 'This Week' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.title}>Discover</Text>
            <Text style={styles.subtitle}>Campus events and activities</Text>
          </View>
        </View>

        <ScrollView
          horizontal={true}
          showsHorizontalScrollIndicator={false as boolean}
          style={styles.tabsScroll}
        >
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              onPress={() => setSelectedTab(tab.id)}
              style={[styles.tab, selectedTab === tab.id && styles.tabActive]}
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

        {!isLoading && errorMessage === null && visibleEvents.length === 0 && (
          <View style={styles.statusContainer}>
            <Text style={styles.statusText}>
              {selectedTab === 'now'
                ? 'Nothing happening right now.'
                : selectedTab === 'today'
                ? 'No events today.'
                : 'No events this week.'}
            </Text>
          </View>
        )}

        {visibleEvents.map((event) => {
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
                  <Text style={styles.eventDescription} numberOfLines={2}>
                    {event.description}
                  </Text>
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
                        style={[
                          styles.attendeeAvatar,
                          { marginLeft: index > 0 ? -8 : 0 },
                        ]}
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
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    color: '#000000',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: '#666666',
    marginTop: 2,
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
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
  },
  eventCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  eventHeader: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  eventIconBox: {
    width: 56,
    height: 56,
    backgroundColor: '#7C3AED',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventImage: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#E5E5EA',
  },
  eventIcon: {
    fontSize: 28,
  },
  eventInfo: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  eventDescription: {
    fontSize: 13,
    color: '#666666',
    marginBottom: 6,
  },
  eventDetail: {
    fontSize: 13,
    color: '#666666',
    marginBottom: 2,
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
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  attendeesText: {
    fontSize: 13,
    color: '#666666',
  },
  eventActions: {
    flexDirection: 'row',
    gap: 8,
  },
  rsvpButton: {
    backgroundColor: '#8C1515',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    minWidth: 84,
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
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  rsvpButtonTextGoing: {
    color: '#8C1515',
  },
  shareButton: {
    backgroundColor: '#F2F2F7',
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareButtonText: {
    fontSize: 16,
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
