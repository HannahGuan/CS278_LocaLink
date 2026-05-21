import React, { createContext, useContext, useState, useEffect } from 'react';
import { getCurrentUser } from '../../database/auth';
import { getUnreadCount, subscribeToAllMessages } from '../../database/messages';

interface UnreadContextType {
  totalUnread: number;
  refreshUnread: () => void;
}

const UnreadContext = createContext<UnreadContextType>({
  totalUnread: 0,
  refreshUnread: () => {},
});

export const useUnread = () => useContext(UnreadContext);

export const UnreadProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [totalUnread, setTotalUnread] = useState(0);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const user = await getCurrentUser();
      if (user) {
        setCurrentUserId(user.id);

        // Try to load unread count, but don't block if messages table doesn't exist yet
        try {
          await refreshUnread(user.id);
        } catch (error) {
          console.log('Could not load unread messages (messages table may not exist yet):', error);
          // Set to 0 if table doesn't exist
          setTotalUnread(0);
        }

        // Subscribe to new messages
        try {
          const unsubscribe = subscribeToAllMessages(user.id, () => {
            refreshUnread(user.id);
          });

          return () => {
            unsubscribe();
          };
        } catch (error) {
          console.log('Could not subscribe to messages:', error);
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
      const count = await getUnreadCount(id);
      setTotalUnread(count);
    } catch (error) {
      console.error('Error refreshing unread count:', error);
      // Don't throw - just set to 0
      setTotalUnread(0);
    }
  };

  return (
    <UnreadContext.Provider value={{ totalUnread, refreshUnread }}>
      {children}
    </UnreadContext.Provider>
  );
};
