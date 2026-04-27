import React, { useEffect, useState } from 'react';
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

export default function App() {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [initialRouteName, setInitialRouteName] = useState('Login');

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

  if (!fontsLoaded || isCheckingAuth) {
    return null;
  }

  return (
    <UnreadMessagesProvider>
      <NavigationContainer>
        <BrandedAlertHost />
        <AppNavigator initialRouteName={initialRouteName} />
      </NavigationContainer>
    </UnreadMessagesProvider>
  );
}


