import React, { useState } from 'react';
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
} from 'react-native';

const { height: WINDOW_HEIGHT } = Dimensions.get('window');
import { mockFriends } from '../data/mockData';
import { useEvents } from '../api/eventClient';
import { Event } from '../types';

// Dynamic import for react-native-maps to avoid crashes
let MapView: any = null;
let Marker: any = null;
let PROVIDER_DEFAULT: any = null;

try {
  const maps = require('react-native-maps');
  MapView = maps.default;
  Marker = maps.Marker;
  PROVIDER_DEFAULT = maps.PROVIDER_DEFAULT;
} catch (error) {
  console.log('react-native-maps not available, using fallback');
}

export default function MapScreen() {
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'friends' | 'events'>('all');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const { events } = useEvents();

  const filters = [
    { id: 'all' as const, label: '📍 All', icon: '📍' },
    { id: 'friends' as const, label: '👥 Friends', icon: '👥' },
    { id: 'events' as const, label: '📅 Events', icon: '📅' },
  ];

  const hotZones = [
    { id: 'library', name: 'Green Library', icon: '📚', users: 45, color: '#3B82F6' },
    { id: 'gym', name: 'Arrillaga Gym', icon: '💪', users: 32, color: '#10B981' },
    { id: 'coho', name: 'CoHo', icon: '☕', users: 28, color: '#F97316' },
  ];

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
        {MapView ? (
          <MapView
            provider={PROVIDER_DEFAULT}
            style={styles.map}
            initialRegion={{
              latitude: 37.4275,
              longitude: -122.1697,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
          >
            {/* Current User Marker */}
            <Marker
              coordinate={{ latitude: 37.4275, longitude: -122.1697 }}
              title="You"
              pinColor="#8C1515"
            />

            {/* Friend Markers */}
            {(selectedFilter === 'all' || selectedFilter === 'friends') &&
              mockFriends.map((friend) =>
                friend.location ? (
                  <Marker
                    key={friend.id}
                    coordinate={{
                      latitude: friend.location.lat,
                      longitude: friend.location.lng,
                    }}
                    title={friend.name}
                    description={friend.location.label}
                  >
                    <View style={styles.friendMarker}>
                      <Image source={{ uri: friend.photo }} style={styles.markerImage} />
                    </View>
                  </Marker>
                ) : null
              )}

            {/* Event Markers */}
            {(selectedFilter === 'all' || selectedFilter === 'events') &&
              events.slice(0, 2).map((event) => (
                <Marker
                  key={event.id}
                  coordinate={{
                    latitude: event.locationCoords.lat,
                    longitude: event.locationCoords.lng,
                  }}
                  title={event.title}
                  description={event.location}
                  pinColor="#7C3AED"
                />
              ))}
          </MapView>
        ) : (
          <View style={styles.mapPlaceholder}>
            <Text style={styles.mapPlaceholderTitle}>🗺️ Campus Map</Text>
            <Text style={styles.mapPlaceholderText}>
              Map view will be available after running:
            </Text>
            <Text style={styles.mapPlaceholderCode}>npx expo prebuild</Text>
            <Text style={styles.mapPlaceholderCode}>npx expo run:ios</Text>
            <Text style={styles.mapPlaceholderSubtext}>
              For now, see the list below for nearby friends and events.
            </Text>
          </View>
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
