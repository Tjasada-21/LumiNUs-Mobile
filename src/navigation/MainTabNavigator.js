import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import HomeScreen from '../screens/HomeScreen';
import ExploreScreen from '../screens/ExploreScreen';

// A temporary placeholder screen for your other tabs until we build them!
const DummyScreen = ({ name }) => (
  <View style={styles.dummyContainer}>
    <Text style={styles.dummyText}>{name} Screen Coming Soon</Text>
  </View>
);

const Tab = createBottomTabNavigator();

const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          // Assigning the exact icons from your Figma design
          if (route.name === 'HomeTab') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Messages') {
            iconName = focused ? 'chatbubble' : 'chatbubble-outline';
          } else if (route.name === 'Explore') {
            iconName = focused ? 'earth' : 'earth-outline';
          } else if (route.name === 'Forms') {
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
        tabBarStyle: {
          height: 65, // Gives the bar a nice, thick touch target
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E2E8F0',
          elevation: 10, // Adds a slight shadow on Android
        }
      })}
    >
      {/* Tab 1: The actual Home Screen */}
      <Tab.Screen name="HomeTab" component={HomeScreen} />
      
      {/* Tabs 2-5: The Placeholders */}
      <Tab.Screen name="Messages" children={() => <DummyScreen name="Messages" />} />
      <Tab.Screen
        name="Explore"
        component={ExploreScreen}
        options={{
          tabBarStyle: {
            height: 65,
            backgroundColor: '#F2C919',
            borderTopWidth: 0,
            elevation: 10,
          },
          tabBarActiveTintColor: '#31429B',
          tabBarInactiveTintColor: '#31429B',
        }}
      />
      <Tab.Screen name="Forms" children={() => <DummyScreen name="Forms" />} />
      <Tab.Screen name="Profile" children={() => <DummyScreen name="Profile" />} />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  dummyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F6F8' },
  dummyText: { fontSize: 18, color: '#31429B', fontWeight: 'bold' }
});

export default MainTabNavigator;