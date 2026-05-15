import { supabase } from './supabase';
import { Profile } from '../types';

export interface FriendLocation {
  friend: Profile;
  latitude: number;
  longitude: number;
  timestamp: string;
  isOnline: boolean; // Consider online if location updated within last 5 minutes
}

/**
 * Get locations of all friends
 * Returns the most recent location for each friend
 */
export const getFriendLocations = async (userId: string): Promise<FriendLocation[]> => {
  // First get all accepted friends
  const { data: friends, error: friendsError } = await supabase
    .from('friends')
    .select('friend:profiles!friends_friend_id_fkey(*)')
    .eq('user_id', userId)
    .eq('status', 'accepted');

  if (friendsError) {
    console.error('Error fetching friends:', friendsError);
    return [];
  }

  if (!friends || friends.length === 0) {
    return [];
  }

  // Get friend IDs
  const friendIds = friends.map((f: any) => f.friend.id);

  // Get most recent location for each friend
  const { data: locations, error: locationsError } = await supabase
    .from('user_locations')
    .select('user_id, latitude, longitude, timestamp')
    .in('user_id', friendIds)
    .order('timestamp', { ascending: false });

  if (locationsError) {
    console.error('Error fetching locations:', locationsError);
    return [];
  }

  // Create a map of most recent location per user
  const locationMap = new Map<string, { latitude: number; longitude: number; timestamp: string }>();

  locations?.forEach((loc: any) => {
    if (!locationMap.has(loc.user_id)) {
      locationMap.set(loc.user_id, {
        latitude: loc.latitude,
        longitude: loc.longitude,
        timestamp: loc.timestamp,
      });
    }
  });

  // Combine friends with their locations
  const friendLocations: FriendLocation[] = [];
  const now = new Date();
  const ONLINE_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

  friends.forEach((f: any) => {
    const location = locationMap.get(f.friend.id);
    if (location) {
      const locationTime = new Date(location.timestamp);
      const isOnline = (now.getTime() - locationTime.getTime()) < ONLINE_THRESHOLD_MS;

      friendLocations.push({
        friend: f.friend,
        latitude: location.latitude,
        longitude: location.longitude,
        timestamp: location.timestamp,
        isOnline,
      });
    }
  });

  return friendLocations;
};

/**
 * Update current user's location
 */
export const updateMyLocation = async (
  userId: string,
  latitude: number,
  longitude: number,
  accuracy?: number
): Promise<boolean> => {
  const { error } = await supabase
    .from('user_locations')
    .insert({
      user_id: userId,
      latitude,
      longitude,
      accuracy,
      timestamp: new Date().toISOString(),
    });

  if (error) {
    console.error('Error updating location:', error);
    return false;
  }

  return true;
};
