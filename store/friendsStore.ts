import { create } from 'zustand';
import { FriendWithDetails } from '../types';

interface FriendsState {
  friends: FriendWithDetails[];
  setFriends: (friends: FriendWithDetails[]) => void;
  addFriend: (friend: FriendWithDetails) => void;
}

export const useFriendsStore = create<FriendsState>((set) => ({
  friends: [],
  setFriends: (friends) => set({ friends }),
  addFriend: (friend) => set((state) => ({ friends: [...state.friends, friend] })),
}));