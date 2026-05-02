import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface PastEvent {
  id: string;
  title: string;
  date: string;
  image: string;
}

const mockPastEvents: PastEvent[] = [
  {
    id: '1',
    title: 'Summer Music Festival',
    date: 'July 15, 2025',
    image: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=400',
  },
  {
    id: '2',
    title: 'Tech Conference',
    date: 'June 22, 2025',
    image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400',
  },
  {
    id: '3',
    title: 'Wine Tasting',
    date: 'June 10, 2025',
    image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400',
  },
  {
    id: '4',
    title: 'Cooking Class',
    date: 'May 28, 2025',
    image: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=400',
  },
  {
    id: '5',
    title: 'Hiking Trip',
    date: 'May 15, 2025',
    image: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=400',
  },
  {
    id: '6',
    title: 'Movie Premiere',
    date: 'April 30, 2025',
    image: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400',
  },
];

export function ProfileScreen() {
  return (
    <div className="h-full bg-white overflow-auto">
      {/* Header with Profile */}
      <div className="bg-gradient-to-br from-purple-500 to-pink-500 px-6 pt-12 pb-8">
        <div className="flex flex-col items-center">
          <Avatar className="w-24 h-24 border-4 border-white shadow-xl">
            <AvatarImage src="https://i.pravatar.cc/150?img=3" alt="You" />
            <AvatarFallback className="bg-white text-purple-600 text-2xl font-bold">
              ME
            </AvatarFallback>
          </Avatar>
          <h1 className="text-2xl font-bold text-white mt-4">Jordan Smith</h1>
          <p className="text-purple-100 mt-1">@jordansmith</p>

          <button className="mt-4 px-6 py-2 bg-white text-[#8A2BE2] rounded-full font-medium shadow-md hover:bg-gray-50">
            Edit Profile
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="flex items-center justify-around py-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">142</p>
            <p className="text-sm text-gray-500 mt-1">Friends</p>
          </div>
          <div className="w-px h-12 bg-gray-200"></div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">38</p>
            <p className="text-sm text-gray-500 mt-1">Events Attended</p>
          </div>
          <div className="w-px h-12 bg-gray-200"></div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">12</p>
            <p className="text-sm text-gray-500 mt-1">Events Shared</p>
          </div>
        </div>
      </div>

      {/* Past Events */}
      <div className="px-6 py-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Past Events</h2>

        {/* Grid Layout */}
        <div className="grid grid-cols-2 gap-4">
          {mockPastEvents.map((event) => (
            <div
              key={event.id}
              className="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-100"
            >
              <div className="relative h-32">
                <ImageWithFallback
                  src={event.image}
                  alt={event.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <p className="text-white font-semibold text-sm line-clamp-2">
                    {event.title}
                  </p>
                </div>
              </div>
              <div className="px-3 py-2">
                <p className="text-xs text-gray-500">{event.date}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Settings Section */}
      <div className="px-6 pb-24">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Settings</h2>
        <div className="space-y-2">
          <button className="w-full flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:bg-gray-50">
            <span className="text-gray-900 font-medium">Account Settings</span>
            <svg
              className="w-5 h-5 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
          <button className="w-full flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:bg-gray-50">
            <span className="text-gray-900 font-medium">Privacy</span>
            <svg
              className="w-5 h-5 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
          <button className="w-full flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:bg-gray-50">
            <span className="text-gray-900 font-medium">Notifications</span>
            <svg
              className="w-5 h-5 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
