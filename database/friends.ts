import { supabase } from './supabase';
import { Friend, FriendWithDetails } from '../types';

/**
 * Fetch all friends for a user
 */
export const getFriends = async (userId: string): Promise<FriendWithDetails[]> => {
  const { data, error } = await supabase
    .from('friends')
    .select(`
      *,
      friend:profiles!friends_friend_id_fkey(*)
    `)
    .eq('user_id', userId)
    .eq('status', 'accepted');

  if (error) {
    console.error('Error fetching friends:', error);
    return [];
  }

  return data || [];
};

/**
 * Send friend request
 */
export const sendFriendRequest = async (
  userId: string,
  friendId: string
): Promise<boolean> => {
  const { error } = await supabase
    .from('friends')
    .insert({
      user_id: userId,
      friend_id: friendId,
      status: 'pending',
    });

  if (error) {
    console.error('Error sending friend request:', error);
    return false;
  }

  return true;
};