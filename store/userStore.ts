import { create } from 'zustand';
import { User, Location } from '../types';

interface UserState {
  currentUser: User | null;
  userLocation: Location | null;
  setCurrentUser: (user: User | null) => void;
  setUserLocation: (location: Location) => void;
}

export const useUserStore = create<UserState>((set) => ({
  currentUser: null,
  userLocation: null,
  setCurrentUser: (user) => set({ currentUser: user }),
  setUserLocation: (location) => set({ userLocation: location }),
}));