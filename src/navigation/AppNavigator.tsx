import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text } from 'react-native';

import { HomeScreen } from '../screens/HomeScreen';
import { AddRouteScreen } from '../screens/AddRouteScreen';
import { RouteDetailScreen } from '../screens/RouteDetailScreen';
import { MapScreen } from '../screens/MapScreen';
import { ProfileScreen } from '../screens/ProfileScreen';

export type RootStackParamList = {
  MainTabs: undefined;
  AddRoute: undefined;
  RouteDetail: { routeId: string };
};

type TabParamList = {
  Home: undefined;
  Map: undefined;
  Profile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  const icons: Record<string, string> = { Home: '🏠', Map: '🗺️', Profile: '👤' };
  return (
    <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>
      {icons[label] || '?'}
    </Text>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused }) => <TabIcon label={route.name} focused={focused} />,
        tabBarActiveTintColor: '#2d5a27',
        tabBarInactiveTintColor: '#999',
        headerStyle: { backgroundColor: '#2d5a27' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '700' },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Cesty' }} />
      <Tab.Screen name="Map" component={MapScreen} options={{ title: 'Mapa' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profil' }} />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: '#2d5a27' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: '700' },
        }}
      >
        <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
        <Stack.Screen name="AddRoute" component={AddRouteScreen} options={{ title: 'Nová cesta' }} />
        <Stack.Screen name="RouteDetail" component={RouteDetailScreen} options={{ title: 'Detail cesty' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
