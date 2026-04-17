import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import MainTabNavigator from './MainTabNavigator';
import AccountSettingsScreen from '../screens/AccountSettingsScreen';
import ViewYearbookScreen from '../screens/ViewYearbookScreen';
import AlumniTracerScreen from '../screens/AlumniTracerScreen';
import EventRegistrationScreen from '../screens/EventRegistrationScreen';
import EventsScreen from '../screens/EventsScreen';
import PerksScreen from '../screens/PerksScreen';
import ForgetPasswordScreen from '../screens/ForgetPasswordScreen';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        animationTypeForReplace: 'push',
        contentStyle: { backgroundColor: '#FFFFFF' },
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Home" component={MainTabNavigator} />
      <Stack.Screen name="AccountSettings" component={AccountSettingsScreen} />
      <Stack.Screen name="ViewYearbook" component={ViewYearbookScreen} />
      <Stack.Screen name="AlumniTracer" component={AlumniTracerScreen} />
      <Stack.Screen name="EventRegistration" component={EventRegistrationScreen} />
      <Stack.Screen name="EventsScreen" component={EventsScreen} />
      <Stack.Screen name="Perks" component={PerksScreen} />
      <Stack.Screen name="ForgetPassword" component={ForgetPasswordScreen} />
      {/* We will add Register and Home screens here later! */}


    </Stack.Navigator>
  );
};

export default AppNavigator;