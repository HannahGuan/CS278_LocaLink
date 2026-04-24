import { User, FriendWithDetails, Location } from '../types';

export const mockUsers: User[] = [
  {
    id: '1',
    email: 'alice@example.com',
    name: 'Alice Johnson',
    avatar_url: '#FF6347',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    email: 'bob@example.com',
    name: 'Bob Smith',
    avatar_url: '#FF7F50',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: '3',
    email: 'carol@example.com',
    name: 'Carol Williams',
    avatar_url: '#FF8C69',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
];

export const mockFriends: FriendWithDetails[] = [
  {
    id: 'f1',
    user_id: '1',
    friend_id: '2',
    status: 'accepted',
    created_at: '2024-01-01T00:00:00Z',
    friend: mockUsers[1],
    location: {
      latitude: 37.7849,
      longitude: -122.4094,
    },
  },
  {
    id: 'f2',
    user_id: '1',
    friend_id: '3',
    status: 'accepted',
    created_at: '2024-01-01T00:00:00Z',
    friend: mockUsers[2],
    location: {
      latitude: 37.7899,
      longitude: -122.4024,
    },
  },
];

export const mockCurrentUserLocation: Location = {
  latitude: 37.7749,
  longitude: -122.4194,
};