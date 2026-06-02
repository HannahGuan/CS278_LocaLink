import React, { createContext, useContext, useState, useEffect } from 'react';
import { getCurrentUser } from '../../database/auth';
import { getUnreadCount, subscribeToAllMessages } from '../../database/messages';
import { databaseClient } from '../../database/databaseClient';
import { supabase } from '../../database/supabase';

interface UnreadContextType {
  totalUnread: number;
  unreadMessages: number;
  pendingFriendRequests: number;
  refreshUnread: () => void;
}

const UnreadContext = createContext<UnreadContextType>({
  totalUnread: 0,
  unreadMessages: 0,
  pendingFriendRequests: 0,
  refreshUnread: () => {},
});

export const useUnread = () => useContext(UnreadContext);

export const UnreadProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [pendingFriendRequests, setPendingFriendRequests] = useState(0);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Total unread = messages + friend requests
  const totalUnread = unreadMessages + pendingFriendRequests;

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const user = await getCurrentUser();
      if (user) {
        setCurrentUserId(user.id);

        // Load initial counts
        try {
          await refreshUnread(user.id);
        } catch (error) {
          console.log('Could not load unread counts:', error);
          setUnreadMessages(0);
          setPendingFriendRequests(0);
        }

        // Subscribe to new messages
        try {
          const unsubscribeMessages = subscribeToAllMessages(user.id, () => {
            refreshUnread(user.id);
          });

          // Subscribe to friend request changes
          const channelName = `friend-requests-${user.id}-${Date.now()}`;
          const friendRequestChannel = supabase
            .channel(channelName)
            .on(
              'postgres_changes',
              {
                event: '*', // Listen to INSERT, UPDATE, DELETE
                schema: 'public',
                table: 'friends',
                filter: `friend_id=eq.${user.id}`, // Only requests where I'm the recipient
              },
              () => {
                console.log('[UnreadContext] Friend request change detected');
                refreshUnread(user.id);
              }
            )
            .subscribe();

          return () => {
            unsubscribeMessages();
            supabase.removeChannel(friendRequestChannel);
          };
        } catch (error) {
          console.log('Could not subscribe to realtime updates:', error);
        }
      }
    } catch (error) {
      console.error('Error loading user in UnreadContext:', error);
    }
  };

  const refreshUnread = async (userId?: string) => {
    const id = userId || currentUserId;
    if (!id) return;

    try {
      // Get unread message count
      const messageCount = await getUnreadCount(id);
      setUnreadMessages(messageCount);

      // Get pending friend request count
      const friendRequests = await databaseClient.getIncomingPendingRequests(id);
      setPendingFriendRequests(friendRequests.length);

      console.log('[UnreadContext] Counts updated:', {
        messages: messageCount,
        friendRequests: friendRequests.length,
        total: messageCount + friendRequests.length,
      });
    } catch (error) {
      console.error('Error refreshing unread counts:', error);
      // Don't throw - just set to 0
      setUnreadMessages(0);
      setPendingFriendRequests(0);
    }
  };

  return (
    <UnreadContext.Provider
      value={{
        totalUnread,
        unreadMessages,
        pendingFriendRequests,
        refreshUnread,
      }}
    >
      {children}
    </UnreadContext.Provider>
  );
};
