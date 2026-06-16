import { ImageWithFallback } from './figma/ImageWithFallback';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';

interface Activity {
  id: string;
  user: {
    name: string;
    avatar: string;
    initials: string;
  };
  event: {
    title: string;
    image: string;
    time: string;
  };
  timestamp: string;
}

const mockActivities: Activity[] = [
  {
    id: '1',
    user: {
      name: 'Hannah Miller',
      avatar: 'https://i.pravatar.cc/150?img=1',
      initials: 'HM',
    },
    event: {
      title: 'Comedy Show',
      image: 'https://images.unsplash.com/photo-1527224538127-2104bb988c51?w=400',
      time: 'Tonight at 8:00 PM',
    },
    timestamp: '2 hours ago',
  },
  {
    id: '2',
    user: {
      name: 'Alex Chen',
      avatar: 'https://i.pravatar.cc/150?img=12',
      initials: 'AC',
    },
    event: {
      title: 'Jazz Concert',
      image: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=400',
      time: 'Tomorrow at 7:00 PM',
    },
    timestamp: '5 hours ago',
  },
  {
    id: '3',
    user: {
      name: 'Sarah Johnson',
      avatar: 'https://i.pravatar.cc/150?img=5',
      initials: 'SJ',
    },
    event: {
      title: 'Art Gallery Opening',
      image: 'https://images.unsplash.com/photo-1531243269054-5ebf6f34081e?w=400',
      time: 'Saturday at 6:00 PM',
    },
    timestamp: '1 day ago',
  },
  {
    id: '4',
    user: {
      name: 'Michael Park',
      avatar: 'https://i.pravatar.cc/150?img=8',
      initials: 'MP',
    },
    event: {
      title: 'Food Festival',
      image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400',
      time: 'Sunday at 12:00 PM',
    },
    timestamp: '1 day ago',
  },
  {
    id: '5',
    user: {
      name: 'Emma Davis',
      avatar: 'https://i.pravatar.cc/150?img=9',
      initials: 'ED',
    },
    event: {
      title: 'Rock Concert',
      image: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=400',
      time: 'Next Friday at 9:00 PM',
    },
    timestamp: '2 days ago',
  },
];

export function FeedScreen() {
  return (
    <div className="h-full bg-white overflow-auto">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 z-10">
        <h1 className="text-2xl font-bold text-gray-900">Activity Feed</h1>
        <p className="text-sm text-gray-500 mt-1">See what your friends are up to</p>
      </div>

      {/* Feed Items */}
      <div className="px-4 py-4 space-y-4">
        {mockActivities.map((activity) => (
          <div
            key={activity.id}
            className="bg-white rounded-3xl shadow-md overflow-hidden border border-gray-100"
          >
            {/* User Header */}
            <div className="flex items-center px-5 py-4">
              <Avatar className="w-12 h-12">
                <AvatarImage src={activity.user.avatar} alt={activity.user.name} />
                <AvatarFallback className="bg-gradient-to-br from-purple-400 to-pink-400 text-white">
                  {activity.user.initials}
                </AvatarFallback>
              </Avatar>
              <div className="ml-3 flex-1">
                <p className="text-gray-900 font-semibold">{activity.user.name}</p>
                <p className="text-sm text-gray-500">{activity.timestamp}</p>
              </div>
              <button className="text-gray-400">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                  />
                </svg>
              </button>
            </div>

            {/* Activity Text */}
            <div className="px-5 pb-3">
              <p className="text-gray-700">
                is attending <span className="font-bold text-gray-900">{activity.event.title}</span>
              </p>
              <p className="text-sm text-gray-500 mt-1">{activity.event.time}</p>
            </div>

            {/* Event Image */}
            <div className="relative h-64">
              <ImageWithFallback
                src={activity.event.image}
                alt={activity.event.title}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between px-5 py-4">
              <div className="flex items-center space-x-6">
                <button className="flex items-center text-gray-600 hover:text-[#8A2BE2]">
                  <svg
                    className="w-6 h-6 mr-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                  <span className="text-sm">12</span>
                </button>
                <button className="flex items-center text-gray-600 hover:text-[#8A2BE2]">
                  <svg
                    className="w-6 h-6 mr-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                  <span className="text-sm">5</span>
                </button>
              </div>
              <Button className="px-6 py-2 h-9 bg-[#8A2BE2] hover:bg-[#7A1FD2] text-white rounded-full shadow-md">
                View Details
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
