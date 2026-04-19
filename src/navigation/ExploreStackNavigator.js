import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ExploreScreen from '../screens/ExploreScreen';
import PerksScreen from '../screens/PerksScreen';

const Stack = createNativeStackNavigator();

const ExploreStackNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ExploreHome" component={ExploreScreen} />
      <Stack.Screen name="Perks" component={PerksScreen} />
    </Stack.Navigator>
  );
};

export default ExploreStackNavigator;