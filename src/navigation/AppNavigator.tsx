import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text } from 'react-native';
import { colors } from '../theme/colors';

import { HomeScreen } from '../screens/HomeScreen';
import { AddRouteScreen } from '../screens/AddRouteScreen';
import { RouteDetailScreen } from '../screens/RouteDetailScreen';
import { MapScreen } from '../screens/MapScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { LogbookScreen } from '../screens/LogbookScreen';
import { AddAscentScreen } from '../screens/AddAscentScreen';
import { AddAreaScreen } from '../screens/AddAreaScreen';

export type RootStackParamList = {
  MainTabs: undefined;
  AddRoute: { routeId?: string } | undefined;
  AddArea: { areaId?: string } | undefined;
  RouteDetail: { routeId: string };
  AddAscent: { routeId: string; ascentId?: string };
};

type TabParamList = {
  Home: undefined;
  Logbook: undefined;
  Map: undefined;
  Profile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  const icons: Record<string, string> = {
    Home: '🏠',
    Logbook: '📖',
    Map: '🗺️',
    Profile: '👤',
  };
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
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        headerStyle: { backgroundColor: colors.surfaceDark },
        headerTintColor: colors.textOnDark,
        headerTitleStyle: { fontWeight: '700' },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Cesty' }} />
      <Tab.Screen name="Logbook" component={LogbookScreen} options={{ title: 'Deník' }} />
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
          headerStyle: { backgroundColor: colors.surfaceDark },
          headerTintColor: colors.textOnDark,
          headerTitleStyle: { fontWeight: '700' },
        }}
      >
        <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
        <Stack.Screen
          name="AddRoute"
          component={AddRouteScreen}
          options={({ route }) => ({
            title: route.params?.routeId ? 'Upravit cestu' : 'Nová cesta',
          })}
        />
        <Stack.Screen
          name="AddArea"
          component={AddAreaScreen}
          options={({ route }) => ({
            title: route.params?.areaId ? 'Upravit oblast' : 'Nová oblast',
          })}
        />
        <Stack.Screen name="RouteDetail" component={RouteDetailScreen} options={{ title: 'Detail cesty' }} />
        <Stack.Screen
          name="AddAscent"
          component={AddAscentScreen}
          options={({ route }) => ({
            title: route.params?.ascentId ? 'Upravit výstup' : 'Zaznamenat výstup',
          })}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
