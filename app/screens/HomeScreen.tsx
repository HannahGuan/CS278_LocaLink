import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  SafeAreaView,
} from 'react-native';
import { currentUser, mockFriends, mockEvents } from '../data/mockData';

interface HomeScreenProps {
  navigation: any;
}

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const nearbyFriends = mockFriends.filter((f) => f.distance && f.distance < 0.5);
  const upcomingEvent = mockEvents[0];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false as boolean}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hey {currentUser.name.split(' ')[0]} 👋</Text>
            <View style={styles.weatherRow}>
              <Text style={styles.weatherText}>☀️ 72°F • Sunny</Text>
              <Text style={styles.timeText}>3:24 PM</Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
            <Text style={styles.settingsIcon}>⚙️</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {/* Nearby Friends Card */}
          <TouchableOpacity
            style={styles.nearbyCard}
            onPress={() => navigation.navigate('Map')}
            activeOpacity={0.9}
          >
            <View style={styles.cardHeader}>
              <View>
                <View style={styles.cardTitleRow}>
                  <Text style={styles.cardIcon}>👥</Text>
                  <Text style={styles.cardLabel}>Nearby Friends</Text>
                </View>
                <Text style={styles.cardBigText}>
                  {nearbyFriends.length} friends within 5min
                </Text>
              </View>
              <View style={styles.friendAvatars}>
                {nearbyFriends.slice(0, 3).map((friend, index) => (
                  <Image
                    key={friend.id}
                    source={{ uri: friend.photo }}
                    style={[styles.avatar, { marginLeft: index > 0 ? -12 : 0 }]}
                  />
                ))}
              </View>
            </View>
            <View style={styles.friendsList}>
              {nearbyFriends.map((friend) => (
                <View key={friend.id} style={styles.friendRow}>
                  <Text style={styles.friendName}>{friend.name}</Text>
                  <Text style={styles.friendLocation}>
                    {friend.distance} mi • {friend.location?.label}
                  </Text>
                </View>
              ))}
            </View>
          </TouchableOpacity>

          {/* Trending Event Card */}
          <TouchableOpacity
            style={styles.eventCard}
            onPress={() => navigation.navigate('Events')}
            activeOpacity={0.9}
          >
            <View>
              <View style={styles.eventTitleRow}>
                <Text style={styles.eventIcon}>📈</Text>
                <Text style={styles.eventLabel}>Trending Event</Text>
              </View>
              <Text style={styles.eventTitle}>
                {upcomingEvent.icon} {upcomingEvent.title}
              </Text>
              <View style={styles.eventDetails}>
                <View style={styles.eventDetailRow}>
                  <Text style={styles.eventDetailIcon}>🕐</Text>
                  <Text style={styles.eventDetailText}>Starts in 25 min</Text>
                </View>
                <View style={styles.eventDetailRow}>
                  <Text style={styles.eventDetailIcon}>📍</Text>
                  <Text style={styles.eventDetailText}>{upcomingEvent.location}</Text>
                </View>
              </View>
            </View>
            <View style={styles.eventAttendees}>
              <View style={styles.friendAvatars}>
                {mockFriends.slice(0, 3).map((friend, index) => (
                  <Image
                    key={friend.id}
                    source={{ uri: friend.photo }}
                    style={[styles.avatarSmall, { marginLeft: index > 0 ? -8 : 0 }]}
                  />
                ))}
              </View>
              <Text style={styles.attendeesText}>3 friends attending</Text>
            </View>
          </TouchableOpacity>

          {/* Suggested Meetup */}
          <View style={styles.suggestedCard}>
            <View style={styles.suggestedHeader}>
              <Text style={styles.suggestedIcon}>✨</Text>
              <Text style={styles.suggestedLabel}>Suggested Meetup</Text>
            </View>
            <Text style={styles.suggestedText}>
              Your friend <Text style={styles.boldText}>Sarah</Text> is studying at CoHo
              nearby
            </Text>
            <TouchableOpacity>
              <Text style={styles.suggestedAction}>Send a ping →</Text>
            </TouchableOpacity>
          </View>

          {/* Weekly Goal */}
          <View style={styles.goalCard}>
            <View style={styles.goalHeader}>
              <Text style={styles.goalIcon}>📅</Text>
              <Text style={styles.goalLabel}>This Week's Goal</Text>
            </View>
            <View style={styles.goalProgress}>
              <View style={styles.goalTextRow}>
                <Text style={styles.goalText}>Meet 3 new people</Text>
                <Text style={styles.goalCount}>2/3</Text>
              </View>
              <View style={styles.progressBarContainer}>
                <View style={[styles.progressBarFill, { width: '66%' }]} />
              </View>
            </View>
            <Text style={styles.goalDescription}>
              Almost there! Try discover mode to meet someone new
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionGrid}>
            <TouchableOpacity style={styles.actionButtonDark} activeOpacity={0.8}>
              <Text style={styles.actionIcon}>👻</Text>
              <Text style={styles.actionTextDark}>Ghost Mode</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButtonRed}
              onPress={() => navigation.navigate('Discover')}
              activeOpacity={0.8}
            >
              <Text style={styles.actionIcon}>🧭</Text>
              <Text style={styles.actionTextLight}>Discover</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButtonLight}
              onPress={() => navigation.navigate('Profile')}
              activeOpacity={0.8}
            >
              <Text style={styles.actionIcon}>👥</Text>
              <Text style={styles.actionTextDark}>Invite Friends</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButtonLight}
              onPress={() => navigation.navigate('Map')}
              activeOpacity={0.8}
            >
              <Text style={styles.actionIcon}>📍</Text>
              <Text style={styles.actionTextDark}>Check In</Text>
            </TouchableOpacity>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greeting: {
    fontSize: 34,
    fontWeight: '700',
    color: '#000000',
    letterSpacing: -0.5,
  },
  weatherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 8,
  },
  weatherText: {
    fontSize: 15,
    color: '#666666',
  },
  timeText: {
    fontSize: 15,
    color: '#666666',
  },
  settingsIcon: {
    fontSize: 28,
  },
  content: {
    padding: 16,
    gap: 12,
  },
  nearbyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  cardIcon: {
    fontSize: 20,
  },
  cardLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#8C1515',
  },
  cardBigText: {
    fontSize: 28,
    fontWeight: '600',
    color: '#000000',
  },
  friendAvatars: {
    flexDirection: 'row',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  avatarSmall: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  friendsList: {
    gap: 8,
  },
  friendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  friendName: {
    fontSize: 15,
    color: '#000000',
  },
  friendLocation: {
    fontSize: 15,
    color: '#666666',
  },
  eventCard: {
    backgroundColor: '#F3E8FF',
    borderRadius: 14,
    padding: 20,
  },
  eventTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  eventIcon: {
    fontSize: 20,
  },
  eventLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#7C3AED',
  },
  eventTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  eventDetails: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  eventDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  eventDetailIcon: {
    fontSize: 14,
  },
  eventDetailText: {
    fontSize: 15,
    color: '#666666',
  },
  eventAttendees: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  attendeesText: {
    fontSize: 15,
    color: '#666666',
  },
  suggestedCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 14,
    padding: 20,
  },
  suggestedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  suggestedIcon: {
    fontSize: 20,
  },
  suggestedLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#3B82F6',
  },
  suggestedText: {
    fontSize: 15,
    color: '#000000',
    marginBottom: 12,
  },
  boldText: {
    fontWeight: '600',
  },
  suggestedAction: {
    fontSize: 15,
    fontWeight: '600',
    color: '#3B82F6',
  },
  goalCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 14,
    padding: 20,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  goalIcon: {
    fontSize: 20,
  },
  goalLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#10B981',
  },
  goalProgress: {
    marginBottom: 12,
  },
  goalTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  goalText: {
    fontSize: 15,
    color: '#000000',
  },
  goalCount: {
    fontSize: 15,
    color: '#666666',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 4,
  },
  goalDescription: {
    fontSize: 15,
    color: '#666666',
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionButtonDark: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: '#1F2937',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  actionButtonRed: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: '#8C1515',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  actionButtonLight: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  actionIcon: {
    fontSize: 26,
  },
  actionTextDark: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000000',
  },
  actionTextLight: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
