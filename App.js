import React, { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './src/navigation/AppNavigator';
import { useFonts } from 'expo-font';
import {
  Poppins_400Regular,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';
import BrandedAlertHost from './src/components/BrandedAlertHost';
import { getAuthToken, peekAuthToken, preloadAuthToken } from './src/services/authStorage';
import { UnreadMessagesProvider } from './src/context/UnreadMessagesContext';
import { NotificationProvider } from './src/context/NotificationContext';
import * as Notifications from 'expo-notifications';

export default function App() {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [initialRouteName, setInitialRouteName] = useState('Login');
  const navigationRef = useRef(null);

  useEffect(() => {
    void preloadAuthToken();

    const bootstrapAuth = async () => {
      try {
        const token = peekAuthToken() ?? await getAuthToken();
        setInitialRouteName(token ? 'Home' : 'Login');
      } finally {
        setIsCheckingAuth(false);
      }
    };

    bootstrapAuth();
  }, []);

  // Handle notification responses
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      
      if (navigationRef.current && data.screen) {
        navigationRef.current.navigate(data.screen, {
          ...data,
        });
      }
    });

    return () => subscription.remove();
  }, []);

  if (!fontsLoaded || isCheckingAuth) {
    return null;
  }

  return (
    <NotificationProvider>
      <UnreadMessagesProvider>
        <NavigationContainer ref={navigationRef}>
          <BrandedAlertHost />
          <AppNavigator initialRouteName={initialRouteName} />
        </NavigationContainer>
      </UnreadMessagesProvider>
    </NotificationProvider>
  );
}


