import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import MainTabNavigator from './MainTabNavigator';
import AccountSettingsScreen from '../screens/AccountSettingsScreen';
import ViewYearbookScreen from '../screens/ViewYearbookScreen';
import AlumniTracerScreen from '../screens/AlumniTracerScreen';
import EventRegistrationScreen from '../screens/EventRegistrationScreen';
import ForgetPasswordScreen from '../screens/ForgetPasswordScreen';
import NewMessageScreen from '../screens/NewMessageScreen';
import CreatePostScreen from '../screens/CreatePostScreen';
import ViewEventsScreen from '../screens/ViewEventsScreen';
import ResetPasswordScreen from '../screens/ResetPasswordScreen';
import SearchMessageScreen from '../screens/SearchMessageScreen';
import ConvoScreen from '../screens/ConvoScreen';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'fade_from_bottom',
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
      <Stack.Screen name="ForgetPassword" component={ForgetPasswordScreen} />
      <Stack.Screen name="NewMessage" component={NewMessageScreen} />
      <Stack.Screen name="ConvoScreen" component={ConvoScreen} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
      <Stack.Screen name="SearchMessage" component={SearchMessageScreen} />
      <Stack.Screen name="CreatePostScreen" component={CreatePostScreen} />
      <Stack.Screen name="ViewEventsScreen" component={ViewEventsScreen} />
      {/* We will add Register and Home screens here later! */}


    </Stack.Navigator>
  );
};

export default AppNavigator;