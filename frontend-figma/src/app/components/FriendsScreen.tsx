import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { Input } from './ui/input';

interface Friend {
  id: string;
  name: string;
  avatar: string;
  initials: string;
  mutualFriends: number;
  isAdded: boolean;
}

const mockRecommended: Friend[] = [
  {
    id: '1',
    name: 'Jessica Lee',
    avatar: 'https://i.pravatar.cc/150?img=10',
    initials: 'JL',
    mutualFriends: 8,
    isAdded: false,
  },
  {
    id: '2',
    name: 'David Kim',
    avatar: 'https://i.pravatar.cc/150?img=13',
    initials: 'DK',
    mutualFriends: 5,
    isAdded: false,
  },
  {
    id: '3',
    name: 'Rachel Green',
    avatar: 'https://i.pravatar.cc/150?img=16',
    initials: 'RG',
    mutualFriends: 12,
    isAdded: false,
  },
  {
    id: '4',
    name: 'Tom Anderson',
    avatar: 'https://i.pravatar.cc/150?img=14',
    initials: 'TA',
    mutualFriends: 3,
    isAdded: false,
  },
];

const mockSearchResults: Friend[] = [
  {
    id: '5',
    name: 'Lisa Wang',
    avatar: 'https://i.pravatar.cc/150?img=20',
    initials: 'LW',
    mutualFriends: 2,
    isAdded: false,
  },
  {
    id: '6',
    name: 'James Martinez',
    avatar: 'https://i.pravatar.cc/150?img=15',
    initials: 'JM',
    mutualFriends: 6,
    isAdded: false,
  },
];

export function FriendsScreen() {
  const [recommended, setRecommended] = useState(mockRecommended);
  const [searchResults, setSearchResults] = useState<Friend[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const handleAddFriend = (id: string, list: 'recommended' | 'search') => {
    if (list === 'recommended') {
      setRecommended((prev) =>
        prev.map((friend) =>
          friend.id === id ? { ...friend, isAdded: true } : friend
        )
      );
    } else {
      setSearchResults((prev) =>
        prev.map((friend) =>
          friend.id === id ? { ...friend, isAdded: true } : friend
        )
      );
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.length > 0) {
      setSearchResults(mockSearchResults);
    } else {
      setSearchResults([]);
    }
  };

  return (
    <div className="h-full bg-white overflow-auto">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 z-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Find Friends</h1>

        {/* Search Bar */}
        <div className="relative">
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <Input
            type="text"
            placeholder="Search for friends..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-12 h-12 rounded-2xl border-gray-200"
          />
        </div>
      </div>

      <div className="px-6 py-6">
        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Search Results</h2>
            <div className="space-y-3">
              {searchResults.map((friend) => (
                <FriendCard
                  key={friend.id}
                  friend={friend}
                  onAdd={() => handleAddFriend(friend.id, 'search')}
                />
              ))}
            </div>
          </div>
        )}

        {/* Recommended */}
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-4">Recommended</h2>
          <div className="space-y-3">
            {recommended.map((friend) => (
              <FriendCard
                key={friend.id}
                friend={friend}
                onAdd={() => handleAddFriend(friend.id, 'recommended')}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function FriendCard({ friend, onAdd }: { friend: Friend; onAdd: () => void }) {
  return (
    <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
      <div className="flex items-center">
        <Avatar className="w-14 h-14">
          <AvatarImage src={friend.avatar} alt={friend.name} />
          <AvatarFallback className="bg-gradient-to-br from-purple-400 to-pink-400 text-white">
            {friend.initials}
          </AvatarFallback>
        </Avatar>
        <div className="ml-4">
          <p className="font-semibold text-gray-900">{friend.name}</p>
          <p className="text-sm text-gray-500">
            {friend.mutualFriends} mutual friends
          </p>
        </div>
      </div>
      <Button
        onClick={onAdd}
        disabled={friend.isAdded}
        className={`px-6 py-2 h-9 rounded-full shadow-md ${
          friend.isAdded
            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
            : 'bg-[#8A2BE2] hover:bg-[#7A1FD2] text-white'
        }`}
      >
        {friend.isAdded ? 'Added' : 'Add Friend'}
      </Button>
    </div>
  );
}
