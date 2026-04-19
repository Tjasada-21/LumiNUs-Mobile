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
import ForgetPasswordScreen from '../screens/ForgetPasswordScreen';
import ResetPasswordScreen from '../screens/ResetPasswordScreen';
import SearchMessageScreen from '../screens/SearchMessageScreen';

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
      <Stack.Screen name="ForgetPassword" component={ForgetPasswordScreen} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
      <Stack.Screen name="SearchMessage" component={SearchMessageScreen} />
      {/* We will add Register and Home screens here later! */}


    </Stack.Navigator>
  );
};

export default AppNavigator;