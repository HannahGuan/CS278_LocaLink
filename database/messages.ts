import { supabase } from './supabase';
import { Profile } from '../types';

export interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  created_at: string;
  read: boolean;
  sender?: Profile;
  recipient?: Profile;
}

export interface Conversation {
  friend: Profile;
  lastMessage: Message | null;
  unreadCount: number;
}

/**
 * Get all conversations for a user
 * Returns a list of friends with their last message and unread count
 */
export const getConversations = async (userId: string): Promise<Conversation[]> => {
  // First get all friends
  const { data: friends, error: friendsError } = await supabase
    .from('friends')
    .select('friend:profiles!friends_friend_id_fkey(*)')
    .eq('user_id', userId)
    .eq('status', 'accepted');

  if (friendsError || !friends) {
    console.error('Error fetching friends:', friendsError);
    return [];
  }

  const conversations: Conversation[] = [];

  for (const friendRow of friends) {
    const friend = friendRow.friend as Profile;

    // Get last message with this friend
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${userId},recipient_id.eq.${friend.id}),and(sender_id.eq.${friend.id},recipient_id.eq.${userId})`)
      .order('created_at', { ascending: false })
      .limit(1);

    if (messagesError) {
      console.error('Error fetching messages:', messagesError);
      continue;
    }

    const lastMessage = messages && messages.length > 0 ? messages[0] : null;

    // Get unread count (messages from friend to user that are unread)
    const { count, error: countError } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('sender_id', friend.id)
      .eq('recipient_id', userId)
      .eq('read', false);

    if (countError) {
      console.error('Error counting unread messages:', countError);
    }

    conversations.push({
      friend,
      lastMessage,
      unreadCount: count || 0,
    });
  }

  // Sort by last message time (most recent first)
  conversations.sort((a, b) => {
    if (!a.lastMessage) return 1;
    if (!b.lastMessage) return -1;
    return new Date(b.lastMessage.created_at).getTime() - new Date(a.lastMessage.created_at).getTime();
  });

  return conversations;
};

/**
 * Get all messages in a conversation between two users
 */
export const getMessages = async (userId: string, friendId: string): Promise<Message[]> => {
  const { data, error } = await supabase
    .from('messages')
    .select('*, sender:profiles!messages_sender_id_fkey(*), recipient:profiles!messages_recipient_id_fkey(*)')
    .or(`and(sender_id.eq.${userId},recipient_id.eq.${friendId}),and(sender_id.eq.${friendId},recipient_id.eq.${userId})`)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching messages:', error);
    return [];
  }

  return data as Message[];
};

/**
 * Send a message
 */
export const sendMessage = async (
  senderId: string,
  recipientId: string,
  content: string
): Promise<Message | null> => {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      sender_id: senderId,
      recipient_id: recipientId,
      content,
    })
    .select()
    .single();

  if (error) {
    console.error('Error sending message:', error);
    return null;
  }

  return data;
};

/**
 * Mark messages as read
 */
export const markMessagesAsRead = async (userId: string, friendId: string): Promise<void> => {
  const { error } = await supabase
    .from('messages')
    .update({ read: true })
    .eq('sender_id', friendId)
    .eq('recipient_id', userId)
    .eq('read', false);

  if (error) {
    console.error('Error marking messages as read:', error);
  }
};

/**
 * Get total unread message count for a user
 */
export const getUnreadCount = async (userId: string): Promise<number> => {
  const { count, error } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .eq('recipient_id', userId)
    .eq('read', false);

  if (error) {
    console.error('Error getting unread count:', error);
    return 0;
  }

  return count || 0;
};

/**
 * Get unread message counts per friend
 */
export const getUnreadCountsByFriend = async (
  userId: string
): Promise<Map<string, number>> => {
  const { data, error } = await supabase
    .from('messages')
    .select('sender_id')
    .eq('recipient_id', userId)
    .eq('read', false);

  if (error) {
    console.error('Error getting unread counts by friend:', error);
    return new Map();
  }

  const counts = new Map<string, number>();
  data?.forEach((msg) => {
    const current = counts.get(msg.sender_id) || 0;
    counts.set(msg.sender_id, current + 1);
  });

  return counts;
};

/**
 * Subscribe to new messages in a conversation
 */
export const subscribeToMessages = (
  userId: string,
  friendId: string,
  callback: (message: Message) => void
) => {
  const channel = supabase
    .channel('messages')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `or(and(sender_id.eq.${userId},recipient_id.eq.${friendId}),and(sender_id.eq.${friendId},recipient_id.eq.${userId}))`,
      },
      (payload) => {
        callback(payload.new as Message);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

/**
 * Subscribe to all new messages for a user (for notifications)
 */
export const subscribeToAllMessages = (
  userId: string,
  callback: () => void
) => {
  const channel = supabase
    .channel('all-messages')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `recipient_id=eq.${userId}`,
      },
      () => {
        callback();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};
