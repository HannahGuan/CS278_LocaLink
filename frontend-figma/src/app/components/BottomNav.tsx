import { Map, Home, Users, User } from 'lucide-react';

interface BottomNavProps {
  activeScreen: string;
  onNavigate: (screen: string) => void;
}

export function BottomNav({ activeScreen, onNavigate }: BottomNavProps) {
  const navItems = [
    { id: 'map', label: 'Map', icon: Map },
    { id: 'feed', label: 'Feed', icon: Home },
    { id: 'friends', label: 'Friends', icon: Users },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
      <div className="flex items-center justify-around h-20 px-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeScreen === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className="flex flex-col items-center justify-center flex-1 transition-colors"
            >
              <div
                className={`p-2 rounded-2xl transition-all ${
                  isActive ? 'bg-[#8A2BE2]' : ''
                }`}
              >
                <Icon
                  className={`w-6 h-6 ${
                    isActive ? 'text-white' : 'text-gray-400'
                  }`}
                />
              </div>
              <span
                className={`text-xs mt-1 ${
                  isActive ? 'text-[#8A2BE2] font-semibold' : 'text-gray-500'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
