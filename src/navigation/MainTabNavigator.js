import React from 'react';
import { View, Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import HomeScreen from '../screens/HomeScreen';
import ChatScreen from '../screens/ChatScreen';
import UserProfileScreen from '../screens/UserProfileScreen';
import FeedScreen from '../screens/UserFeedScreen';
import ViewYearbookScreen from '../screens/ViewYearbookScreen';
import EventsScreen from '../screens/EventsScreen';
import ExploreStackNavigator from './ExploreStackNavigator';
import { sharedScreenStyles } from '../styles/sharedStyles';

// A temporary placeholder screen for your other tabs until we build them!
const DummyScreen = ({ name }) => (
  <View style={sharedScreenStyles.container}>
    <Text style={sharedScreenStyles.title}>{name} Screen Coming Soon</Text>
  </View>
);

const Tab = createBottomTabNavigator();

const MainTabNavigator = () => {
  const getTabBarStyle = (route) => {
    const baseStyle = {
      height: 65,
      backgroundColor: '#FFFFFF',
      borderTopWidth: 1,
      borderTopColor: '#E2E8F0',
      paddingTop: 0,
      paddingBottom: 0,
      elevation: 10,
    };

    if (route.name !== 'Explore') {
      return baseStyle;
    }

    const nestedRouteName = getFocusedRouteNameFromRoute(route);

    if (!nestedRouteName || nestedRouteName === 'ExploreHome') {
      return {
        ...baseStyle,
        backgroundColor: '#F2C919',
        borderTopWidth: 0,
      };
    }

    return baseStyle;
  };

  return (
    <Tab.Navigator
      sceneContainerStyle={{ backgroundColor: '#FFFFFF' }}
      screenOptions={({ route }) => ({
        animation: 'shift',
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          // Assigning the exact icons from your Figma design
          if (route.name === 'HomeTab') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Messages') {
            iconName = focused ? 'chatbubble' : 'chatbubble-outline';
          } else if (route.name === 'Explore') {
            iconName = focused ? 'earth' : 'earth-outline';
          } else if (route.name === 'Feed') {
            iconName = focused ? 'document-text' : 'document-text-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          // We make the icon slightly larger when focused for a premium feel
          return <Ionicons name={iconName} size={focused ? 28 : 24} color={color} />;
        },
        tabBarActiveTintColor: '#31429B', // Active icon color (NU Blue)
        tabBarInactiveTintColor: '#8E8E93', // Inactive icon color (Grey)
        tabBarShowLabel: false, // Hides the text labels to match your design
        headerShown: false, // Hides the default top header (since you built a custom one)
        tabBarStyle: getTabBarStyle(route),
      })}
    >
      {/* Tab 1: The actual Home Screen */}
      <Tab.Screen name="HomeTab" component={HomeScreen} />
      
      {/* Tabs 2-5: The Placeholders */}
      <Tab.Screen name="Messages" component={ChatScreen} />
      <Tab.Screen
        name="Explore"
        component={ExploreStackNavigator}
        options={{
          tabBarActiveTintColor: '#31429B',
          tabBarInactiveTintColor: '#31429B',
        }}
      />
      <Tab.Screen name="Feed" component={FeedScreen} />
      <Tab.Screen name="Profile" component={UserProfileScreen} />
      <Tab.Screen
        name="ViewYearbook"
        component={ViewYearbookScreen}
        options={{
          tabBarButton: () => null,
          tabBarItemStyle: { display: 'none' },
        }}
      />
      <Tab.Screen
        name="EventsScreen"
        component={EventsScreen}
        options={{
          tabBarButton: () => null,
          tabBarItemStyle: { display: 'none' },
        }}
      />
    </Tab.Navigator>
  );
};

export default MainTabNavigator;