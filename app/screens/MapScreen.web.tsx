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
  ActivityIndicator,
} from 'react-native';
import L from 'leaflet';

import { useEvents, userEventRowToEvent, isUserEventId, formatDateLabel } from '../api/eventClient';
import { Event } from '../types';
import { getFriendLocations, updateMyLocation, subscribeFriendLocations, FriendLocation } from '../../database/locations';
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

export default function MapScreen() {
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'friends' | 'events'>('all');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const { events: feedEvents } = useEvents();
  const [userEventRows, setUserEventRows] = useState<UserEventRow[]>([]);

  // Map refs
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const watchIdRef = useRef<number | null>(null);
  const [mapReady, setMapReady] = useState(false);

  // Filter to only show today's events on the map
  const todayLabel = formatDateLabel(new Date());
  const allEvents: Event[] = [
    ...userEventRows.map(userEventRowToEvent),
    ...feedEvents,
  ];
  const events = allEvents.filter((event) => event.date === todayLabel);

  // User location state
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationLoading, setLocationLoading] = useState(true);

  // Friends location state
  const [friendLocations, setFriendLocations] = useState<FriendLocation[]>([]);
  const [friendsLoading, setFriendsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [friendIds, setFriendIds] = useState<Set<string>>(new Set());

  const filters = [
    { id: 'all' as const, label: '📍 All', icon: '📍' },
    { id: 'friends' as const, label: '👥 Friends', icon: '👥' },
    { id: 'events' as const, label: '📅 Events', icon: '📅' },
  ];

  // Load Leaflet CSS from CDN (works in both dev and production)
  useEffect(() => {
    console.log('[MapScreen.web] Component mounted, loading CSS');

    // Check if Leaflet CSS is already loaded
    const existingLink = document.querySelector('link[href*="leaflet.css"]');
    if (existingLink) {
      console.log('[MapScreen.web] Leaflet CSS already exists');
      return;
    }

    // Create and inject CSS link
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
    link.crossOrigin = '';

    link.onload = () => {
      console.log('[MapScreen.web] ✓ Leaflet CSS loaded from CDN');
    };

    link.onerror = () => {
      console.error('[MapScreen.web] ✗ Failed to load Leaflet CSS');
    };

    document.head.appendChild(link);
  }, []);

  // Initialize Leaflet map - run after loading completes
  useEffect(() => {
    // Only initialize after location loading is done
    if (locationLoading || !userLocation || friendsLoading) {
      console.log('[MapScreen.web] Waiting for data to load before initializing map');
      return;
    }

    if (mapRef.current) {
      console.log('[MapScreen.web] Map already initialized, skipping');
      return;
    }

    if (!mapContainerRef.current) {
      console.error('[MapScreen.web] Container ref is null, cannot initialize');
      return;
    }

    // Delay to ensure DOM and CSS are ready
    console.log('[MapScreen.web] Starting map initialization...');
    const timer = setTimeout(() => {
      if (!mapContainerRef.current) {
        console.error('[MapScreen.web] ✗ Container ref became null');
        return;
      }

      try {
        console.log('[MapScreen.web] Initializing Leaflet map...');
        console.log('[MapScreen.web] Container dimensions:', {
          width: mapContainerRef.current.offsetWidth,
          height: mapContainerRef.current.offsetHeight,
        });

        // Create map
        const map = L.map(mapContainerRef.current, {
          zoomControl: true,
          attributionControl: false,
        }).setView([userLocation.latitude, userLocation.longitude], 15);

        // Add tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '© OpenStreetMap contributors',
        }).addTo(map);

        mapRef.current = map;
        console.log('[MapScreen.web] ✓ Map initialized successfully!');

        // Force Leaflet to recalculate map size (important for proper tile rendering)
        setTimeout(() => {
          map.invalidateSize();
          console.log('[MapScreen.web] ✓ Map size invalidated');
          // Signal that map is fully ready for markers
          setMapReady(true);
          console.log('[MapScreen.web] ✓ Map is ready for markers');
        }, 200);
      } catch (error) {
        console.error('[MapScreen.web] ✗ Init error:', error);
      }
    }, 500);

    return () => {
      clearTimeout(timer);
      if (mapRef.current) {
        console.log('[MapScreen.web] Cleaning up map');
        mapRef.current.remove();
        mapRef.current = null;
        setMapReady(false);
      }
    };
  }, [locationLoading, userLocation, friendsLoading]);

  // Get browser location and watch for updates
  useEffect(() => {
    console.log('[MapScreen.web] Setting up geolocation...');

    if (!('geolocation' in navigator)) {
      console.log('[MapScreen.web] Geolocation not supported, using Stanford default');
      setUserLocation({ latitude: 37.4275, longitude: -122.1697 });
      setLocationLoading(false);
      return;
    }

    // Track last location to prevent excessive updates
    let lastLocation: { latitude: number; longitude: number } | null = null;

    // Helper to check if location changed significantly (>10 meters)
    const hasLocationChanged = (newLat: number, newLng: number): boolean => {
      if (!lastLocation) return true;
      const distance = calculateDistance(lastLocation.latitude, lastLocation.longitude, newLat, newLng);
      return distance > 0.006; // ~10 meters in miles
    };

    // Get initial position
    console.log('[MapScreen.web] Requesting geolocation permission...');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        console.log('[MapScreen.web] ✓ Got user location:', newLocation);
        lastLocation = newLocation;
        setUserLocation(newLocation);
        setLocationLoading(false);

        // Center map on user location
        if (mapRef.current) {
          mapRef.current.setView([newLocation.latitude, newLocation.longitude], 15);
        }

        // Update location to database
        if (currentUserId) {
          updateMyLocation(
            currentUserId,
            newLocation.latitude,
            newLocation.longitude,
            position.coords.accuracy || undefined
          );
        }
      },
      (error) => {
        console.log('[MapScreen.web] Geolocation error:', error.message);
        // Default to Stanford campus
        console.log('[MapScreen.web] Using Stanford default location');
        setUserLocation({ latitude: 37.4275, longitude: -122.1697 });
        setLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );

    // Watch position for continuous updates (throttled)
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const newLat = position.coords.latitude;
        const newLng = position.coords.longitude;

        // Only update state if moved significantly (prevents constant re-renders)
        if (hasLocationChanged(newLat, newLng)) {
          const newLocation = {
            latitude: newLat,
            longitude: newLng,
          };
          console.log('[MapScreen.web] Location changed significantly, updating');
          lastLocation = newLocation;
          setUserLocation(newLocation);

          // Update location to database
          if (currentUserId) {
            updateMyLocation(
              currentUserId,
              newLocation.latitude,
              newLocation.longitude,
              position.coords.accuracy || undefined
            );
          }
        }
      },
      (error) => {
        console.log('Watch position error:', error.message);
      },
      { enableHighAccuracy: false, maximumAge: 60000, timeout: 27000 } // Reduced accuracy and longer cache for battery
    );

    watchIdRef.current = watchId;

    // Cleanup
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [currentUserId]);

  // Update markers when data changes
  useEffect(() => {
    console.log('[MapScreen.web] Markers update triggered', {
      mapReady,
      hasMap: !!mapRef.current,
      hasUserLocation: !!userLocation,
      userLocation: userLocation,
      friendCount: friendLocations.length,
      eventCount: events.length,
      filter: selectedFilter,
    });

    if (!mapReady || !mapRef.current || !userLocation) {
      console.log('[MapScreen.web] Skipping markers - map not ready, no map instance, or no user location');
      return;
    }

    // Clear old markers
    console.log('[MapScreen.web] Clearing', markersRef.current.length, 'old markers');
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // Add user location marker
    console.log('[MapScreen.web] Adding user marker at', userLocation);
    const userMarker = L.marker([userLocation.latitude, userLocation.longitude], {
      icon: L.divIcon({
        className: 'custom-marker',
        html: '<div style="background-color: #8C1515; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
        iconSize: [26, 26],
      }),
    })
      .addTo(mapRef.current)
      .bindPopup('<b>You</b><br>Your current location');
    markersRef.current.push(userMarker);
    console.log('[MapScreen.web] ✓ User marker added');

    // Add friend markers
    if (selectedFilter === 'all' || selectedFilter === 'friends') {
      console.log('[MapScreen.web] Adding', friendLocations.length, 'friend markers');
      friendLocations.forEach((friendLoc) => {
        const color = friendLoc.isOnline ? '#10B981' : '#6B7280';
        const status = friendLoc.isOnline ? 'Online' : 'Last seen';
        const timeAgo = formatTimeAgo(friendLoc.timestamp);

        const friendMarker = L.marker([friendLoc.latitude, friendLoc.longitude], {
          icon: L.divIcon({
            className: 'custom-marker',
            html: `<div style="background-color: ${color}; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white;"></div>`,
            iconSize: [20, 20],
          }),
        })
          .addTo(mapRef.current!)
          .bindPopup(`<b>${friendLoc.friend.name}</b><br>${status}: ${timeAgo}`);
        markersRef.current.push(friendMarker);
      });
      console.log('[MapScreen.web] ✓ Friend markers added');
    }

    // Add event markers
    if (selectedFilter === 'all' || selectedFilter === 'events') {
      const eventsToShow = events.slice(0, 20);
      console.log('[MapScreen.web] Adding', eventsToShow.length, 'event markers');
      eventsToShow.forEach((event) => {
        const color = isUserEventId(event.id) ? '#F59E0B' : '#7C3AED';

        const eventMarker = L.marker([event.locationCoords.lat, event.locationCoords.lng], {
          icon: L.divIcon({
            className: 'custom-marker',
            html: `<div style="background-color: ${color}; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white;"></div>`,
            iconSize: [20, 20],
          }),
        })
          .addTo(mapRef.current!)
          .bindPopup(`<b>${event.title}</b><br>${event.location}`);
        markersRef.current.push(eventMarker);
      });
      console.log('[MapScreen.web] ✓ Event markers added');
    }

    console.log('[MapScreen.web] ✓ Total markers on map:', markersRef.current.length);
  }, [mapReady, userLocation, friendLocations, events, selectedFilter]);

  // Get current user and friend locations on mount, and subscribe to updates
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    let refreshTimeout: ReturnType<typeof setTimeout> | null = null;
    let currentFriendIds = new Set<string>();

    const loadData = async () => {
      try {
        // Get current user
        const user = await getCurrentUser();
        if (user) {
          setCurrentUserId(user.id);

          // Load friend locations
          const loadFriendLocations = async () => {
            const locations = await getFriendLocations(user.id);
            setFriendLocations(locations);

            // Update friend IDs set for filtering
            currentFriendIds = new Set(locations.map((loc) => loc.friend.id));
            setFriendIds(currentFriendIds);
          };

          await loadFriendLocations();

          // Subscribe to real-time location updates
          unsubscribe = subscribeFriendLocations(user.id, (updatedUserId: string) => {
            // Only refresh if the updated user is a friend
            if (currentFriendIds.has(updatedUserId)) {
              // Debounce: clear existing timeout and set a new one
              if (refreshTimeout) {
                clearTimeout(refreshTimeout);
              }
              refreshTimeout = setTimeout(() => {
                loadFriendLocations();
              }, 2000); // Wait 2 seconds before refreshing
            }
          });
        }
      } catch (error) {
        console.error('Error loading friend data:', error);
      } finally {
        setFriendsLoading(false);
      }
    };

    loadData();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
      if (refreshTimeout) {
        clearTimeout(refreshTimeout);
      }
    };
  }, [userLocation]);

  // Refresh friend locations when user returns to this tab
  useFocusEffect(
    useCallback(() => {
      const refreshFriendLocations = async () => {
        if (currentUserId) {
          try {
            const locations = await getFriendLocations(currentUserId);
            setFriendLocations(locations);
          } catch (error) {
            console.error('Error refreshing friend locations:', error);
          }
        }
      };

      refreshFriendLocations();
    }, [currentUserId])
  );

  // Load user-created events
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      const loadUserEvents = async () => {
        try {
          const rows = await databaseClient.getUserEvents(currentUserId || undefined);
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
    }, [currentUserId])
  );

  // Auto-refresh user events
  useEffect(() => {
    const unsubscribe = databaseClient.subscribeUserEvents(async () => {
      try {
        const rows = await databaseClient.getUserEvents(currentUserId || undefined);
        setUserEventRows(rows);
      } catch (error) {
        console.error('Error refreshing user events for map:', error);
      }
    });
    return unsubscribe;
  }, [currentUserId]);

  // Refresh on privacy settings change
  useEffect(() => {
    if (currentUserId === null) {
      return;
    }
    const unsubscribe = databaseClient.subscribeProfileUpdates(async () => {
      try {
        const locations = await getFriendLocations(currentUserId);
        setFriendLocations(locations);
      } catch (error) {
        console.error('Error refreshing friend locations on profile update:', error);
      }
    });
    return unsubscribe;
  }, [currentUserId]);

  // Debug logging
  console.log('[MapScreen.web] Render - States:', {
    locationLoading,
    userLocation: userLocation ? `${userLocation.latitude}, ${userLocation.longitude}` : null,
    friendsLoading,
    showingMap: !locationLoading && userLocation && !friendsLoading,
  });

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
          <>
            <div ref={mapContainerRef} style={{ height: '100%', width: '100%' }} />
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
          </>
        )}
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
                      <View
                        style={[
                          styles.onlineIndicator,
                          { backgroundColor: friendLoc.isOnline ? '#10B981' : '#6B7280' },
                        ]}
                      />
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

      <EventDetailsModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />
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
  legend: {
    position: 'absolute',
    bottom: 16,
    left: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 10,
    padding: 10,
    zIndex: 1000, // Ensure it appears above Leaflet map layers
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
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
