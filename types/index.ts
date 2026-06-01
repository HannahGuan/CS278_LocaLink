// User related types
export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

// Location related types
export interface Location {
  latitude: number;
  longitude: number;
}

export interface UserLocation extends Location {
  user_id: string;
  timestamp: string;
}

// Friend related types
export interface Friend {
  id: string;
  user_id: string;
  friend_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
}

export interface FriendWithDetails extends Friend {
  friend: Profile;
  location?: Location;
}

// Profile related types
export interface Profile extends User {
  bio?: string;
  phone?: string;
  year?: string;
  major?: string;
  interests?: string[];
  social_style?: {
    introvert_extrovert: number;
    spontaneous_planned: number;
  };
  onboarding_completed?: boolean;
}