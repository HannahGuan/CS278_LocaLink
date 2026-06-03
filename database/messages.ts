import { supabase } from './supabase';
import { Profile } from '../types';
import { notifyNewMessage } from '../services/notifications';

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
 * Sortable time for a message. A missing or unparseable created_at is treated
 * as the oldest possible time so a real, dated message always wins the "newest"
 * comparison instead of a null-dated row.
 */
const _messageTime = (message: Message): number => {
  if (message.created_at === null || message.created_at === undefined) {
    return -Infinity;
  }
  const time = new Date(message.created_at).getTime();
  return Number.isNaN(time) ? -Infinity : time;
};

/**
 * Get all conversations for a user.
 * Walks every message the user sent or received, groups by the other party,
 * then resolves those profile rows. Returning chats only with accepted
 * friends would hide DMs with people the user met via the Nearby tab.
 */
export const getConversations = async (userId: string): Promise<Conversation[]> => {
  const { data: messages, error: messagesError } = await supabase
    .from('messages')
    .select('*')
    .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
    .order('created_at', { ascending: false });

  if (messagesError !== null || messages === null) {
    console.error('Error fetching messages:', messagesError);
    return [];
  }

  // For each other party, capture their newest message + accumulate unread count.
  // Pick the newest message explicitly by comparing timestamps rather than
  // trusting the query's row order: a row with a NULL created_at sorts NULLS
  // FIRST under "created_at DESC", which would otherwise hijack the preview.
  const byOtherId = new Map<string, { lastMessage: Message; unreadCount: number }>();
  for (const message of messages as Message[]) {
    const otherId =
      message.sender_id === userId ? message.recipient_id : message.sender_id;
    const entry = byOtherId.get(otherId);
    if (entry === undefined) {
      byOtherId.set(otherId, { lastMessage: message, unreadCount: 0 });
    } else if (_messageTime(message) > _messageTime(entry.lastMessage)) {
      entry.lastMessage = message;
    }
    if (message.recipient_id === userId && message.read === false) {
      // entry may have just been created above; re-read to mutate it.
      byOtherId.get(otherId)!.unreadCount += 1;
    }
  }

  if (byOtherId.size === 0) {
    return [];
  }

  const otherIds = Array.from(byOtherId.keys());
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('*')
    .in('id', otherIds);

  if (profilesError !== null || profiles === null) {
    console.error('Error fetching conversation profiles:', profilesError);
    return [];
  }

  const conversations: Conversation[] = (profiles as Profile[]).map((profile) => {
    const entry = byOtherId.get(profile.id);
    return {
      friend: profile,
      lastMessage: entry?.lastMessage ?? null,
      unreadCount: entry?.unreadCount ?? 0,
    };
  });

  conversations.sort((a, b) => {
    if (a.lastMessage === null) return 1;
    if (b.lastMessage === null) return -1;
    return (
      new Date(b.lastMessage.created_at).getTime() -
      new Date(a.lastMessage.created_at).getTime()
    );
  });

  // TEMP DIAGNOSTIC: confirm whether the chosen preview is actually the newest
  // message and whether created_at values are distinct. Remove after debugging.
  console.log(
    '[getConversations] total messages fetched:',
    (messages as Message[]).length
  );
  for (const convo of conversations) {
    const all = (messages as Message[]).filter(
      (m) =>
        m.sender_id === convo.friend.id || m.recipient_id === convo.friend.id
    );
    console.log('[getConversations] convo with', convo.friend.name, {
      messageCount: all.length,
      previewContent: convo.lastMessage?.content ?? null,
      previewCreatedAt: convo.lastMessage?.created_at ?? null,
      allCreatedAt: all.map((m) => m.created_at),
    });
  }

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

  // Get sender's name for notification
  const { data: senderProfile } = await supabase
    .from('profiles')
    .select('name')
    .eq('id', senderId)
    .single();

  // Send push notification (fire and forget)
  if (senderProfile?.name) {
    notifyNewMessage(recipientId, senderProfile.name, content).catch((err) => {
      console.error('Failed to send message notification:', err);
    });
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
    console.error('Error details:', JSON.stringify(error, null, 2));
    throw error;
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
 * Uses unique channel names to allow multiple chat subscriptions
 */
export const subscribeToMessages = (
  userId: string,
  friendId: string,
  callback: (message: Message) => void
) => {
  // Generate unique channel name to avoid conflicts when multiple chats are open
  const channelName = `messages-${userId}-${friendId}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;

  console.log('[Messages] Subscribing to conversation channel:', channelName);

  const channel = supabase
    .channel(channelName)
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
    console.log('[Messages] Unsubscribing from conversation channel:', channelName);
    supabase.removeChannel(channel);
  };
};

/**
 * Subscribe to all new messages for a user (for notifications)
 * Uses unique channel names to allow multiple subscriptions
 */
export const subscribeToAllMessages = (
  userId: string,
  callback: () => void
) => {
  // Generate unique channel name to avoid conflicts when multiple components subscribe
  const channelName = `all-messages-${userId}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;

  console.log('[Messages] Subscribing to channel:', channelName);

  const channel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `recipient_id.eq.${userId}`,
      },
      () => {
        callback();
      }
    )
    .subscribe();

  return () => {
    console.log('[Messages] Unsubscribing from channel:', channelName);
    supabase.removeChannel(channel);
  };
};
