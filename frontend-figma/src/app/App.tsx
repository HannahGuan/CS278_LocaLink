import { useState } from 'react';
import { Onboarding } from './components/Onboarding';
import { MapScreen } from './components/MapScreen';
import { FeedScreen } from './components/FeedScreen';
import { FriendsScreen } from './components/FriendsScreen';
import { ProfileScreen } from './components/ProfileScreen';
import { BottomNav } from './components/BottomNav';
import { CreateEventModal } from './components/CreateEventModal';
import { Plus } from 'lucide-react';

export default function App() {
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [activeScreen, setActiveScreen] = useState('map');
  const [createModalOpen, setCreateModalOpen] = useState(false);

  if (!isOnboarded) {
    return (
      <div className="h-screen w-screen max-w-md mx-auto bg-white">
        <Onboarding onComplete={() => setIsOnboarded(true)} />
      </div>
    );
  }

  return (
    <div className="h-screen w-screen max-w-md mx-auto bg-white relative">
      {/* Main Content */}
      <div className="h-full pb-20">
        {activeScreen === 'map' && <MapScreen />}
        {activeScreen === 'feed' && <FeedScreen />}
        {activeScreen === 'friends' && <FriendsScreen />}
        {activeScreen === 'profile' && <ProfileScreen />}
      </div>

      {/* Floating Create Button */}
      <button
        onClick={() => setCreateModalOpen(true)}
        className="fixed top-6 right-6 w-14 h-14 bg-[#8A2BE2] hover:bg-[#7A1FD2] text-white rounded-full shadow-2xl flex items-center justify-center z-40 transition-transform hover:scale-110"
      >
        <Plus className="w-7 h-7" />
      </button>

      {/* Bottom Navigation */}
      <BottomNav activeScreen={activeScreen} onNavigate={setActiveScreen} />

      {/* Create Event Modal */}
      <CreateEventModal open={createModalOpen} onOpenChange={setCreateModalOpen} />
    </div>
  );
}