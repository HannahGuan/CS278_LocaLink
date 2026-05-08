import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  SafeAreaView,
  Platform,
  Modal,
  Pressable,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import WebView from 'react-native-webview';
import * as Location from 'expo-location';

const { height: WINDOW_HEIGHT } = Dimensions.get('window');
import { mockFriends } from '../data/mockData';
import { useEvents } from '../api/eventClient';
import { Event } from '../types';

// Generate HTML for Leaflet map
const generateMapHTML = (
  friendsData: typeof mockFriends,
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
    friendsData.forEach((friend) => {
      if (friend.location) {
        markers.push(`
          L.marker([${friend.location.lat}, ${friend.location.lng}], {
            icon: L.divIcon({
              className: 'custom-marker',
              html: '<div style="background-color: #10B981; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white;"></div>',
              iconSize: [20, 20]
            })
          }).addTo(map).bindPopup('<b>${friend.name.replace(/'/g, "\\'")}</b><br>${friend.location.label.replace(/'/g, "\\'")}');
        `);
      }
    });
  }

  // Add event markers
  if (filter === 'all' || filter === 'events') {
    eventsData.slice(0, 10).forEach((event) => {
      markers.push(`
        L.marker([${event.locationCoords.lat}, ${event.locationCoords.lng}], {
          icon: L.divIcon({
            className: 'custom-marker',
            html: '<div style="background-color: #7C3AED; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white;"></div>',
            iconSize: [20, 20]
          })
        }).addTo(map).bindPopup('<b>${event.title.replace(/'/g, "\\'")}</b><br>${event.location.replace(/'/g, "\\'")}');
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
  const { events } = useEvents();
  const webViewRef = useRef<WebView>(null);

  // User location state
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationLoading, setLocationLoading] = useState(true);

  const filters = [
    { id: 'all' as const, label: '📍 All', icon: '📍' },
    { id: 'friends' as const, label: '👥 Friends', icon: '👥' },
    { id: 'events' as const, label: '📅 Events', icon: '📅' },
  ];

  // Get user location on mount
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
        setUserLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      } catch (error) {
        console.log('Error getting location:', error);
        // Default to Stanford campus if error
        setUserLocation({ latitude: 37.4275, longitude: -122.1697 });
      } finally {
        setLocationLoading(false);
      }
    })();
  }, []);

  // Reload map when filter changes
  useEffect(() => {
    if (webViewRef.current && userLocation) {
      webViewRef.current.reload();
    }
  }, [selectedFilter, userLocation]);

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
        {locationLoading || !userLocation ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#8C1515" />
            <Text style={styles.loadingText}>Loading map...</Text>
          </View>
        ) : (
          <WebView
            ref={webViewRef}
            originWhitelist={['*']}
            source={{
              html: generateMapHTML(
                mockFriends,
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
        </View>
      </View>

      <ScrollView style={styles.infoSection} showsVerticalScrollIndicator={false as boolean}>
        {(selectedFilter === 'all' || selectedFilter === 'friends') && (
          <>
            <Text style={styles.sectionTitle}>Nearby Friends</Text>
            {mockFriends.slice(0, 10).map((friend) => (
              <View key={friend.id} style={styles.friendCard}>
                <Image source={{ uri: friend.photo }} style={styles.friendAvatar} />
                <View style={styles.friendInfo}>
                  <Text style={styles.friendName}>{friend.name}</Text>
                  <Text style={styles.friendLocation}>{friend.location?.label}</Text>
                </View>
                <View style={styles.friendActions}>
                  <Text style={styles.friendDistance}>{friend.distance} mi</Text>
                  <TouchableOpacity>
                    <Text style={styles.messageButton}>Message</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
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

      <Modal
        visible={selectedEvent !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedEvent(null)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setSelectedEvent(null)}
        >
          <Pressable style={styles.modalCard} onPress={() => {}}>
            {selectedEvent !== null && (
              <ScrollView
                style={styles.modalScroll}
                contentContainerStyle={styles.modalScrollContent}
                showsVerticalScrollIndicator={true as boolean}
                bounces={true}
              >
                <View style={styles.modalHero}>
                  {selectedEvent.imageUrl !== undefined ? (
                    <Image
                      source={{ uri: selectedEvent.imageUrl }}
                      style={styles.modalHeroImage}
                    />
                  ) : (
                    <View style={styles.modalHeroFallback}>
                      <Text style={styles.modalHeroIcon}>{selectedEvent.icon}</Text>
                    </View>
                  )}
                  <TouchableOpacity
                    style={styles.modalCloseButton}
                    onPress={() => setSelectedEvent(null)}
                  >
                    <Text style={styles.modalCloseText}>✕</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.modalBody}>
                  <View style={styles.modalCategoryBadge}>
                    <Text style={styles.modalCategoryText}>
                      {selectedEvent.icon} {selectedEvent.category}
                    </Text>
                  </View>

                  <Text style={styles.modalTitle}>{selectedEvent.title}</Text>
                  <Text style={styles.modalOrganizer}>by {selectedEvent.organizer}</Text>

                  <View style={styles.modalDivider} />

                  <View style={styles.modalInfoRow}>
                    <Text style={styles.modalInfoIcon}>📅</Text>
                    <View style={styles.modalInfoContent}>
                      <Text style={styles.modalInfoLabel}>Date</Text>
                      <Text style={styles.modalInfoValue}>{selectedEvent.date}</Text>
                    </View>
                  </View>

                  <View style={styles.modalInfoRow}>
                    <Text style={styles.modalInfoIcon}>🕒</Text>
                    <View style={styles.modalInfoContent}>
                      <Text style={styles.modalInfoLabel}>Time</Text>
                      <Text style={styles.modalInfoValue}>{selectedEvent.time}</Text>
                    </View>
                  </View>

                  <View style={styles.modalInfoRow}>
                    <Text style={styles.modalInfoIcon}>📍</Text>
                    <View style={styles.modalInfoContent}>
                      <Text style={styles.modalInfoLabel}>Location</Text>
                      <Text style={styles.modalInfoValue}>{selectedEvent.location}</Text>
                    </View>
                  </View>

                  {selectedEvent.description.length > 0 && (
                    <>
                      <View style={styles.modalDivider} />
                      <Text style={styles.modalSectionLabel}>About</Text>
                      <Text style={styles.modalDescription}>
                        {selectedEvent.description}
                      </Text>
                    </>
                  )}
                </View>
              </ScrollView>
            )}
          </Pressable>
        </Pressable>
      </Modal>
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
});
