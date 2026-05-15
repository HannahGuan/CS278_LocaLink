import React, { useEffect, useState } from 'react';
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
  ActivityIndicator,
  Modal,
} from 'react-native';
import { mockDiscoverUsers } from '../data/mockData';
import { getCurrentUser } from '../../database/auth';
import {
  databaseClient,
  IncomingFriendRequest,
  PendingFriendRequest,
} from '../../database/databaseClient';
import {
  addFriendByEmail,
  AddFriendOutcome,
} from '../../database/friendRequests';
import { getFriends } from '../../database/friends';
import { FriendWithDetails } from '../../types';

type TabType = 'friends' | 'nearby';

export default function FriendsScreen({ navigation }: any) {
  const [selectedTab, setSelectedTab] = useState<TabType>('friends');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [friends, setFriends] = useState<FriendWithDetails[]>([]);
  const [pendingRequests, setPendingRequests] = useState<PendingFriendRequest[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<IncomingFriendRequest[]>([]);
  const [isLoadingFriends, setIsLoadingFriends] = useState(true);
  const [isLoadingPending, setIsLoadingPending] = useState(true);
  const [isLoadingIncoming, setIsLoadingIncoming] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [respondingRequestId, setRespondingRequestId] = useState<string | null>(null);
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);

  const tabs = [
    { id: 'friends' as const, label: 'Friends', icon: '👥' },
    { id: 'nearby' as const, label: 'Nearby', icon: '📍' },
  ];

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const user = await getCurrentUser();
      if (cancelled) {
        return;
      }
      if (user === null) {
        setIsLoadingPending(false);
        return;
      }
      setCurrentUserId(user.id);
      await Promise.all([
        refreshFriends(user.id, cancelled),
        refreshPending(user.id, cancelled),
        refreshIncoming(user.id, cancelled),
      ]);
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const refreshFriends = async (userId: string, cancelled = false) => {
    setIsLoadingFriends(true);
    try {
      const friendsList = await getFriends(userId);
      if (!cancelled) {
        setFriends(friendsList);
      }
    } catch (error) {
      console.error('Error loading friends:', error);
    } finally {
      if (!cancelled) {
        setIsLoadingFriends(false);
      }
    }
  };

  const refreshPending = async (userId: string, cancelled = false) => {
    setIsLoadingPending(true);
    try {
      const requests = await databaseClient.getOutgoingPendingRequests(userId);
      if (!cancelled) {
        setPendingRequests(requests);
      }
    } catch (error) {
      console.error('Error loading pending requests:', error);
    } finally {
      if (!cancelled) {
        setIsLoadingPending(false);
      }
    }
  };

  const refreshIncoming = async (userId: string, cancelled = false) => {
    setIsLoadingIncoming(true);
    try {
      const requests = await databaseClient.getIncomingPendingRequests(userId);
      if (!cancelled) {
        setIncomingRequests(requests);
      }
    } catch (error) {
      console.error('Error loading incoming requests:', error);
    } finally {
      if (!cancelled) {
        setIsLoadingIncoming(false);
      }
    }
  };

  const handleRespondToRequest = async (
    request: IncomingFriendRequest,
    action: 'accept' | 'decline'
  ) => {
    if (currentUserId === null || respondingRequestId !== null) {
      return;
    }
    setRespondingRequestId(request.id);
    try {
      if (action === 'accept') {
        await databaseClient.acceptFriendRequest(request.id);
      } else {
        await databaseClient.declineFriendRequest(request.id);
      }
      await Promise.all([
        refreshIncoming(currentUserId),
        action === 'accept' ? refreshFriends(currentUserId) : Promise.resolve(),
      ]);
    } catch (error) {
      console.error(`Error ${action}ing friend request:`, error);
      Alert.alert(
        'Something went wrong',
        `We could not ${action} the request. Please try again in a moment.`
      );
    } finally {
      setRespondingRequestId(null);
    }
  };

  const announceOutcome = (outcome: AddFriendOutcome) => {
    switch (outcome.kind) {
      case 'sent':
        Alert.alert(
          'Friend Request Sent',
          `${outcome.recipient.name} will see your request and can accept it.`
        );
        return;
      case 'invalid_email':
        Alert.alert(
          'Invalid Email',
          'Please enter a valid @stanford.edu email address.'
        );
        return;
      case 'self_request':
        Alert.alert(
          'Heads up',
          "You can't send a friend request to yourself."
        );
        return;
      case 'user_not_found':
        Alert.alert(
          'Not on LocaLink Yet',
          `${outcome.email} hasn't joined the app yet. Invite them to sign up and try adding them again!`
        );
        return;
      case 'already_friends':
        Alert.alert(
          'Already Friends',
          `You and ${outcome.recipient.name} are already connected.`
        );
        return;
      case 'request_pending':
        if (outcome.direction === 'outgoing') {
          Alert.alert(
            'Request Pending',
            `You already have a pending request to ${outcome.recipient.name}.`
          );
        } else {
          Alert.alert(
            'Check Your Inbox',
            `${outcome.recipient.name} already sent you a friend request.`
          );
        }
        return;
    }
  };

  const handleSendRequest = async () => {
    if (currentUserId === null) {
      Alert.alert('Not signed in', 'Please log in again to send friend requests.');
      return;
    }
    if (isSending) {
      return;
    }
    setIsSending(true);
    try {
      const outcome = await addFriendByEmail(currentUserId, searchQuery);
      announceOutcome(outcome);
      if (outcome.kind === 'sent') {
        setSearchQuery('');
        await refreshPending(currentUserId);
      }
    } catch (error) {
      console.error('Error sending friend request:', error);
      Alert.alert(
        'Something went wrong',
        'We could not send the request. Please try again in a moment.'
      );
    } finally {
      setIsSending(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Friends</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowAddFriendModal(true)}
          >
            <Text style={styles.addButtonText}>+</Text>
          </TouchableOpacity>
        </View>
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
        {/* Friends Tab */}
        {selectedTab === 'friends' && (
          <View>
            {isLoadingFriends ? (
              <View style={styles.emptyState}>
                <ActivityIndicator color="#8C1515" />
              </View>
            ) : friends.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>👥</Text>
                <Text style={styles.emptyText}>No friends yet</Text>
                <Text style={styles.emptySubtext}>Tap the + button to add friends</Text>
              </View>
            ) : (
              friends.map((friend) => (
                <View key={friend.id} style={styles.friendCard}>
                  {friend.friend.avatar_url ? (
                    <Image
                      source={{ uri: friend.friend.avatar_url }}
                      style={styles.friendAvatar}
                    />
                  ) : (
                    <View style={[styles.friendAvatar, styles.avatarFallback]}>
                      <Text style={styles.avatarFallbackText}>
                        {friend.friend.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}
                  <View style={styles.friendContent}>
                    <Text style={styles.friendName}>{friend.friend.name}</Text>
                    <Text style={styles.friendInfo}>
                      {friend.friend.year} • {friend.friend.major}
                    </Text>
                    {friend.friend.bio && (
                      <Text style={styles.friendBio} numberOfLines={1}>
                        {friend.friend.bio}
                      </Text>
                    )}
                  </View>
                </View>
              ))
            )}
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
                    onPress={() => navigation.navigate('ChatDetail', { friend: user })}
                  >
                    <Text style={styles.waveButtonText}>💬 Send Message</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Add Friends Modal */}
      <Modal
        visible={showAddFriendModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddFriendModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAddFriendModal(false)}>
              <Text style={styles.modalCloseButton}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add Friends</Text>
            <View style={{ width: 60 }} />
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Search Section */}
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
                  style={[
                    styles.searchButton,
                    isSending && styles.searchButtonDisabled,
                  ]}
                  onPress={handleSendRequest}
                  disabled={isSending}
                >
                  {isSending ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.searchButtonText}>Send Request</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Incoming Requests Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Incoming Requests</Text>
              {isLoadingIncoming ? (
                <View style={styles.emptyState}>
                  <ActivityIndicator color="#8C1515" />
                </View>
              ) : incomingRequests.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyIcon}>📭</Text>
                  <Text style={styles.emptyText}>No incoming friend requests</Text>
                </View>
              ) : (
                incomingRequests.map((request) => {
                  const isResponding = respondingRequestId === request.id;
                  return (
                    <View key={request.id} style={styles.suggestionCard}>
                      {request.sender.avatar_url ? (
                        <Image
                          source={{ uri: request.sender.avatar_url }}
                          style={styles.suggestionAvatar}
                        />
                      ) : (
                        <View style={[styles.suggestionAvatar, styles.avatarFallback]}>
                          <Text style={styles.avatarFallbackText}>
                            {request.sender.name.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                      )}
                      <View style={styles.suggestionContent}>
                        <Text style={styles.suggestionName}>
                          {request.sender.name}
                        </Text>
                        <Text style={styles.suggestionInfo}>
                          {request.sender.email}
                        </Text>
                        <View style={styles.requestActions}>
                          <TouchableOpacity
                            style={[
                              styles.acceptButton,
                              isResponding && styles.searchButtonDisabled,
                            ]}
                            onPress={() => handleRespondToRequest(request, 'accept')}
                            disabled={isResponding}
                          >
                            <Text style={styles.acceptButtonText}>Accept</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[
                              styles.declineButton,
                              isResponding && styles.searchButtonDisabled,
                            ]}
                            onPress={() => handleRespondToRequest(request, 'decline')}
                            disabled={isResponding}
                          >
                            <Text style={styles.declineButtonText}>Decline</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  );
                })
              )}
            </View>

            {/* Pending Requests Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Sent Requests</Text>
              {isLoadingPending ? (
                <View style={styles.emptyState}>
                  <ActivityIndicator color="#8C1515" />
                </View>
              ) : pendingRequests.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyIcon}>📬</Text>
                  <Text style={styles.emptyText}>No pending friend requests</Text>
                </View>
              ) : (
                pendingRequests.map((request) => (
                  <View key={request.id} style={styles.suggestionCard}>
                    {request.recipient.avatar_url ? (
                      <Image
                        source={{ uri: request.recipient.avatar_url }}
                        style={styles.suggestionAvatar}
                      />
                    ) : (
                      <View style={[styles.suggestionAvatar, styles.avatarFallback]}>
                        <Text style={styles.avatarFallbackText}>
                          {request.recipient.name.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                    )}
                    <View style={styles.suggestionContent}>
                      <Text style={styles.suggestionName}>
                        {request.recipient.name}
                      </Text>
                      <Text style={styles.suggestionInfo}>
                        {request.recipient.email}
                      </Text>
                      <Text style={styles.mutualText}>Awaiting response</Text>
                    </View>
                  </View>
                ))
              )}
            </View>
          </ScrollView>
        </SafeAreaView>
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
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  searchButtonDisabled: {
    opacity: 0.6,
  },
  requestActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  acceptButton: {
    backgroundColor: '#8C1515',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  acceptButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  declineButton: {
    backgroundColor: '#F2F2F7',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  declineButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666666',
  },
  // Friends List
  friendCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  friendAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 12,
  },
  friendContent: {
    flex: 1,
  },
  friendName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 2,
  },
  friendInfo: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 2,
  },
  friendBio: {
    fontSize: 13,
    color: '#999999',
    fontStyle: 'italic',
  },
  emptySubtext: {
    fontSize: 13,
    color: '#BBBBBB',
    marginTop: 4,
  },
  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
  },
  modalCloseButton: {
    fontSize: 17,
    color: '#8C1515',
    width: 60,
  },
  modalContent: {
    flex: 1,
  },
});
