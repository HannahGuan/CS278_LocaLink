import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  SafeAreaView,
  Alert,
} from 'react-native';
import { mockDiscoverUsers, mockEvents, mockFriends } from '../data/mockData';

export default function DiscoverScreen() {
  const [currentUserIndex, setCurrentUserIndex] = useState(0);
  const currentDiscoverUser = mockDiscoverUsers[currentUserIndex];

  const handlePass = () => {
    if (currentUserIndex < mockDiscoverUsers.length - 1) {
      setCurrentUserIndex(currentUserIndex + 1);
    } else {
      setCurrentUserIndex(0);
    }
  };

  const handleWave = () => {
    Alert.alert('Wave Sent!', `You sent a wave to ${currentDiscoverUser.name}!`);
    handlePass();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false as boolean}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Discover</Text>
            <Text style={styles.subtitle}>Connect with new people and find events</Text>
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>New People Nearby</Text>
              <Text style={styles.distanceText}>📍 Within 0.5 mi</Text>
            </View>

            {currentDiscoverUser && (
              <View style={styles.card}>
                <View style={styles.imageContainer}>
                  <Image
                    source={{ uri: currentDiscoverUser.photo }}
                    style={styles.profileImage}
                  />
                  <View style={styles.distanceBadge}>
                    <Text style={styles.distanceBadgeText}>
                      📍 {currentDiscoverUser.distance} mi
                    </Text>
                  </View>
                </View>

                <View style={styles.cardContent}>
                  <Text style={styles.userName}>{currentDiscoverUser.name}</Text>
                  <Text style={styles.userInfo}>
                    {currentDiscoverUser.year} • {currentDiscoverUser.major}
                  </Text>

                  <View style={styles.interestsSection}>
                    <Text style={styles.interestsLabel}>Shared interests</Text>
                    <View style={styles.interestsContainer}>
                      {currentDiscoverUser.interests.map((interest) => (
                        <View key={interest} style={styles.interestTag}>
                          <Text style={styles.interestText}>{interest}</Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  <Text style={styles.mutualFriends}>👥 2 mutual friends</Text>

                  <View style={styles.actions}>
                    <TouchableOpacity
                      style={styles.passButton}
                      onPress={handlePass}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.passButtonText}>✕ Pass</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.waveButton}
                      onPress={handleWave}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.waveButtonText}>❤️ Wave</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recommended Events</Text>
              <TouchableOpacity>
                <Text style={styles.seeAllText}>See all →</Text>
              </TouchableOpacity>
            </View>

            {mockEvents.slice(0, 3).map((event) => (
              <View key={event.id} style={styles.eventCard}>
                <View style={styles.eventIconBox}>
                  <Text style={styles.eventIcon}>{event.icon}</Text>
                </View>
                <View style={styles.eventContent}>
                  <Text style={styles.eventTitle}>{event.title}</Text>
                  <Text style={styles.eventDetail}>📍 {event.location}</Text>
                  <Text style={styles.eventDetail}>
                    📅 {event.time} • {event.date}
                  </Text>
                  <Text style={styles.eventDetail}>
                    👥 {event.attendees.length} friends attending
                  </Text>
                  <View style={styles.eventActions}>
                    <TouchableOpacity>
                      <Text style={styles.rsvpText}>RSVP</Text>
                    </TouchableOpacity>
                    <TouchableOpacity>
                      <Text style={styles.shareText}>Share</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>
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
  title: {
    fontSize: 34,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 17,
    color: '#666666',
  },
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '500',
    color: '#000000',
  },
  distanceText: {
    fontSize: 14,
    color: '#666666',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  imageContainer: {
    position: 'relative',
  },
  profileImage: {
    width: '100%',
    height: 400,
  },
  distanceBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  distanceBadgeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  cardContent: {
    padding: 24,
  },
  userName: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  userInfo: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 16,
  },
  interestsSection: {
    marginBottom: 16,
  },
  interestsLabel: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  interestTag: {
    backgroundColor: '#F4E8E9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  interestText: {
    fontSize: 14,
    color: '#6B0F0F',
  },
  mutualFriends: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 24,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  passButton: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  passButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666666',
  },
  waveButton: {
    flex: 1,
    backgroundColor: '#8C1515',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  waveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8C1515',
  },
  eventCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    gap: 16,
  },
  eventIconBox: {
    width: 64,
    height: 64,
    backgroundColor: '#F3E8FF',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventIcon: {
    fontSize: 30,
  },
  eventContent: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 8,
  },
  eventDetail: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  eventActions: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 12,
  },
  rsvpText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7C3AED',
  },
  shareText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
  },
});
