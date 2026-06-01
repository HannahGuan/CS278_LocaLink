import { supabase } from '../database/supabase';
import { Platform } from 'react-native';

// Track custom events to Supabase
export const trackEvent = async (eventName: string, properties?: Record<string, any>) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    await supabase.from('analytics_events').insert({
      user_id: user?.id || null,
      event_name: eventName,
      properties: properties || {},
      platform: Platform.OS,
    });

    console.log('[Analytics] Event tracked:', eventName, properties);
  } catch (error) {
    console.error('[Analytics] Failed to track event:', eventName, error);
  }
};

// Convenience functions for common events
export const analytics = {
  // App lifecycle
  appOpened: () => {
    trackEvent('app_opened');
  },

  appBackgrounded: () => {
    trackEvent('app_backgrounded');
  },

  // Map interactions
  mapViewed: (filter: 'all' | 'friends' | 'events', locationPermission: 'granted' | 'denied' | 'prompt') => {
    trackEvent('map_viewed', {
      filter,
      location_permission: locationPermission,
    });
  },

  filterChanged: (from: string, to: string) => {
    trackEvent('filter_changed', { from, to });
  },

  markerClicked: (markerType: 'user' | 'friend' | 'event', eventId?: string) => {
    trackEvent('marker_clicked', {
      marker_type: markerType,
      event_id: eventId,
    });
  },

  locationUpdated: (accuracy?: number, distanceMoved?: number) => {
    trackEvent('location_updated', {
      accuracy,
      distance_moved: distanceMoved,
    });
  },

  // Event interactions
  eventViewed: (eventId: string, source: 'map' | 'feed' | 'profile') => {
    trackEvent('event_viewed', {
      event_id: eventId,
      source,
    });
  },

  eventCreated: (eventId: string, location: string, hasImage: boolean) => {
    trackEvent('event_created', {
      event_id: eventId,
      location,
      has_image: hasImage,
    });
  },

  eventRSVPed: (eventId: string, attending: boolean) => {
    trackEvent('event_rsvped', {
      event_id: eventId,
      attending,
    });
  },

  // Friend interactions
  friendRequestSent: (toUserId: string) => {
    trackEvent('friend_request_sent', {
      to_user_id: toUserId,
    });
  },

  friendRequestAccepted: (fromUserId: string) => {
    trackEvent('friend_request_accepted', {
      from_user_id: fromUserId,
    });
  },

  // Chat/Messages
  chatOpened: (friendId: string, source: 'friends_list' | 'nearby' | 'messages_list') => {
    trackEvent('chat_opened', {
      friend_id: friendId,
      source,
    });
  },

  // Profile/Settings
  privacySettingChanged: (setting: 'showToFriends' | 'showToMatches', newValue: boolean) => {
    trackEvent('privacy_setting_changed', {
      setting,
      new_value: newValue,
    });
  },

  profileUpdated: (field: 'bio' | 'interests' | 'info') => {
    trackEvent('profile_updated', {
      field,
    });
  },

  userSignedOut: () => {
    trackEvent('user_signed_out');
  },

  // Onboarding
  onboardingStarted: () => {
    trackEvent('onboarding_started');
  },

  onboardingCompleted: () => {
    trackEvent('onboarding_completed');
  },

  // Errors
  errorOccurred: (errorType: string, errorMessage: string, context?: Record<string, any>) => {
    trackEvent('error_occurred', {
      error_type: errorType,
      error_message: errorMessage,
      ...context,
    });
  },
};
