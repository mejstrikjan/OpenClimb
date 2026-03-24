import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getAllRoutes } from '../database/routeRepository';
import { getAllAscents } from '../database/ascentRepository';

export function ProfileScreen() {
  const [routeStats, setRouteStats] = useState({ total: 0, synced: 0, unsynced: 0 });
  const [ascentStats, setAscentStats] = useState({ total: 0, onsights: 0, flashes: 0, redpoints: 0, projects: 0, successRate: 0 });

  useFocusEffect(
    useCallback(() => {
      getAllRoutes().then((routes) => {
        setRouteStats({
          total: routes.length,
          synced: routes.filter((r) => r.synced).length,
          unsynced: routes.filter((r) => !r.synced).length,
        });
      });
      getAllAscents().then((ascents) => {
        const succeeded = ascents.filter((a) => a.success).length;
        setAscentStats({
          total: ascents.length,
          onsights: ascents.filter((a) => a.style === 'onsight').length,
          flashes: ascents.filter((a) => a.style === 'flash').length,
          redpoints: ascents.filter((a) => a.style === 'redpoint').length,
          projects: ascents.filter((a) => a.style === 'project').length,
          successRate: ascents.length > 0 ? Math.round((succeeded / ascents.length) * 100) : 0,
        });
      });
    }, [])
  );

  return (
    <View style={styles.container}>
      <View style={styles.avatarContainer}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>🧗</Text>
        </View>
        <Text style={styles.username}>Lokální uživatel</Text>
        <Text style={styles.subtitle}>Registrace bude dostupná po připojení k serveru</Text>
      </View>

      <Text style={styles.sectionLabel}>Cesty</Text>
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{routeStats.total}</Text>
          <Text style={styles.statLabel}>Celkem</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: '#2d5a27' }]}>{routeStats.synced}</Text>
          <Text style={styles.statLabel}>Synchro</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: '#e67e22' }]}>{routeStats.unsynced}</Text>
          <Text style={styles.statLabel}>Nesynchro</Text>
        </View>
      </View>

      <Text style={styles.sectionLabel}>Deník výstupů</Text>
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{ascentStats.total}</Text>
          <Text style={styles.statLabel}>Výstupů</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: '#2d5a27' }]}>{ascentStats.successRate}%</Text>
          <Text style={styles.statLabel}>Úspěšnost</Text>
        </View>
      </View>

      <View style={styles.styleStats}>
        <View style={styles.styleRow}>
          <Text style={styles.styleIcon}>👁️</Text>
          <Text style={styles.styleLabel}>On-sight</Text>
          <Text style={styles.styleCount}>{ascentStats.onsights}</Text>
        </View>
        <View style={styles.styleRow}>
          <Text style={styles.styleIcon}>⚡</Text>
          <Text style={styles.styleLabel}>Flash</Text>
          <Text style={styles.styleCount}>{ascentStats.flashes}</Text>
        </View>
        <View style={styles.styleRow}>
          <Text style={styles.styleIcon}>🔴</Text>
          <Text style={styles.styleLabel}>Redpoint</Text>
          <Text style={styles.styleCount}>{ascentStats.redpoints}</Text>
        </View>
        <View style={styles.styleRow}>
          <Text style={styles.styleIcon}>🎯</Text>
          <Text style={styles.styleLabel}>Projekt</Text>
          <Text style={styles.styleCount}>{ascentStats.projects}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f0f0', padding: 16 },
  avatarContainer: { alignItems: 'center', marginTop: 12, marginBottom: 20 },
  avatar: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#e8f5e9', justifyContent: 'center',
    alignItems: 'center', marginBottom: 10,
  },
  avatarText: { fontSize: 32 },
  username: { fontSize: 20, fontWeight: '700', color: '#222' },
  subtitle: { fontSize: 13, color: '#999', marginTop: 4, textAlign: 'center' },
  sectionLabel: { fontSize: 16, fontWeight: '700', color: '#333', marginBottom: 8, marginTop: 8 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: 12,
    padding: 14, alignItems: 'center', elevation: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1, shadowRadius: 2,
  },
  statNumber: { fontSize: 22, fontWeight: '800', color: '#333' },
  statLabel: { fontSize: 11, color: '#888', marginTop: 2 },
  styleStats: {
    backgroundColor: '#fff', borderRadius: 12, padding: 14, elevation: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1, shadowRadius: 2,
  },
  styleRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
  },
  styleIcon: { fontSize: 18, width: 30 },
  styleLabel: { flex: 1, fontSize: 15, color: '#444' },
  styleCount: { fontSize: 17, fontWeight: '700', color: '#333' },
});
