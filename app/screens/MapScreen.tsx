import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  SafeAreaView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import WebView from 'react-native-webview';
import * as Location from 'expo-location';

import { useEvents, userEventRowToEvent, isUserEventId } from '../api/eventClient';
import { Event } from '../types';
import { getFriendLocations, updateMyLocation, FriendLocation } from '../../database/locations';
import { getCurrentUser } from '../../database/auth';
import { databaseClient, UserEventRow } from '../../database/databaseClient';
import EventDetailsModal from './EventDetailsModal';

// Helper function to calculate distance between two coordinates (in miles)
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Helper function to format time ago
const formatTimeAgo = (timestamp: string): string => {
  const now = new Date();
  const time = new Date(timestamp);
  const diffMs = now.getTime() - time.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
};

// Generate HTML for Leaflet map
const generateMapHTML = (
  friendsData: FriendLocation[],
  eventsData: Event[],
  filter: 'all' | 'friends' | 'events',
  userLat: number,
  userLng: number
) => {
  const markers: string[] = [];

  // Add user location marker
  markers.push(`
    L.marker([${userLat}, ${userLng}], {
      icon: L.divIcon({
        className: 'custom-marker',
        html: '<div style="background-color: #8C1515; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
        iconSize: [26, 26]
      })
    }).addTo(map).bindPopup('<b>You</b><br>Your current location');
  `);

  // Add friend markers
  if (filter === 'all' || filter === 'friends') {
    friendsData.forEach((friendLoc) => {
      const color = friendLoc.isOnline ? '#10B981' : '#6B7280'; // Green if online, gray if offline
      const status = friendLoc.isOnline ? 'Online' : 'Last seen';
      const timeAgo = new Date(friendLoc.timestamp).toLocaleString();
      const friendName = friendLoc.friend.name.replace(/'/g, "\\'");

      markers.push(`
        L.marker([${friendLoc.latitude}, ${friendLoc.longitude}], {
          icon: L.divIcon({
            className: 'custom-marker',
            html: '<div style="background-color: ` + color + `; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white;"></div>',
            iconSize: [20, 20]
          })
        }).addTo(map).bindPopup('<b>` + friendName + `</b><br>` + status + `: ` + timeAgo + `');
      `);
    });
  }

  // Add event markers. User-created events get a distinct color so they
  // stand out from the Stanford RSS feed events.
  if (filter === 'all' || filter === 'events') {
    eventsData.slice(0, 20).forEach((event) => {
      const eventTitle = event.title.replace(/'/g, "\\'");
      const eventLocation = event.location.replace(/'/g, "\\'");
      const color = isUserEventId(event.id) ? '#F59E0B' : '#7C3AED';

      markers.push(`
        L.marker([${event.locationCoords.lat}, ${event.locationCoords.lng}], {
          icon: L.divIcon({
            className: 'custom-marker',
            html: '<div style="background-color: ` + color + `; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white;"></div>',
            iconSize: [20, 20]
          })
        }).addTo(map).bindPopup('<b>` + eventTitle + `</b><br>` + eventLocation + `');
      `);
    });
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        body { margin: 0; padding: 0; }
        #map { width: 100%; height: 100vh; }
        .custom-marker { background: none; border: none; }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        var map = L.map('map', {
          zoomControl: true,
          attributionControl: false
        }).setView([${userLat}, ${userLng}], 15);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19
        }).addTo(map);

        ${markers.join('\n')}
      </script>
    </body>
    </html>
  `;
};

export default function MapScreen() {
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'friends' | 'events'>('all');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const { events: feedEvents } = useEvents();
  const [userEventRows, setUserEventRows] = useState<UserEventRow[]>([]);
  const webViewRef = useRef<WebView>(null);

  // User-created events show their own markers + appear in the Nearby Events
  // list. They sit ahead of the feed events so they're easy to find.
  const events: Event[] = [
    ...userEventRows.map(userEventRowToEvent),
    ...feedEvents,
  ];

  // User location state
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationLoading, setLocationLoading] = useState(true);

  // Friends location state
  const [friendLocations, setFriendLocations] = useState<FriendLocation[]>([]);
  const [friendsLoading, setFriendsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const filters = [
    { id: 'all' as const, label: '📍 All', icon: '📍' },
    { id: 'friends' as const, label: '👥 Friends', icon: '👥' },
    { id: 'events' as const, label: '📅 Events', icon: '📅' },
  ];

  // Get current user and friend locations on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        // Get current user
        const user = await getCurrentUser();
        if (user) {
          setCurrentUserId(user.id);

          // Load friend locations
          const locations = await getFriendLocations(user.id);
          setFriendLocations(locations);
        }
      } catch (error) {
        console.error('Error loading friend data:', error);
      } finally {
        setFriendsLoading(false);
      }
    };

    loadData();
  }, []);

  // Load user-created events so they show up as map markers alongside the
  // Stanford RSS feed. Re-run on every focus so events created in Discover
  // appear when the user switches back to this tab.
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      const loadUserEvents = async () => {
        try {
          const rows = await databaseClient.getUserEvents();
          if (!cancelled) {
            setUserEventRows(rows);
          }
        } catch (error) {
          console.error('Error loading user events for map:', error);
        }
      };
      loadUserEvents();
      return () => {
        cancelled = true;
      };
    }, [])
  );

  // Get user location on mount and update to database
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.log('Location permission denied');
          // Default to Stanford campus if permission denied
          setUserLocation({ latitude: 37.4275, longitude: -122.1697 });
          setLocationLoading(false);
          return;
        }

        const location = await Location.getCurrentPositionAsync({});
        const newLocation = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };
        setUserLocation(newLocation);

        // Update location to database if user is logged in
        if (currentUserId) {
          await updateMyLocation(
            currentUserId,
            newLocation.latitude,
            newLocation.longitude,
            location.coords.accuracy || undefined
          );
        }
      } catch (error) {
        console.log('Error getting location:', error);
        // Default to Stanford campus if error
        setUserLocation({ latitude: 37.4275, longitude: -122.1697 });
      } finally {
        setLocationLoading(false);
      }
    })();
  }, [currentUserId]);

  // No need for this effect anymore - we'll use key prop to force re-render
  // useEffect(() => {
  //   if (webViewRef.current && userLocation) {
  //     webViewRef.current.reload();
  //   }
  // }, [selectedFilter, userLocation]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Campus Map</Text>
        <ScrollView
          horizontal={true}
          showsHorizontalScrollIndicator={false as boolean}
          style={styles.filterScroll}
        >
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter.id}
              onPress={() => setSelectedFilter(filter.id)}
              style={[
                styles.filterButton,
                selectedFilter === filter.id && styles.filterButtonActive,
              ]}
            >
              <Text
                style={[
                  styles.filterText,
                  selectedFilter === filter.id && styles.filterTextActive,
                ]}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.mapContainer}>
        {locationLoading || !userLocation || friendsLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#8C1515" />
            <Text style={styles.loadingText}>Loading map...</Text>
          </View>
        ) : (
          <WebView
            key={selectedFilter} // Force re-render when filter changes
            ref={webViewRef}
            originWhitelist={['*']}
            source={{
              html: generateMapHTML(
                friendLocations,
                events,
                selectedFilter,
                userLocation.latitude,
                userLocation.longitude
              )
            }}
            style={styles.map}
            javaScriptEnabled={true}
            domStorageEnabled={true}
          />
        )}

        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#8C1515' }]} />
            <Text style={styles.legendText}>You</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
            <Text style={styles.legendText}>Friends</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#7C3AED' }]} />
            <Text style={styles.legendText}>Events</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
            <Text style={styles.legendText}>By students</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.infoSection} showsVerticalScrollIndicator={false as boolean}>
        {(selectedFilter === 'all' || selectedFilter === 'friends') && (
          <>
            <Text style={styles.sectionTitle}>
              Nearby Friends {friendLocations.length > 0 && `(${friendLocations.length})`}
            </Text>
            {friendLocations.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No friends with location data yet</Text>
              </View>
            ) : (
              friendLocations.map((friendLoc) => {
                // Calculate distance from user to friend
                const distance = userLocation
                  ? calculateDistance(
                      userLocation.latitude,
                      userLocation.longitude,
                      friendLoc.latitude,
                      friendLoc.longitude
                    )
                  : 0;

                const locationLabel = friendLoc.isOnline
                  ? 'Online now'
                  : `Last seen ${formatTimeAgo(friendLoc.timestamp)}`;

                return (
                  <View key={friendLoc.friend.id} style={styles.friendCard}>
                    {friendLoc.friend.avatar_url ? (
                      <Image source={{ uri: friendLoc.friend.avatar_url }} style={styles.friendAvatar} />
                    ) : (
                      <View style={[styles.friendAvatar, styles.avatarFallback]}>
                        <Text style={styles.avatarFallbackText}>
                          {friendLoc.friend.name.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                    )}
                    <View style={styles.friendInfo}>
                      <Text style={styles.friendName}>{friendLoc.friend.name}</Text>
                      <Text style={styles.friendLocation}>{locationLabel}</Text>
                    </View>
                    <View style={styles.friendActions}>
                      <Text style={styles.friendDistance}>{distance.toFixed(2)} mi</Text>
                      <View style={[styles.onlineIndicator, { backgroundColor: friendLoc.isOnline ? '#10B981' : '#6B7280' }]} />
                    </View>
                  </View>
                );
              })
            )}
          </>
        )}

        {(selectedFilter === 'all' || selectedFilter === 'events') && (
          <>
            <Text style={styles.sectionTitle}>Nearby Events</Text>
            {events.slice(0, 10).map((event) => (
              <View key={event.id} style={styles.eventCard}>
                {event.imageUrl !== undefined ? (
                  <Image source={{ uri: event.imageUrl }} style={styles.eventImage} />
                ) : (
                  <View style={styles.eventIconBox}>
                    <Text style={styles.eventIcon}>{event.icon}</Text>
                  </View>
                )}
                <View style={styles.eventInfo}>
                  <Text style={styles.eventTitle}>{event.title}</Text>
                  <Text style={styles.eventLocation}>{event.location}</Text>
                </View>
                <View style={styles.eventActions}>
                  <Text style={styles.eventTime}>{event.time}</Text>
                  <TouchableOpacity onPress={() => setSelectedEvent(event)}>
                    <Text style={styles.detailsButton}>Details</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </>
        )}
      </ScrollView>

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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666666',
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  filterScroll: {
    flexGrow: 0,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: '#8C1515',
  },
  filterText: {
    fontSize: 14,
    color: '#666666',
  },
  filterTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  mapContainer: {
    height: 400,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  mapPlaceholder: {
    flex: 1,
    backgroundColor: '#E8F0E8',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  mapPlaceholderTitle: {
    fontSize: 48,
    marginBottom: 16,
  },
  mapPlaceholderText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 12,
  },
  mapPlaceholderCode: {
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#8C1515',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginVertical: 4,
  },
  mapPlaceholderSubtext: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
    marginTop: 16,
  },
  friendMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    overflow: 'hidden',
  },
  markerImage: {
    width: '100%',
    height: '100%',
  },
  legend: {
    position: 'absolute',
    bottom: 16,
    left: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 10,
    padding: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  legendText: {
    fontSize: 10,
    color: '#666666',
  },
  infoSection: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    marginTop: 8,
    marginBottom: 12,
  },
  zoneCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  zoneIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  zoneIconText: {
    fontSize: 20,
  },
  zoneName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
  },
  zoneUsers: {
    fontSize: 14,
    color: '#666666',
  },
  friendCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  friendAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
  },
  friendLocation: {
    fontSize: 14,
    color: '#666666',
  },
  friendActions: {
    alignItems: 'flex-end',
  },
  friendDistance: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  messageButton: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
  },
  eventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3E8FF',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  eventIconBox: {
    width: 40,
    height: 40,
    backgroundColor: '#7C3AED',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  eventImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E5E5EA',
    marginRight: 12,
  },
  eventIcon: {
    fontSize: 20,
  },
  eventInfo: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
  },
  eventLocation: {
    fontSize: 14,
    color: '#666666',
  },
  eventActions: {
    alignItems: 'flex-end',
  },
  eventTime: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  detailsButton: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8C1515',
  },
  emptyState: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: '#999999',
    textAlign: 'center',
  },
  avatarFallback: {
    backgroundColor: '#F4E8E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarFallbackText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#8C1515',
  },
  onlineIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 4,
  },
});
