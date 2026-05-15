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
    const user = await getCurrentUser();
    if (user) {
      setCurrentUserId(user.id);
      await refreshUnread(user.id);

      // Subscribe to new messages
      const unsubscribe = subscribeToAllMessages(user.id, () => {
        refreshUnread(user.id);
      });

      return () => {
        unsubscribe();
      };
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
    }
  };

  return (
    <UnreadContext.Provider value={{ totalUnread, refreshUnread }}>
      {children}
    </UnreadContext.Provider>
  );
};
