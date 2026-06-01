import React, { useEffect, useMemo, useState } from 'react';
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
  RefreshControl,
} from 'react-native';
import {
  useEvents,
  formatDateLabel,
  userEventRowToEvent,
  isUserEventId,
} from '../api/eventClient';
import { Event } from '../types';
import { getCurrentUser } from '../../database/auth';
import { databaseClient, UserEventRow } from '../../database/databaseClient';
import { getFriends } from '../../database/friends';
import CreateEventModal from './CreateEventModal';
import EventDetailsModal from './EventDetailsModal';
import { analytics } from '../../services/analytics';

type DiscoverTab = 'now' | 'today' | 'week' | 'friends';

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

interface FilterContext {
  friendEventIds: Set<string>;
  friendOrganizerIds: Set<string>;
}

function isFriendEvent(event: Event, ctx: FilterContext): boolean {
  // An event is a "friend event" if:
  // 1. A friend has RSVPed to it, OR
  // 2. A friend created it (user-created events only)
  if (ctx.friendEventIds.has(event.id)) return true;
  if (isUserEventId(event.id) && ctx.friendOrganizerIds.has(event.organizer)) {
    return true;
  }
  return false;
}

// Parse event date string (e.g., "May 17th") into a Date object for the current year
function parseEventDate(dateLabel: string): Date | null {
  try {
    // Remove ordinal suffixes (st, nd, rd, th) from the date
    const cleanedLabel = dateLabel.replace(/(\d+)(st|nd|rd|th)/, '$1');

    // Parse month and day
    const parts = cleanedLabel.split(' ');
    if (parts.length !== 2) return null;

    const monthName = parts[0];
    const day = parseInt(parts[1], 10);
    if (isNaN(day)) return null;

    // Map month names to numbers
    const months: { [key: string]: number } = {
      'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
      'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11,
      'January': 0, 'February': 1, 'March': 2, 'April': 3, 'June': 5,
      'July': 6, 'August': 7, 'September': 8, 'October': 9, 'November': 10, 'December': 11
    };

    const month = months[monthName];
    if (month === undefined) return null;

    const currentYear = new Date().getFullYear();
    const parsed = new Date(currentYear, month, day);

    if (isNaN(parsed.getTime())) return null;
    return parsed;
  } catch {
    return null;
  }
}

// Check if an event should be visible based on recency rules:
// - User-created events from past 2 days + future: visible
// - Friend events from past 2 days + future: visible
// - Current or future events: always visible
// - Other past events: hidden
function shouldShowEvent(event: Event, ctx: FilterContext): boolean {
  const now = new Date();
  const eventDate = parseEventDate(event.date);

  if (eventDate === null) {
    return true; // Show if we can't parse the date
  }

  // Parse event time to get full datetime
  const eventMinutes = parseEventTimeToMinutes(event.time);
  if (eventMinutes !== null) {
    eventDate.setHours(Math.floor(eventMinutes / 60), eventMinutes % 60, 0, 0);
  }

  // If event is in the future or happening now, always show it
  if (eventDate >= now) return true;

  // For past events, show user-created events and friend events from the past 2 days
  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

  if (eventDate >= twoDaysAgo) {
    // Show user-created events from past 2 days
    if (isUserEventId(event.id)) {
      return true;
    }
    // Show friend events from past 2 days
    if (isFriendEvent(event, ctx)) {
      return true;
    }
  }

  // Hide other past events
  return false;
}

function filterEventsForTab(
  events: Event[],
  tab: DiscoverTab,
  ctx: FilterContext
): Event[] {
  const now = new Date();
  const todayLabel = formatDateLabel(now);

  // First, filter by recency rules
  const recentEvents = events.filter((event) => shouldShowEvent(event, ctx));

  let filtered: Event[] = [];

  if (tab === 'friends') {
    // Show friend events AND user's own created events
    filtered = recentEvents.filter((event) =>
      isFriendEvent(event, ctx) || isUserEventId(event.id)
    );
  } else if (tab === 'today') {
    filtered = recentEvents.filter((event) => event.date === todayLabel);
  } else if (tab === 'week') {
    const weekLabels = new Set<string>();
    for (let offset = 0; offset < 7; offset++) {
      const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset);
      weekLabels.add(formatDateLabel(day));
    }
    filtered = recentEvents.filter((event) => weekLabels.has(event.date));
  } else {
    // 'now': today's events that started in the last 2 hours or start in the next 30 min
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    filtered = recentEvents.filter((event) => {
      if (event.date !== todayLabel) return false;
      const eventMinutes = parseEventTimeToMinutes(event.time);
      if (eventMinutes === null) return false;
      return eventMinutes >= nowMinutes - 120 && eventMinutes <= nowMinutes + 30;
    });
  }

  // Sort events by date/time, newest first
  return filtered.sort((a, b) => {
    const dateA = parseEventDate(a.date);
    const dateB = parseEventDate(b.date);

    // If dates are invalid, keep original order
    if (!dateA || !dateB) return 0;

    // Add time to the dates for accurate sorting
    const timeA = parseEventTimeToMinutes(a.time);
    const timeB = parseEventTimeToMinutes(b.time);

    if (timeA !== null) {
      dateA.setHours(Math.floor(timeA / 60), timeA % 60, 0, 0);
    }
    if (timeB !== null) {
      dateB.setHours(Math.floor(timeB / 60), timeB % 60, 0, 0);
    }

    // Sort descending (newest first)
    return dateB.getTime() - dateA.getTime();
  });
}

export default function DiscoverScreen() {
  const [selectedTab, setSelectedTab] = useState<DiscoverTab>('today');
  const { events: feedEvents, isLoading, errorMessage } = useEvents();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [rsvpedEventIds, setRsvpedEventIds] = useState<Set<string>>(new Set());
  const [pendingRsvpEventId, setPendingRsvpEventId] = useState<string | null>(null);
  const [userEventRows, setUserEventRows] = useState<UserEventRow[]>([]);
  const [friendRsvpEventIds, setFriendRsvpEventIds] = useState<Set<string>>(new Set());
  const [friendIds, setFriendIds] = useState<Set<string>>(new Set());
  const [friendProfiles, setFriendProfiles] = useState<Map<string, { id: string; name: string }>>(new Map());
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const refreshUserEvents = async (userId?: string) => {
    try {
      console.log('Refreshing user events for userId:', userId || currentUserId);
      const rows = await databaseClient.getUserEvents(userId || currentUserId || undefined);
      console.log('Loaded user events:', rows.length, 'events');
      setUserEventRows(rows);
    } catch (error) {
      console.error('Error loading user events:', error);
    }
  };

  const refreshFriendsContext = async (userId: string) => {
    try {
      const [rsvpIds, friendIds, friendsList] = await Promise.all([
        databaseClient.getFriendsRsvpedEventIds(userId),
        databaseClient.getAcceptedFriendIds(userId),
        getFriends(userId),
      ]);
      setFriendRsvpEventIds(rsvpIds);
      setFriendIds(friendIds);

      // Build a map of friend_id -> profile for quick lookups
      const profilesMap = new Map();
      friendsList.forEach(friendWithDetails => {
        if (friendWithDetails.friend) {
          profilesMap.set(friendWithDetails.friend.id, {
            id: friendWithDetails.friend.id,
            name: friendWithDetails.friend.name,
          });
        }
      });
      setFriendProfiles(profilesMap);
    } catch (error) {
      console.error('Error loading friends context:', error);
    }
  };

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
      await Promise.all([refreshUserEvents(user.id), refreshFriendsContext(user.id)]);
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // Auto-refresh when any user creates a new event so the feed stays live
  // without requiring a tab switch.
  useEffect(() => {
    if (!currentUserId) return;

    const unsubscribe = databaseClient.subscribeUserEvents(() => {
      refreshUserEvents(currentUserId);
    });
    return unsubscribe;
  }, [currentUserId]);

  const allEvents = useMemo(() => {
    const userEvents = userEventRows.map(userEventRowToEvent);
    return [...userEvents, ...feedEvents];
  }, [userEventRows, feedEvents]);

  const filterContext: FilterContext = useMemo(
    () => ({ friendEventIds: friendRsvpEventIds, friendOrganizerIds: friendIds }),
    [friendRsvpEventIds, friendIds]
  );

  const visibleEvents = filterEventsForTab(allEvents, selectedTab, filterContext);

  const handleRefresh = async () => {
    if (!currentUserId) return;

    setRefreshing(true);
    try {
      await Promise.all([
        refreshUserEvents(currentUserId),
        refreshFriendsContext(currentUserId),
        databaseClient.getMyRsvpEventIds(currentUserId).then(setRsvpedEventIds)
      ]);
    } catch (error) {
      console.error('Error refreshing:', error);
    } finally {
      setRefreshing(false);
    }
  };

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
        analytics.eventRSVPed(event.id, false);
      } else {
        await databaseClient.createEventRsvp(
          userId,
          event.id,
          event.title,
          event.date,
          event.location
        );
        analytics.eventRSVPed(event.id, true);
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
    { id: 'friends' as const, label: '👥 Friends' },
  ];

  const sectionTitle = (() => {
    switch (selectedTab) {
      case 'now':
        return 'Happening Now';
      case 'today':
        return "Today's Events";
      case 'week':
        return 'This Week';
      case 'friends':
        return 'From Your Friends';
    }
  })();

  const emptyMessage = (() => {
    switch (selectedTab) {
      case 'now':
        return 'Nothing happening right now.';
      case 'today':
        return 'No events today.';
      case 'week':
        return 'No events this week.';
      case 'friends':
        return friendIds.size === 0
          ? 'Add friends to see what they’re up to.'
          : 'No events from your friends yet.';
    }
  })();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.title}>Discover</Text>
            <Text style={styles.subtitle}>Campus events and activities</Text>
          </View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowCreateModal(true)}
            accessibilityLabel="Create event"
          >
            <Text style={styles.addButtonText}>+</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal={true}
          showsHorizontalScrollIndicator={false as boolean}
          style={styles.tabsScroll}
        >
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              onPress={() => {
                setSelectedTab(tab.id);
                analytics.filterChanged(selectedTab, tab.id);
              }}
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

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false as boolean}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#8C1515"
            colors={['#8C1515']}
          />
        }
      >
        <Text style={styles.sectionTitle}>{sectionTitle}</Text>

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
            <Text style={styles.statusText}>{emptyMessage}</Text>
          </View>
        )}

        {visibleEvents.map((event) => {
          const isGoing = rsvpedEventIds.has(event.id);
          const isPending = pendingRsvpEventId === event.id;
          const attendeeCount = event.attendees.length + (isGoing ? 1 : 0);
          const isUserCreated = isUserEventId(event.id);
          const isFriendCreated = isUserCreated && friendIds.has(event.organizer);

          return (
            <View key={event.id} style={styles.eventCard}>
              {isUserCreated && (
                <View style={styles.userEventTag}>
                  <Text style={styles.userEventTagText}>
                    {isFriendCreated
                      ? `From ${friendProfiles.get(event.organizer)?.name || 'a friend'}`
                      : 'From a Stanford student'}
                  </Text>
                </View>
              )}
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
                  {event.description.length > 0 && (
                    <Text style={styles.eventDescription} numberOfLines={2}>
                      {event.description}
                    </Text>
                  )}
                  <Text style={styles.eventDetail}>📍 {event.location}</Text>
                  <Text style={styles.eventDetail}>
                    🕐 {event.time} • {event.date}
                  </Text>
                </View>
              </View>

              <View style={styles.eventFooter}>
                <View style={styles.attendeesRow}>
                  <Text style={styles.attendeesText}>
                    {attendeeCount} attending
                  </Text>
                </View>
                <View style={styles.eventActions}>
                  <TouchableOpacity
                    style={styles.detailsButton}
                    onPress={() => {
                      setSelectedEvent(event);
                      analytics.eventViewed(event.id, 'feed');
                    }}
                  >
                    <Text style={styles.detailsButtonText}>Details</Text>
                  </TouchableOpacity>
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

      <CreateEventModal
        visible={showCreateModal}
        currentUserId={currentUserId}
        onClose={() => setShowCreateModal(false)}
        onCreated={() => {
          console.log('Event created! Refreshing with userId:', currentUserId);
          if (currentUserId) {
            refreshUserEvents(currentUserId);
          } else {
            console.warn('No currentUserId available for refresh');
          }
        }}
      />

      <EventDetailsModal
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
      />
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
    paddingTop: 12,
    paddingHorizontal: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000000',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: '#666666',
    marginTop: 1,
  },
  addButton: {
    width: 36,
    height: 36,
    backgroundColor: '#8C1515',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 22,
    color: '#FFFFFF',
    fontWeight: '300',
  },
  tabsScroll: {
    flexGrow: 0,
  },
  tab: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: '#F2F2F7',
    marginRight: 6,
  },
  tabActive: {
    backgroundColor: '#8C1515',
  },
  tabText: {
    fontSize: 13,
    color: '#666666',
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 10,
  },
  eventCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  userEventTag: {
    alignSelf: 'flex-start',
    backgroundColor: '#F4E8E9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginBottom: 6,
  },
  userEventTagText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#8C1515',
    letterSpacing: 0.2,
  },
  eventHeader: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },
  eventIconBox: {
    width: 48,
    height: 48,
    backgroundColor: '#7C3AED',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventImage: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: '#E5E5EA',
  },
  eventIcon: {
    fontSize: 24,
  },
  eventInfo: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 3,
  },
  eventDescription: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 4,
  },
  eventDetail: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 2,
  },
  eventFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  attendeesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  attendeesText: {
    fontSize: 13,
    color: '#666666',
  },
  eventActions: {
    flexDirection: 'row',
    gap: 8,
  },
  detailsButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8C1515',
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
