import React, { useState, useCallback } from 'react';
import { View, Text, Image, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ClimbingRoute } from '../types';
import { getRouteById, deleteRoute } from '../database/routeRepository';
import { StarRating } from '../components/StarRating';
import type { RootStackParamList } from '../navigation/AppNavigator';

const TYPE_LABELS: Record<string, string> = {
  sport: '🧗 Sport',
  boulder: '🪨 Boulder',
  trad: '⛰️ Trad',
  indoor: '🏢 Indoor',
};

export function RouteDetailScreen() {
  const { params } = useRoute<RouteProp<RootStackParamList, 'RouteDetail'>>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [route, setRoute] = useState<ClimbingRoute | null>(null);

  useFocusEffect(
    useCallback(() => {
      getRouteById(params.routeId).then(setRoute);
    }, [params.routeId])
  );

  const handleDelete = () => {
    Alert.alert('Smazat cestu', 'Opravdu chcete smazat tuto cestu?', [
      { text: 'Zrušit', style: 'cancel' },
      {
        text: 'Smazat', style: 'destructive',
        onPress: async () => {
          await deleteRoute(params.routeId);
          navigation.goBack();
        },
      },
    ]);
  };

  if (!route) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingText}>Načítání...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {route.photo_uri && (
        <Image source={{ uri: route.photo_uri }} style={styles.photo} />
      )}

      <View style={styles.header}>
        <Text style={styles.name}>{route.name}</Text>
        <View style={styles.gradeBadge}>
          <Text style={styles.gradeText}>{route.grade || '?'} ({route.grade_system})</Text>
        </View>
      </View>

      <View style={styles.metaRow}>
        <Text style={styles.typeLabel}>{TYPE_LABELS[route.type] || route.type}</Text>
        <StarRating rating={route.rating} size={22} readonly />
      </View>

      {route.description ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Popis</Text>
          <Text style={styles.description}>{route.description}</Text>
        </View>
      ) : null}

      {route.latitude !== null && route.longitude !== null && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Lokace</Text>
          <Text style={styles.coords}>
            📍 {route.latitude.toFixed(6)}, {route.longitude.toFixed(6)}
          </Text>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Info</Text>
        <Text style={styles.info}>Vytvořeno: {new Date(route.created_at).toLocaleDateString('cs-CZ')}</Text>
        <Text style={styles.info}>Upraveno: {new Date(route.updated_at).toLocaleDateString('cs-CZ')}</Text>
        <Text style={styles.info}>
          Stav: {route.synced ? '✅ Synchronizováno' : '⏳ Čeká na synchronizaci'}
        </Text>
      </View>

      <TouchableOpacity
        style={styles.editButton}
        onPress={() => navigation.navigate('AddRoute', { routeId: route.id })}
      >
        <Text style={styles.editButtonText}>Upravit cestu</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
        <Text style={styles.deleteButtonText}>Smazat cestu</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f0f0' },
  content: { paddingBottom: 40 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 16, color: '#999' },
  photo: { width: '100%', height: 250 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', padding: 16, paddingBottom: 8,
  },
  name: { fontSize: 22, fontWeight: '800', color: '#222', flex: 1, marginRight: 8 },
  gradeBadge: {
    backgroundColor: '#2d5a27', paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 8,
  },
  gradeText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  metaRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: 16, marginBottom: 8,
  },
  typeLabel: { fontSize: 15, color: '#666' },
  section: {
    backgroundColor: '#fff', marginHorizontal: 16, marginTop: 12,
    borderRadius: 12, padding: 16,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#333', marginBottom: 8 },
  description: { fontSize: 15, lineHeight: 22, color: '#444' },
  coords: { fontSize: 14, color: '#2d5a27', fontFamily: 'monospace' },
  info: { fontSize: 14, color: '#666', marginBottom: 4 },
  editButton: {
    marginHorizontal: 16, marginTop: 24, paddingVertical: 14,
    backgroundColor: '#2d5a27', borderRadius: 12, alignItems: 'center',
  },
  editButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  deleteButton: {
    marginHorizontal: 16, marginTop: 12, paddingVertical: 14,
    backgroundColor: '#e74c3c', borderRadius: 12, alignItems: 'center',
  },
  deleteButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
