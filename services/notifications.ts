import { supabase } from '../database/supabase';

// registerForPushNotifications and the foreground notification handler live in
// ./pushRegistration so the native-only expo-notifications dependency can be
// swapped for a web stub (pushRegistration.web.ts) and kept out of the web
// bundle. Re-exported here so existing import paths keep working.
export { registerForPushNotifications } from './pushRegistration';

/**
 * Save push token to user's profile
 */
export async function savePushToken(userId: string, token: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ push_token: token })
      .eq('id', userId);

    if (error) {
      console.error('Error saving push token:', error);
    }
  } catch (error) {
    console.error('Error saving push token:', error);
  }
}

/**
 * Send push notification to a user by their user ID
 */
export async function sendPushNotification(
  userId: string,
  title: string,
  body: string,
  data?: any
): Promise<void> {
  try {
    // Get user's push token
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('push_token')
      .eq('id', userId)
      .single();

    if (error || !profile?.push_token) {
      console.log('No push token found for user:', userId);
      return;
    }

    // Send notification via Expo Push API
    const message = {
      to: profile.push_token,
      sound: 'default',
      title,
      body,
      data: data || {},
    };

    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    const result = await response.json();

    if (result.data?.status === 'error') {
      console.error('Error sending push notification:', result.data.message);
    }
  } catch (error) {
    console.error('Error sending push notification:', error);
  }
}

/**
 * Send push notifications to multiple users
 */
export async function sendPushNotificationToMultiple(
  userIds: string[],
  title: string,
  body: string,
  data?: any
): Promise<void> {
  try {
    // Get push tokens for all users
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('push_token')
      .in('id', userIds)
      .not('push_token', 'is', null);

    if (error || !profiles || profiles.length === 0) {
      console.log('No push tokens found for users');
      return;
    }

    // Create messages for all tokens
    const messages = profiles
      .filter((p) => p.push_token)
      .map((p) => ({
        to: p.push_token,
        sound: 'default',
        title,
        body,
        data: data || {},
      }));

    if (messages.length === 0) return;

    // Send notifications via Expo Push API
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    });

    const result = await response.json();
    console.log('Bulk notification result:', result);
  } catch (error) {
    console.error('Error sending bulk push notifications:', error);
  }
}

/**
 * Notify friends when a user creates a new event
 */
export async function notifyFriendsAboutEvent(
  creatorId: string,
  creatorName: string,
  eventTitle: string,
  eventId: string
): Promise<void> {
  try {
    // Get all accepted friends
    const { data: friendships, error } = await supabase
      .from('friends')
      .select('friend_id')
      .eq('user_id', creatorId)
      .eq('status', 'accepted');

    if (error || !friendships || friendships.length === 0) {
      return;
    }

    const friendIds = friendships.map((f) => f.friend_id);

    await sendPushNotificationToMultiple(
      friendIds,
      '🎉 New Event from Friend',
      `${creatorName} created: ${eventTitle}`,
      { type: 'friend_event', eventId }
    );
  } catch (error) {
    console.error('Error notifying friends about event:', error);
  }
}

/**
 * Notify user about new message
 */
export async function notifyNewMessage(
  recipientId: string,
  senderName: string,
  messagePreview: string
): Promise<void> {
  await sendPushNotification(
    recipientId,
    `💬 Message from ${senderName}`,
    messagePreview.length > 100 ? messagePreview.substring(0, 100) + '...' : messagePreview,
    { type: 'new_message', senderId: recipientId }
  );
}

/**
 * Notify user about nearby match
 */
export async function notifyNearbyMatch(
  userId: string,
  matchedUserName: string,
  distance: number
): Promise<void> {
  const distanceText = distance < 1
    ? `${Math.round(distance * 5280)} ft`
    : `${distance.toFixed(1)} miles`;

  await sendPushNotification(
    userId,
    '👋 Someone Nearby',
    `${matchedUserName} is ${distanceText} away`,
    { type: 'nearby_match' }
  );
}