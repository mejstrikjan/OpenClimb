import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ClimbingRoute } from '../types';
import { getAllRoutes } from '../database/routeRepository';
import type { RootStackParamList } from '../navigation/AppNavigator';

export function MapScreen() {
  const [routes, setRoutes] = useState<ClimbingRoute[]>([]);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  useFocusEffect(
    useCallback(() => {
      getAllRoutes().then(setRoutes);
    }, [])
  );

  const routesWithLocation = routes.filter((r) => r.latitude !== null && r.longitude !== null);

  // react-native-maps requires native build; show placeholder in Expo Go
  return (
    <View style={styles.container}>
      <View style={styles.placeholder}>
        <Text style={styles.icon}>🗺️</Text>
        <Text style={styles.title}>Mapa cest</Text>
        <Text style={styles.subtitle}>
          {routesWithLocation.length} cest s lokací
        </Text>
        <Text style={styles.note}>
          Mapa bude dostupná v nativním buildu (Expo dev build).{'\n'}
          V Expo Go zobrazujeme seznam cest s lokací:
        </Text>
        {routesWithLocation.length === 0 ? (
          <Text style={styles.emptyText}>Žádné cesty s lokací</Text>
        ) : (
          routesWithLocation.map((r) => (
            <Text
              key={r.id}
              style={styles.routeItem}
              onPress={() => navigation.navigate('RouteDetail', { routeId: r.id })}
            >
              📍 {r.name} ({r.grade}) — {r.latitude!.toFixed(4)}, {r.longitude!.toFixed(4)}
            </Text>
          ))
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f0f0' },
  placeholder: {
    flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24,
  },
  icon: { fontSize: 48, marginBottom: 12 },
  title: { fontSize: 22, fontWeight: '700', color: '#333', marginBottom: 4 },
  subtitle: { fontSize: 15, color: '#666', marginBottom: 16 },
  note: { fontSize: 13, color: '#999', textAlign: 'center', marginBottom: 16 },
  emptyText: { fontSize: 14, color: '#bbb' },
  routeItem: {
    fontSize: 14, color: '#2d5a27', paddingVertical: 6,
    textDecorationLine: 'underline',
  },
});
