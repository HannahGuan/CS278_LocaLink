export interface User {
  id: string;
  name: string;
  year: string;
  major: string;
  photo: string;
  interests: string[];
  location?: { lat: number; lng: number; label: string };
  isOnline: boolean;
  distance?: number;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  location: string;
  locationCoords: { lat: number; lng: number };
  time: string;
  date: string;
  organizer: string;
  attendees: string[];
  category: string;
  icon: string;
  imageUrl?: string;
  website?: string; // Original event URL (from Stanford RSS or user input)
}

export interface Message {
  id: string;
  userId: string;
  text: string;
  timestamp: string;
  isMe: boolean;
}

export interface Chat {
  id: string;
  userId: string;
  userName: string;
  userPhoto: string;
  lastMessage: string;
  timestamp: string;
  unread: number;
  isActive?: boolean;
}
