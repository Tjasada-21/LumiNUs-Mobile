import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AppState } from 'react-native';
import api from '../services/api';
import { getAuthToken } from '../services/authStorage';

const UnreadMessagesContext = createContext({
  unreadCount: 0,
  refreshUnreadMessages: async () => 0,
});

export const UnreadMessagesProvider = ({ children }) => {
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshUnreadMessages = useCallback(async () => {
    try {
      const token = await getAuthToken();

      if (!token) {
        setUnreadCount(0);
        return 0;
      }

      const response = await api.get('/messages/unread-count');
      const nextUnreadCount = Number(response.data?.unread_count ?? 0);
      const normalizedUnreadCount = Number.isFinite(nextUnreadCount) ? nextUnreadCount : 0;

      setUnreadCount(normalizedUnreadCount);

      return normalizedUnreadCount;
    } catch (error) {
      console.error('Failed to fetch unread message count:', error);
      setUnreadCount(0);
      return 0;
    }
  }, []);

  useEffect(() => {
    void refreshUnreadMessages();
  }, [refreshUnreadMessages]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      void refreshUnreadMessages();
    }, 30000);

    return () => clearInterval(intervalId);
  }, [refreshUnreadMessages]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        void refreshUnreadMessages();
      }
    });

    return () => subscription.remove();
  }, [refreshUnreadMessages]);

  const value = useMemo(() => ({
    unreadCount,
    refreshUnreadMessages,
  }), [unreadCount, refreshUnreadMessages]);

  return (
    <UnreadMessagesContext.Provider value={value}>
      {children}
    </UnreadMessagesContext.Provider>
  );
};

export const useUnreadMessages = () => useContext(UnreadMessagesContext);