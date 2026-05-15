import React, { useEffect, useState } from 'react';
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
import { getCurrentUser } from '../../database/auth';
import { getConversations, Conversation } from '../../database/messages';

export default function MessagesScreen({ navigation }: any) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      const user = await getCurrentUser();
      if (!user) {
        setIsLoading(false);
        return;
      }

      setCurrentUserId(user.id);
      const convos = await getConversations(user.id);
      setConversations(convos);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (timestamp: string) => {
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
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Messages</Text>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8C1515" />
        </View>
      ) : conversations.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>💬</Text>
          <Text style={styles.emptyText}>No messages yet</Text>
          <Text style={styles.emptySubtext}>Start chatting with your friends!</Text>
        </View>
      ) : (
        <ScrollView style={styles.content}>
          {conversations.map((conversation) => (
            <TouchableOpacity
              key={conversation.friend.id}
              style={styles.conversationCard}
              onPress={() =>
                navigation.navigate('Chat', {
                  friend: conversation.friend,
                  currentUserId,
                })
              }
            >
              {conversation.friend.avatar_url ? (
                <Image
                  source={{ uri: conversation.friend.avatar_url }}
                  style={styles.avatar}
                />
              ) : (
                <View style={[styles.avatar, styles.avatarFallback]}>
                  <Text style={styles.avatarFallbackText}>
                    {conversation.friend.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}

              <View style={styles.conversationContent}>
                <View style={styles.conversationHeader}>
                  <Text style={styles.friendName}>{conversation.friend.name}</Text>
                  {conversation.lastMessage && (
                    <Text style={styles.timestamp}>
                      {formatTime(conversation.lastMessage.created_at)}
                    </Text>
                  )}
                </View>

                {conversation.lastMessage ? (
                  <Text
                    style={[
                      styles.lastMessage,
                      conversation.unreadCount > 0 && styles.lastMessageUnread,
                    ]}
                    numberOfLines={1}
                  >
                    {conversation.lastMessage.sender_id === currentUserId
                      ? 'You: '
                      : ''}
                    {conversation.lastMessage.content}
                  </Text>
                ) : (
                  <Text style={styles.noMessages}>No messages yet</Text>
                )}
              </View>

              {conversation.unreadCount > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadText}>{conversation.unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
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
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    color: '#000000',
    letterSpacing: -0.5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 15,
    color: '#666666',
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  conversationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 12,
  },
  avatarFallback: {
    backgroundColor: '#F4E8E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarFallbackText: {
    fontSize: 20,
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
    marginBottom: 4,
  },
  friendName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
  },
  timestamp: {
    fontSize: 14,
    color: '#999999',
  },
  lastMessage: {
    fontSize: 15,
    color: '#666666',
  },
  lastMessageUnread: {
    fontWeight: '600',
    color: '#000000',
  },
  noMessages: {
    fontSize: 15,
    color: '#999999',
    fontStyle: 'italic',
  },
  unreadBadge: {
    backgroundColor: '#8C1515',
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
    marginLeft: 8,
  },
  unreadText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
