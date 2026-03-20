import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getAllRoutes } from '../database/routeRepository';

export function ProfileScreen() {
  const [stats, setStats] = useState({ total: 0, synced: 0, unsynced: 0 });

  useFocusEffect(
    useCallback(() => {
      getAllRoutes().then((routes) => {
        setStats({
          total: routes.length,
          synced: routes.filter((r) => r.synced).length,
          unsynced: routes.filter((r) => !r.synced).length,
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

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.total}</Text>
          <Text style={styles.statLabel}>Cest celkem</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: '#2d5a27' }]}>{stats.synced}</Text>
          <Text style={styles.statLabel}>Synchro</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: '#e67e22' }]}>{stats.unsynced}</Text>
          <Text style={styles.statLabel}>Nesynchro</Text>
        </View>
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>Budoucí funkce</Text>
        <Text style={styles.infoItem}>• Registrace a přihlášení</Text>
        <Text style={styles.infoItem}>• Synchronizace s cloudem přes WiFi</Text>
        <Text style={styles.infoItem}>• OCR rozpoznávání štítků na stěnách</Text>
        <Text style={styles.infoItem}>• Statistiky lezení</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f0f0', padding: 16 },
  avatarContainer: { alignItems: 'center', marginTop: 20, marginBottom: 24 },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#e8f5e9', justifyContent: 'center',
    alignItems: 'center', marginBottom: 12,
  },
  avatarText: { fontSize: 36 },
  username: { fontSize: 20, fontWeight: '700', color: '#222' },
  subtitle: { fontSize: 13, color: '#999', marginTop: 4, textAlign: 'center' },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  statCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: 12,
    padding: 16, alignItems: 'center', elevation: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1, shadowRadius: 2,
  },
  statNumber: { fontSize: 24, fontWeight: '800', color: '#333' },
  statLabel: { fontSize: 12, color: '#888', marginTop: 4 },
  infoSection: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16,
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1, shadowRadius: 2,
  },
  infoTitle: { fontSize: 16, fontWeight: '700', color: '#333', marginBottom: 10 },
  infoItem: { fontSize: 14, color: '#666', marginBottom: 6 },
});
