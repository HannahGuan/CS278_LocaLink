import { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { Friend, Profile } from '../types';

export class DatabaseError extends Error {
  readonly cause?: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = 'DatabaseError';
    this.cause = cause;
  }
}

export interface PendingFriendRequest {
  id: string;
  status: 'pending';
  created_at: string;
  recipient: Profile;
}

export interface IncomingFriendRequest {
  id: string;
  status: 'pending';
  created_at: string;
  sender: Profile;
}

export interface UserEventRow {
  id: string;
  created_by: string;
  title: string;
  description: string | null;
  location: string;
  location_lat: number | null;
  location_lng: number | null;
  event_date: string;
  event_time: string;
  starts_at: string;
  category: string;
  icon: string;
  image_url: string | null;
  created_at: string;
}

interface ProfileWithPrivacy extends Profile {
  privacy_settings?: { showToMatches?: boolean } | null;
}

interface LocationRow {
  user_id: string;
  latitude: number;
  longitude: number;
  timestamp: string;
}

// Discovery Mode defaults to ON: only an explicit `false` opts out.
function isDiscoverable(profile: ProfileWithPrivacy): boolean {
  return profile.privacy_settings?.showToMatches !== false;
}

// Haversine — straight-line miles between two lat/lng pairs.
function distanceInMiles(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const EARTH_RADIUS_MI = 3958.8;
  const toRad = (degrees: number) => (degrees * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_MI * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export interface CreateUserEventInput {
  title: string;
  description: string;
  location: string;
  locationLat: number | null;
  locationLng: number | null;
  eventDate: string;
  eventTime: string;
  startsAt: Date;
  category: string;
  icon: string;
}

/**
 * Thin, typed wrapper around Supabase for user and friendship reads/writes.
 *
 * Errors are thrown as DatabaseError so callers must handle them — we never
 * silently return null for an unexpected failure (only for "not found").
 */
export class DatabaseClient {
  constructor(private readonly client: SupabaseClient = supabase) {}

  async findUserByEmail(email: string): Promise<Profile | null> {
    const normalized = email.trim().toLowerCase();
    const { data, error } = await this.client
      .from('profiles')
      .select('*')
      .eq('email', normalized)
      .maybeSingle();

    if (error !== null) {
      throw new DatabaseError(`Failed to look up user by email: ${error.message}`, error);
    }
    return data;
  }

  async getUserProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await this.client
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error !== null) {
      throw new DatabaseError(`Failed to fetch user profile: ${error.message}`, error);
    }
    return data;
  }

  /**
   * Find an existing friendship row between two users in either direction.
   * Returns the most recently created row if both directions exist.
   */
  async findFriendship(userId: string, otherUserId: string): Promise<Friend | null> {
    const { data, error } = await this.client
      .from('friends')
      .select('*')
      .or(
        `and(user_id.eq.${userId},friend_id.eq.${otherUserId}),` +
          `and(user_id.eq.${otherUserId},friend_id.eq.${userId})`
      )
      .order('created_at', { ascending: false })
      .limit(1);

    if (error !== null) {
      throw new DatabaseError(`Failed to query friendship: ${error.message}`, error);
    }
    return data?.[0] ?? null;
  }

  async createFriendRequest(requesterId: string, recipientId: string): Promise<Friend> {
    const { data, error } = await this.client
      .from('friends')
      .insert({ user_id: requesterId, friend_id: recipientId, status: 'pending' })
      .select()
      .single();

    if (error !== null) {
      throw new DatabaseError(`Failed to create friend request: ${error.message}`, error);
    }
    return data;
  }

  async getOutgoingPendingRequests(userId: string): Promise<PendingFriendRequest[]> {
    const { data, error } = await this.client
      .from('friends')
      .select('id, status, created_at, recipient:profiles!friends_friend_id_fkey(*)')
      .eq('user_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error !== null) {
      throw new DatabaseError(`Failed to fetch pending requests: ${error.message}`, error);
    }
    return (data ?? []) as unknown as PendingFriendRequest[];
  }

  async getIncomingPendingRequests(userId: string): Promise<IncomingFriendRequest[]> {
    const { data, error } = await this.client
      .from('friends')
      .select('id, status, created_at, sender:profiles!friends_user_id_fkey(*)')
      .eq('friend_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error !== null) {
      throw new DatabaseError(`Failed to fetch incoming requests: ${error.message}`, error);
    }
    return (data ?? []) as unknown as IncomingFriendRequest[];
  }

  async acceptFriendRequest(requestId: string): Promise<void> {
    // First, get the original request to know who sent it
    const { data: request, error: fetchError } = await this.client
      .from('friends')
      .select('user_id, friend_id')
      .eq('id', requestId)
      .single();

    if (fetchError !== null) {
      throw new DatabaseError(`Failed to fetch friend request: ${fetchError.message}`, fetchError);
    }

    if (!request) {
      throw new DatabaseError('Friend request not found');
    }

    // Update the original request to accepted
    const { error: updateError } = await this.client
      .from('friends')
      .update({ status: 'accepted' })
      .eq('id', requestId);

    if (updateError !== null) {
      throw new DatabaseError(`Failed to accept friend request: ${updateError.message}`, updateError);
    }

    // Create the reverse friendship so both users see each other as friends
    const { error: insertError } = await this.client
      .from('friends')
      .insert({
        user_id: request.friend_id,
        friend_id: request.user_id,
        status: 'accepted',
      });

    if (insertError !== null) {
      throw new DatabaseError(`Failed to create reverse friendship: ${insertError.message}`, insertError);
    }
  }

  async declineFriendRequest(requestId: string): Promise<void> {
    const { error } = await this.client
      .from('friends')
      .update({ status: 'rejected' })
      .eq('id', requestId);

    if (error !== null) {
      throw new DatabaseError(`Failed to decline friend request: ${error.message}`, error);
    }
  }

  async getMyRsvpEventIds(userId: string): Promise<Set<string>> {
    const { data, error } = await this.client
      .from('event_rsvps')
      .select('event_id')
      .eq('user_id', userId);

    if (error !== null) {
      throw new DatabaseError(`Failed to fetch RSVPs: ${error.message}`, error);
    }
    return new Set((data ?? []).map((row) => row.event_id as string));
  }

  async createEventRsvp(
    userId: string,
    eventId: string,
    eventTitle: string,
    eventDate: string,
    eventLocation: string
  ): Promise<void> {
    const { error } = await this.client
      .from('event_rsvps')
      .insert({
        user_id: userId,
        event_id: eventId,
        event_title: eventTitle,
        event_date: eventDate,
        event_location: eventLocation,
      });

    if (error !== null) {
      throw new DatabaseError(`Failed to create RSVP: ${error.message}`, error);
    }
  }

  /**
   * Return profiles of users who RSVPed to an event. Bounded by the
   * event_rsvps RLS policies: callers see themselves and any accepted
   * friend, not strangers.
   */
  async getEventAttendees(eventId: string): Promise<Profile[]> {
    const { data, error } = await this.client
      .from('event_rsvps')
      .select('user:profiles!event_rsvps_user_id_fkey(*)')
      .eq('event_id', eventId);

    if (error !== null) {
      throw new DatabaseError(`Failed to fetch attendees: ${error.message}`, error);
    }
    return ((data ?? []) as unknown as { user: Profile }[])
      .map((row) => row.user)
      .filter((user): user is Profile => user !== null && user !== undefined);
  }

  async deleteEventRsvp(userId: string, eventId: string): Promise<void> {
    const { error } = await this.client
      .from('event_rsvps')
      .delete()
      .eq('user_id', userId)
      .eq('event_id', eventId);

    if (error !== null) {
      throw new DatabaseError(`Failed to remove RSVP: ${error.message}`, error);
    }
  }

  async createUserEvent(userId: string, input: CreateUserEventInput): Promise<UserEventRow> {
    const { data, error } = await this.client
      .from('user_events')
      .insert({
        created_by: userId,
        title: input.title,
        description: input.description,
        location: input.location,
        location_lat: input.locationLat,
        location_lng: input.locationLng,
        event_date: input.eventDate,
        event_time: input.eventTime,
        starts_at: input.startsAt.toISOString(),
        category: input.category,
        icon: input.icon,
      })
      .select()
      .single();

    if (error !== null) {
      throw new DatabaseError(`Failed to create event: ${error.message}`, error);
    }
    return data as UserEventRow;
  }

  async getUserEvents(): Promise<UserEventRow[]> {
    const { data, error } = await this.client
      .from('user_events')
      .select('*')
      .order('starts_at', { ascending: true });

    if (error !== null) {
      throw new DatabaseError(`Failed to fetch user events: ${error.message}`, error);
    }
    return (data ?? []) as UserEventRow[];
  }

  /**
   * Return profiles a user can discover and message: everyone except
   * themselves and their already-accepted friends, plus the distance to
   * each one when both parties have a recent location and the other user
   * has not opted out of Discovery Mode. Sorted nearest first, with
   * unknown-distance entries at the bottom.
   */
  async getNearbyDiscoverableProfiles(
    currentUserId: string
  ): Promise<{ profile: Profile; distanceMiles: number | null }[]> {
    const acceptedFriendIds = await this.getAcceptedFriendIds(currentUserId);
    const exclude = new Set<string>([currentUserId, ...acceptedFriendIds]);

    const { data: profileRows, error: profilesError } = await this.client
      .from('profiles')
      .select('*');

    if (profilesError !== null) {
      throw new DatabaseError(
        `Failed to fetch profiles: ${profilesError.message}`,
        profilesError
      );
    }

    const candidates = ((profileRows ?? []) as ProfileWithPrivacy[]).filter(
      (profile) => !exclude.has(profile.id) && isDiscoverable(profile)
    );

    if (candidates.length === 0) {
      return [];
    }

    // Pull every location row for self + candidates in one round trip, then
    // keep the most recent per user. RLS hides rows we're not allowed to see.
    const locationOwnerIds = [currentUserId, ...candidates.map((p) => p.id)];
    const { data: locationRows, error: locationsError } = await this.client
      .from('user_locations')
      .select('user_id, latitude, longitude, timestamp')
      .in('user_id', locationOwnerIds)
      .order('timestamp', { ascending: false });

    if (locationsError !== null) {
      throw new DatabaseError(
        `Failed to fetch locations: ${locationsError.message}`,
        locationsError
      );
    }

    const latestLocation = new Map<string, { lat: number; lng: number }>();
    for (const row of (locationRows ?? []) as LocationRow[]) {
      if (!latestLocation.has(row.user_id)) {
        latestLocation.set(row.user_id, {
          lat: row.latitude,
          lng: row.longitude,
        });
      }
    }

    const myLocation = latestLocation.get(currentUserId) ?? null;

    const results = candidates.map((profile) => {
      const otherLocation = latestLocation.get(profile.id) ?? null;
      const distanceMiles =
        myLocation !== null && otherLocation !== null
          ? distanceInMiles(
              myLocation.lat,
              myLocation.lng,
              otherLocation.lat,
              otherLocation.lng
            )
          : null;
      return { profile: profile as Profile, distanceMiles };
    });

    results.sort((a, b) => {
      if (a.distanceMiles === null && b.distanceMiles === null) return 0;
      if (a.distanceMiles === null) return 1;
      if (b.distanceMiles === null) return -1;
      return a.distanceMiles - b.distanceMiles;
    });

    return results;
  }

  async getAcceptedFriendIds(userId: string): Promise<Set<string>> {
    const { data, error } = await this.client
      .from('friends')
      .select('friend_id')
      .eq('user_id', userId)
      .eq('status', 'accepted');

    if (error !== null) {
      throw new DatabaseError(`Failed to fetch friend ids: ${error.message}`, error);
    }
    return new Set((data ?? []).map((row) => row.friend_id as string));
  }

  /**
   * Return the set of event_ids that any accepted friend of `userId` has
   * RSVPed to. Used by the Discover "Friends" filter to surface events
   * friends are attending.
   */
  async getFriendsRsvpedEventIds(userId: string): Promise<Set<string>> {
    const { data: friendRows, error: friendsError } = await this.client
      .from('friends')
      .select('friend_id')
      .eq('user_id', userId)
      .eq('status', 'accepted');

    if (friendsError !== null) {
      throw new DatabaseError(
        `Failed to fetch friends for RSVP filter: ${friendsError.message}`,
        friendsError
      );
    }

    const friendIds = (friendRows ?? []).map((row) => row.friend_id as string);
    if (friendIds.length === 0) {
      return new Set();
    }

    const { data: rsvpRows, error: rsvpError } = await this.client
      .from('event_rsvps')
      .select('event_id')
      .in('user_id', friendIds);

    if (rsvpError !== null) {
      throw new DatabaseError(
        `Failed to fetch friend RSVPs: ${rsvpError.message}`,
        rsvpError
      );
    }

    return new Set((rsvpRows ?? []).map((row) => row.event_id as string));
  }
}

export const databaseClient = new DatabaseClient();
