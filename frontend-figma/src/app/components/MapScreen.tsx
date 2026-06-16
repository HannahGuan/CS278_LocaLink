import { useState } from 'react';
import { MapPin } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface Event {
  id: string;
  title: string;
  time: string;
  location: string;
  latitude: number;
  longitude: number;
  image: string;
  attendees: number;
}

const mockEvents: Event[] = [
  {
    id: '1',
    title: 'Comedy Night',
    time: 'Tonight, 8:00 PM',
    location: 'The Laugh Factory',
    latitude: 34.0522,
    longitude: -118.2437,
    image: 'https://images.unsplash.com/photo-1527224538127-2104bb988c51?w=400',
    attendees: 12,
  },
  {
    id: '2',
    title: 'Jazz Concert',
    time: 'Tomorrow, 7:00 PM',
    location: 'Blue Note',
    latitude: 34.0622,
    longitude: -118.2537,
    image: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=400',
    attendees: 8,
  },
  {
    id: '3',
    title: 'Art Gallery Opening',
    time: 'Saturday, 6:00 PM',
    location: 'MOCA',
    latitude: 34.0422,
    longitude: -118.2337,
    image: 'https://images.unsplash.com/photo-1531243269054-5ebf6f34081e?w=400',
    attendees: 15,
  },
  {
    id: '4',
    title: 'Food Festival',
    time: 'Sunday, 12:00 PM',
    location: 'Grand Park',
    latitude: 34.0722,
    longitude: -118.2637,
    image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400',
    attendees: 24,
  },
];

export function MapScreen() {
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  return (
    <div className="h-full relative bg-gray-100">
      {/* Mock Map Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-green-50">
        {/* Grid pattern to simulate map */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `
              linear-gradient(to right, #ddd 1px, transparent 1px),
              linear-gradient(to bottom, #ddd 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      {/* Event Pins */}
      {mockEvents.map((event, index) => (
        <button
          key={event.id}
          onClick={() => setSelectedEvent(event)}
          className="absolute transition-transform hover:scale-110"
          style={{
            left: `${20 + index * 20}%`,
            top: `${30 + index * 15}%`,
          }}
        >
          <div className="relative">
            <MapPin className="w-10 h-10 fill-[#8A2BE2] text-white drop-shadow-lg" />
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-white rounded-full border-2 border-[#8A2BE2] flex items-center justify-center text-xs font-bold text-[#8A2BE2]">
              {event.attendees}
            </div>
          </div>
        </button>
      ))}

      {/* Floating Event Card */}
      {selectedEvent && (
        <div className="absolute bottom-24 left-4 right-4 bg-white rounded-3xl shadow-2xl overflow-hidden">
          <button
            onClick={() => setSelectedEvent(null)}
            className="absolute top-4 right-4 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center shadow-md z-10"
          >
            <svg
              className="w-5 h-5 text-gray-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          <div className="relative h-48">
            <ImageWithFallback
              src={selectedEvent.image}
              alt={selectedEvent.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          </div>

          <div className="p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {selectedEvent.title}
            </h3>
            <div className="flex items-center text-gray-600 mb-1">
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {selectedEvent.time}
            </div>
            <div className="flex items-center text-gray-600 mb-4">
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              {selectedEvent.location}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex -space-x-2">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 border-2 border-white"
                  />
                ))}
                <div className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-xs font-medium text-gray-600">
                  +{selectedEvent.attendees - 3}
                </div>
              </div>
              <button className="px-6 py-2 bg-[#8A2BE2] text-white rounded-full font-medium shadow-md hover:bg-[#7A1FD2]">
                View Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="absolute top-4 left-4 right-4">
        <div className="bg-white rounded-2xl shadow-lg px-4 py-3 flex items-center">
          <svg
            className="w-5 h-5 text-gray-400 mr-3"
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
          <input
            type="text"
            placeholder="Search events..."
            className="flex-1 outline-none text-gray-700"
          />
        </div>
      </div>
    </div>
  );
}
