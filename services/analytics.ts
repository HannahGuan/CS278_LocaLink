import posthog from 'posthog-js';
import { Platform } from 'react-native';

const POSTHOG_API_KEY = process.env.EXPO_PUBLIC_POSTHOG_API_KEY || '';
const POSTHOG_HOST = process.env.EXPO_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';

// Initialize PostHog
let isInitialized = false;

export const initializeAnalytics = () => {
  if (isInitialized || !POSTHOG_API_KEY) {
    return;
  }

  try {
    posthog.init(POSTHOG_API_KEY, {
      api_host: POSTHOG_HOST,
      autocapture: false, // Disable autocapture for more control
      capture_pageview: false, // We'll manually track screen views
      loaded: (posthog) => {
        console.log('[Analytics] PostHog initialized');
        isInitialized = true;
      },
    });
  } catch (error) {
    console.error('[Analytics] Failed to initialize PostHog:', error);
  }
};

// Track custom events
export const trackEvent = (eventName: string, properties?: Record<string, any>) => {
  if (!isInitialized) {
    console.warn('[Analytics] PostHog not initialized, skipping event:', eventName);
    return;
  }

  try {
    posthog.capture(eventName, {
      ...properties,
      platform: Platform.OS,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Analytics] Failed to track event:', eventName, error);
  }
};

// Track screen views
export const trackScreenView = (screenName: string, properties?: Record<string, any>) => {
  trackEvent('screen_viewed', {
    screen_name: screenName,
    ...properties,
  });
};

// Identify user (call after login)
export const identifyUser = (userId: string, properties?: Record<string, any>) => {
  if (!isInitialized) {
    return;
  }

  try {
    posthog.identify(userId, properties);
  } catch (error) {
    console.error('[Analytics] Failed to identify user:', error);
  }
};

// Reset user (call on logout)
export const resetUser = () => {
  if (!isInitialized) {
    return;
  }

  try {
    posthog.reset();
  } catch (error) {
    console.error('[Analytics] Failed to reset user:', error);
  }
};

// Convenience functions for common events
export const analytics = {
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

  // App lifecycle
  appOpened: () => {
    trackEvent('app_opened');
  },

  appBackgrounded: () => {
    trackEvent('app_backgrounded');
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