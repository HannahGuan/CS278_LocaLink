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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { getCurrentUser } from '../../database/auth';
import {
  databaseClient,
  IncomingFriendRequest,
  PendingFriendRequest,
} from '../../database/databaseClient';
import {
  addFriendByEmail,
  addFriendByProfile,
  AddFriendOutcome,
} from '../../database/friendRequests';
import { getFriends } from '../../database/friends';
import { FriendWithDetails } from '../../types';
import { Profile } from '../types';
import ChatDetailScreen from './ChatDetailScreen';
import {
  getUnreadCountsByFriend,
  subscribeToAllMessages,
  getConversations,
  Conversation,
} from '../../database/messages';
import { useUnread } from '../contexts/UnreadContext';

type TabType = 'friends' | 'nearby' | 'messages';

function formatDistance(miles: number): string {
  if (miles < 0.1) return '< 0.1 mi';
  if (miles < 10) return `${miles.toFixed(1)} mi`;
  return `${Math.round(miles)} mi`;
}

function formatTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString();
}

export default function FriendsScreen() {
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
  const [sendingFriendProfileId, setSendingFriendProfileId] = useState<string | null>(null);
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);
  const [chatFriend, setChatFriend] = useState<Profile | null>(null);
  const [unreadCounts, setUnreadCounts] = useState<Map<string, number>>(new Map());
  const [nearbyProfiles, setNearbyProfiles] = useState<
    { profile: Profile; distanceMiles: number | null }[]
  >([]);
  const [isLoadingNearby, setIsLoadingNearby] = useState<boolean>(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState<boolean>(true);
  const { refreshUnread } = useUnread();

  const tabs = [
    { id: 'friends' as const, label: 'Friends', icon: '👥' },
    { id: 'nearby' as const, label: 'Nearby', icon: '📍' },
    { id: 'messages' as const, label: 'Messages', icon: '💬' },
  ];

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const user = await getCurrentUser();
      if (cancelled) {
        return;
      }
      if (user === null) {
        setIsLoadingFriends(false);
        setIsLoadingPending(false);
        setIsLoadingIncoming(false);
        return;
      }
      setCurrentUserId(user.id);
      await Promise.all([
        refreshFriends(user.id, cancelled),
        refreshPending(user.id, cancelled),
        refreshIncoming(user.id, cancelled),
        refreshUnreadCounts(user.id),
        refreshNearby(user.id, cancelled),
        refreshConversations(user.id, cancelled),
      ]);

      // Subscribe to new messages for real-time unread updates
      const unsubscribe = subscribeToAllMessages(user.id, () => {
        refreshUnreadCounts(user.id);
        refreshConversations(user.id, false);
        refreshUnread(); // Update global badge count
      });

      return () => {
        unsubscribe();
      };
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // Auto-refresh the "Nearby" list when any profile's privacy_settings
  // change so users who flip on ghost mode disappear in real time.
  useEffect(() => {
    if (currentUserId === null) {
      return;
    }
    const unsubscribe = databaseClient.subscribeProfileUpdates(() => {
      refreshNearby(currentUserId);
    });
    return unsubscribe;
  }, [currentUserId]);

  const refreshUnreadCounts = async (userId: string) => {
    try {
      const counts = await getUnreadCountsByFriend(userId);
      setUnreadCounts(counts);
    } catch (error) {
      console.error('Error loading unread counts:', error);
    }
  };

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

  const refreshNearby = async (userId: string, cancelled = false) => {
    setIsLoadingNearby(true);
    try {
      const results = await databaseClient.getNearbyDiscoverableProfiles(userId);
      if (!cancelled) {
        setNearbyProfiles(results);
      }
    } catch (error) {
      console.error('Error loading nearby profiles:', error);
    } finally {
      if (!cancelled) {
        setIsLoadingNearby(false);
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

  const refreshConversations = async (userId: string, cancelled = false) => {
    setIsLoadingConversations(true);
    try {
      const convos = await getConversations(userId);
      if (!cancelled) {
        setConversations(convos);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      if (!cancelled) {
        setIsLoadingConversations(false);
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

  const handleAddFriendFromNearby = async (recipient: Profile) => {
    if (currentUserId === null) {
      Alert.alert('Not signed in', 'Please log in again to send friend requests.');
      return;
    }
    if (sendingFriendProfileId !== null) {
      return;
    }
    setSendingFriendProfileId(recipient.id);
    try {
      const outcome = await addFriendByProfile(currentUserId, recipient);
      announceOutcome(outcome);
      if (outcome.kind === 'sent' || outcome.kind === 'request_pending') {
        await refreshPending(currentUserId);
      }
      if (outcome.kind === 'already_friends') {
        // They became friends in another session — drop them from Nearby.
        await refreshNearby(currentUserId);
      }
    } catch (error) {
      console.error('Error sending friend request from nearby:', error);
      Alert.alert(
        'Something went wrong',
        'We could not send the request. Please try again in a moment.'
      );
    } finally {
      setSendingFriendProfileId(null);
    }
  };

  // Profiles we already have an outbound pending request to — used to swap
  // the Nearby "Add Friend" button into a disabled "Requested" state without
  // an extra round-trip.
  const outgoingPendingProfileIds = new Set(
    pendingRequests.map((request) => request.recipient.id)
  );

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
              friends.map((friend) => {
                const unreadCount = unreadCounts.get(friend.friend.id) || 0;
                return (
                  <View key={friend.id} style={styles.friendCard}>
                    <View style={styles.avatarContainer}>
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
                      {unreadCount > 0 && (
                        <View style={styles.friendUnreadBadge}>
                          <Text style={styles.friendUnreadBadgeText}>
                            {unreadCount > 9 ? '9+' : unreadCount}
                          </Text>
                        </View>
                      )}
                    </View>
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
                    <TouchableOpacity
                      style={styles.messageIconButton}
                      onPress={() => {
                        setChatFriend(friend.friend);
                        // Refresh unread counts after opening chat
                        if (currentUserId) {
                          setTimeout(() => {
                            refreshUnreadCounts(currentUserId);
                            refreshUnread(); // Refresh tab badge
                          }, 1000);
                        }
                      }}
                    >
                      <Text style={styles.messageIcon}>💬</Text>
                    </TouchableOpacity>
                  </View>
                );
              })
            )}
          </View>
        )}

        {/* Nearby Tab */}
        {selectedTab === 'nearby' && (
          <View>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Nearby</Text>
            </View>

            {isLoadingNearby ? (
              <View style={styles.emptyState}>
                <ActivityIndicator size="small" color="#8C1515" />
              </View>
            ) : nearbyProfiles.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>
                  No other students to discover yet.
                </Text>
              </View>
            ) : (
              nearbyProfiles.map(({ profile, distanceMiles }) => {
                const interests =
                  (profile as Profile & { interests?: string[] | null }).interests ?? [];
                return (
                  <View key={profile.id} style={styles.nearbyCard}>
                    {profile.avatar_url !== undefined && profile.avatar_url !== null ? (
                      <Image
                        source={{ uri: profile.avatar_url }}
                        style={styles.nearbyAvatar}
                      />
                    ) : (
                      <View style={[styles.nearbyAvatar, styles.nearbyAvatarFallback]}>
                        <Text style={styles.nearbyAvatarFallbackText}>
                          {profile.name.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                    )}
                    <View style={styles.nearbyContent}>
                      <View style={styles.nearbyHeader}>
                        <Text style={styles.nearbyName}>{profile.name}</Text>
                        {distanceMiles !== null && (
                          <View style={styles.distanceBadge}>
                            <Text style={styles.distanceBadgeText}>
                              {formatDistance(distanceMiles)}
                            </Text>
                          </View>
                        )}
                      </View>
                      {profile.bio !== undefined &&
                        profile.bio !== null &&
                        profile.bio.length > 0 && (
                          <Text style={styles.nearbyInfo} numberOfLines={2}>
                            {profile.bio}
                          </Text>
                        )}
                      {interests.length > 0 && (
                        <View style={styles.interestsContainer}>
                          {interests.slice(0, 3).map((interest: string) => (
                            <View key={interest} style={styles.interestTag}>
                              <Text style={styles.interestText}>{interest}</Text>
                            </View>
                          ))}
                        </View>
                      )}
                      <View style={styles.nearbyActions}>
                        <TouchableOpacity
                          style={[
                            styles.addFriendButton,
                            outgoingPendingProfileIds.has(profile.id) &&
                              styles.addFriendButtonRequested,
                          ]}
                          onPress={() => handleAddFriendFromNearby(profile)}
                          disabled={
                            sendingFriendProfileId !== null ||
                            outgoingPendingProfileIds.has(profile.id)
                          }
                        >
                          {sendingFriendProfileId === profile.id ? (
                            <ActivityIndicator size="small" color="#8C1515" />
                          ) : (
                            <Text
                              style={[
                                styles.addFriendButtonText,
                                outgoingPendingProfileIds.has(profile.id) &&
                                  styles.addFriendButtonTextRequested,
                              ]}
                            >
                              {outgoingPendingProfileIds.has(profile.id)
                                ? '✓ Requested'
                                : '+ Add Friend'}
                            </Text>
                          )}
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.waveButton}
                          onPress={() => setChatFriend(profile)}
                        >
                          <Text style={styles.waveButtonText}>💬 Message</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        )}

        {/* Messages Tab */}
        {selectedTab === 'messages' && (
          <View>
            {isLoadingConversations ? (
              <View style={styles.emptyState}>
                <ActivityIndicator size="small" color="#8C1515" />
              </View>
            ) : conversations.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>💬</Text>
                <Text style={styles.emptyStateText}>No messages yet</Text>
                <Text style={styles.emptySubtext}>Start chatting with your friends!</Text>
              </View>
            ) : (
              conversations.map((conversation) => (
                <TouchableOpacity
                  key={conversation.friend.id}
                  style={styles.conversationCard}
                  onPress={() => setChatFriend(conversation.friend)}
                >
                  {conversation.friend.avatar_url ? (
                    <Image
                      source={{ uri: conversation.friend.avatar_url }}
                      style={styles.conversationAvatar}
                    />
                  ) : (
                    <View style={[styles.conversationAvatar, styles.conversationAvatarFallback]}>
                      <Text style={styles.conversationAvatarText}>
                        {conversation.friend.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}

                  <View style={styles.conversationContent}>
                    <View style={styles.conversationHeader}>
                      <Text style={styles.conversationName}>{conversation.friend.name}</Text>
                      {conversation.lastMessage && (
                        <Text style={styles.conversationTime}>
                          {formatTime(conversation.lastMessage.created_at)}
                        </Text>
                      )}
                    </View>

                    {conversation.lastMessage ? (
                      <Text
                        style={[
                          styles.conversationMessage,
                          conversation.unreadCount > 0 && styles.conversationMessageUnread,
                        ]}
                        numberOfLines={1}
                      >
                        {conversation.lastMessage.sender_id === currentUserId
                          ? 'You: '
                          : ''}
                        {conversation.lastMessage.content}
                      </Text>
                    ) : (
                      <Text style={styles.conversationNoMessage}>No messages yet</Text>
                    )}
                  </View>

                  {conversation.unreadCount > 0 && (
                    <View style={styles.conversationUnreadBadge}>
                      <Text style={styles.conversationUnreadText}>
                        {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))
            )}
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

          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
          >
            <ScrollView
              style={styles.modalContent}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingBottom: 40 }}
            >
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
                  returnKeyType="send"
                  onSubmitEditing={handleSendRequest}
                  autoCorrect={false}
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
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

      {/* Chat Modal */}
      {chatFriend && currentUserId && (
        <Modal
          visible={true}
          animationType="slide"
          presentationStyle="fullScreen"
          onRequestClose={() => setChatFriend(null)}
        >
          <ChatDetailScreen
            route={{
              params: {
                friend: chatFriend,
                currentUserId: currentUserId,
              },
            }}
            navigation={{
              setOptions: () => {},
              goBack: () => setChatFriend(null),
            }}
          />
          <TouchableOpacity
            style={styles.chatCloseButton}
            onPress={() => {
              setChatFriend(null);
              // Refresh unread counts when closing chat
              if (currentUserId) {
                refreshUnreadCounts(currentUserId);
                refreshUnread(); // Refresh tab badge
              }
            }}
          >
            <Text style={styles.chatCloseText}>✕ Close</Text>
          </TouchableOpacity>
        </Modal>
      )}
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
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    marginBottom: 8,
  },
  tabsScroll: {
    flexGrow: 0,
    marginBottom: 2,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#F2F2F7',
    marginRight: 6,
    gap: 4,
  },
  tabActive: {
    backgroundColor: '#8C1515',
  },
  tabIcon: {
    fontSize: 14,
  },
  tabText: {
    fontSize: 13,
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
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
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
    borderRadius: 10,
    padding: 12,
    marginHorizontal: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  nearbyAvatar: {
    width: 64,
    height: 64,
    borderRadius: 10,
    marginRight: 10,
  },
  nearbyAvatarFallback: {
    backgroundColor: '#F4E8E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nearbyAvatarFallbackText: {
    fontSize: 26,
    fontWeight: '600',
    color: '#8C1515',
  },
  emptyStateText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
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
    fontSize: 15,
    fontWeight: '600',
    color: '#000000',
  },
  distanceBadge: {
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
  },
  distanceBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#666666',
  },
  nearbyInfo: {
    fontSize: 13,
    color: '#666666',
    marginBottom: 6,
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 8,
  },
  interestTag: {
    backgroundColor: '#F4E8E9',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
  },
  interestText: {
    fontSize: 10,
    color: '#8C1515',
  },
  waveButton: {
    flex: 1,
    backgroundColor: '#8C1515',
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
  },
  waveButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  nearbyActions: {
    flexDirection: 'row',
    gap: 8,
  },
  addFriendButton: {
    flex: 1,
    backgroundColor: '#F4E8E9',
    borderWidth: 1,
    borderColor: '#8C1515',
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addFriendButtonRequested: {
    backgroundColor: '#F2F2F7',
    borderColor: '#C7C7CC',
  },
  addFriendButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8C1515',
  },
  addFriendButtonTextRequested: {
    color: '#8E8E93',
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
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 14,
    color: '#999999',
  },
  suggestionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 10,
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
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 10,
  },
  friendAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  friendUnreadBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    backgroundColor: '#FF3B30',
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  friendUnreadBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  friendContent: {
    flex: 1,
  },
  friendName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 2,
  },
  friendInfo: {
    fontSize: 13,
    color: '#666666',
    marginBottom: 1,
  },
  friendBio: {
    fontSize: 12,
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
  messageIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F4E8E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  messageIcon: {
    fontSize: 20,
  },
  chatCloseButton: {
    position: 'absolute',
    top: 50,
    right: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    zIndex: 1000,
  },
  chatCloseText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  conversationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  conversationAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 10,
  },
  conversationAvatarFallback: {
    backgroundColor: '#F4E8E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  conversationAvatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#8C1515',
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  conversationName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000000',
  },
  conversationTime: {
    fontSize: 12,
    color: '#999999',
  },
  conversationMessage: {
    fontSize: 13,
    color: '#666666',
  },
  conversationMessageUnread: {
    fontWeight: '600',
    color: '#000000',
  },
  conversationNoMessage: {
    fontSize: 13,
    color: '#999999',
    fontStyle: 'italic',
  },
  conversationUnreadBadge: {
    backgroundColor: '#8C1515',
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    marginLeft: 6,
  },
  conversationUnreadText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
});
