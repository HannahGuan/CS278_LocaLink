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
    const { error } = await this.client
      .from('friends')
      .update({ status: 'accepted' })
      .eq('id', requestId);

    if (error !== null) {
      throw new DatabaseError(`Failed to accept friend request: ${error.message}`, error);
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
}

export const databaseClient = new DatabaseClient();
