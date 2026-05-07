import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  SafeAreaView,
  TextInput,
  Alert,
} from 'react-native';
import { mockFriends, mockDiscoverUsers } from '../data/mockData';

type TabType = 'messages' | 'nearby' | 'requests';

export default function FriendsScreen({ navigation }: any) {
  const [selectedTab, setSelectedTab] = useState<TabType>('messages');
  const [searchQuery, setSearchQuery] = useState('');

  const tabs = [
    { id: 'messages' as const, label: 'Messages', icon: '💬' },
    { id: 'nearby' as const, label: 'Nearby', icon: '📍' },
    { id: 'requests' as const, label: 'Add Friends', icon: '➕' },
  ];

  const handleWave = (userName: string) => {
    Alert.alert('Wave Sent!', `You sent a wave to ${userName}!`);
  };

  const handleSendRequest = () => {
    if (!searchQuery.trim()) {
      Alert.alert('Error', 'Please enter a Stanford email');
      return;
    }
    if (!searchQuery.endsWith('@stanford.edu')) {
      Alert.alert('Error', 'Please enter a valid @stanford.edu email');
      return;
    }
    Alert.alert('Friend Request Sent!', `Request sent to ${searchQuery}`);
    setSearchQuery('');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Friends</Text>
        <Text style={styles.subtitle}>Connect with your Stanford community</Text>

        {/* Tabs */}
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
              <Text style={styles.tabIcon}>{tab.icon}</Text>
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
        {/* Messages Tab */}
        {selectedTab === 'messages' && (
          <View>
            {mockFriends.map((friend) => (
              <TouchableOpacity
                key={friend.id}
                style={styles.messageCard}
                onPress={() => navigation.navigate('ChatDetail', { friend })}
              >
                <Image source={{ uri: friend.photo }} style={styles.messageAvatar} />
                <View style={styles.messageContent}>
                  <View style={styles.messageHeader}>
                    <Text style={styles.messageName}>{friend.name}</Text>
                    <Text style={styles.messageTime}>2h ago</Text>
                  </View>
                  <Text style={styles.messagePreview} numberOfLines={1}>
                    Hey! Want to grab coffee later?
                  </Text>
                </View>
                {/* Unread count - to be implemented */}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Nearby Tab */}
        {selectedTab === 'nearby' && (
          <View>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>People Nearby</Text>
              <Text style={styles.distanceText}>📍 Within 0.5 mi</Text>
            </View>

            {mockDiscoverUsers.map((user) => (
              <View key={user.id} style={styles.nearbyCard}>
                <Image source={{ uri: user.photo }} style={styles.nearbyAvatar} />
                <View style={styles.nearbyContent}>
                  <View style={styles.nearbyHeader}>
                    <Text style={styles.nearbyName}>{user.name}</Text>
                    <View style={styles.distanceBadge}>
                      <Text style={styles.distanceBadgeText}>{user.distance} mi</Text>
                    </View>
                  </View>
                  <Text style={styles.nearbyInfo}>
                    {user.year} • {user.major}
                  </Text>
                  <View style={styles.interestsContainer}>
                    {user.interests.slice(0, 3).map((interest) => (
                      <View key={interest} style={styles.interestTag}>
                        <Text style={styles.interestText}>{interest}</Text>
                      </View>
                    ))}
                  </View>
                  <TouchableOpacity
                    style={styles.waveButton}
                    onPress={() => handleWave(user.name)}
                  >
                    <Text style={styles.waveButtonText}>👋 Send Wave</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Add Friends Tab */}
        {selectedTab === 'requests' && (
          <View>
            <View style={styles.searchSection}>
              <Text style={styles.searchTitle}>Find Stanford Students</Text>
              <Text style={styles.searchSubtitle}>
                Search by Stanford email to send friend requests
              </Text>

              <View style={styles.searchInputContainer}>
                <TextInput
                  style={styles.searchInput}
                  placeholder="username@stanford.edu"
                  placeholderTextColor="#999"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
                <TouchableOpacity
                  style={styles.searchButton}
                  onPress={handleSendRequest}
                >
                  <Text style={styles.searchButtonText}>Send Request</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Pending Requests Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Pending Requests</Text>
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>📬</Text>
                <Text style={styles.emptyText}>No pending friend requests</Text>
              </View>
            </View>
          </View>
        )}
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
    marginBottom: 16,
  },
  tabsScroll: {
    flexGrow: 0,
    marginBottom: 4,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
    marginRight: 8,
    gap: 6,
  },
  tabActive: {
    backgroundColor: '#8C1515',
  },
  tabIcon: {
    fontSize: 16,
  },
  tabText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  // Messages
  messageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  messageAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 12,
  },
  messageContent: {
    flex: 1,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  messageName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  messageTime: {
    fontSize: 13,
    color: '#999999',
  },
  messagePreview: {
    fontSize: 14,
    color: '#666666',
  },
  unreadBadge: {
    backgroundColor: '#8C1515',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  unreadText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  // Nearby
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  distanceText: {
    fontSize: 13,
    color: '#666666',
  },
  nearbyCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  nearbyAvatar: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginRight: 12,
  },
  nearbyContent: {
    flex: 1,
  },
  nearbyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  nearbyName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  distanceBadge: {
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  distanceBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666666',
  },
  nearbyInfo: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  interestTag: {
    backgroundColor: '#F4E8E9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  interestText: {
    fontSize: 11,
    color: '#8C1515',
  },
  waveButton: {
    backgroundColor: '#8C1515',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  waveButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Add Friends
  searchSection: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 16,
  },
  searchTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  searchSubtitle: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 16,
  },
  searchInputContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#000000',
  },
  searchButton: {
    backgroundColor: '#8C1515',
    borderRadius: 10,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  searchButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: '#999999',
  },
  suggestionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  suggestionAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  suggestionContent: {
    flex: 1,
  },
  suggestionName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 2,
  },
  suggestionInfo: {
    fontSize: 13,
    color: '#666666',
    marginBottom: 2,
  },
  mutualText: {
    fontSize: 12,
    color: '#999999',
  },
  addButton: {
    width: 36,
    height: 36,
    backgroundColor: '#8C1515',
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: '300',
  },
});
