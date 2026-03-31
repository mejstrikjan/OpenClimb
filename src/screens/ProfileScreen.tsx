import React, { useState, useCallback } from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getAllRoutes } from '../database/routeRepository';
import { getAllAscents } from '../database/ascentRepository';
import {
  getActiveSessionSummary,
  getLatestSessionSummary,
  getSessionAnalytics,
  getSessionCount,
  SessionAnalytics,
} from '../database/sessionRepository';
import { colors } from '../theme/colors';

export function ProfileScreen() {
  const [routeStats, setRouteStats] = useState({ total: 0, synced: 0, unsynced: 0 });
  const [ascentStats, setAscentStats] = useState({ total: 0, onsights: 0, flashes: 0, redpoints: 0, projects: 0, successRate: 0 });
  const [sessionStats, setSessionStats] = useState({ total: 0, activeCount: 0, latestCount: 0 });
  const [featuredSession, setFeaturedSession] = useState<SessionAnalytics | null>(null);

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
      Promise.all([getSessionCount(), getActiveSessionSummary(), getLatestSessionSummary()]).then(
        ([total, active, latest]) => {
          setSessionStats({
            total,
            activeCount: active?.ascentCount ?? 0,
            latestCount: latest?.ascentCount ?? 0,
          });
        }
      );
      Promise.all([getActiveSessionSummary(), getLatestSessionSummary()]).then(async ([active, latest]) => {
        const targetSessionId = active?.id ?? latest?.id ?? null;
        if (!targetSessionId) {
          setFeaturedSession(null);
          return;
        }
        setFeaturedSession(await getSessionAnalytics(targetSessionId));
      });
    }, [])
  );

  const featuredSessionMaxStyleCount = featuredSession
    ? Math.max(...Object.values(featuredSession.styleCounts), 1)
    : 1;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
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
          <Text style={[styles.statNumber, { color: colors.primaryDark }]}>{routeStats.synced}</Text>
          <Text style={styles.statLabel}>Synchro</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: colors.accent }]}>{routeStats.unsynced}</Text>
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
          <Text style={[styles.statNumber, { color: colors.primaryDark }]}>{ascentStats.successRate}%</Text>
          <Text style={styles.statLabel}>Úspěšnost</Text>
        </View>
      </View>

      <Text style={styles.sectionLabel}>Session</Text>
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{sessionStats.total}</Text>
          <Text style={styles.statLabel}>Session celkem</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: colors.primaryDark }]}>{sessionStats.activeCount}</Text>
          <Text style={styles.statLabel}>V aktivní</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: colors.accent }]}>{sessionStats.latestCount}</Text>
          <Text style={styles.statLabel}>V poslední</Text>
        </View>
      </View>

      {featuredSession ? (
        <View style={styles.sessionHighlight}>
          <Text style={styles.sessionHighlightTitle}>
            {featuredSession.session.active ? 'Aktivní session' : 'Poslední session'}
          </Text>
          <Text style={styles.sessionHighlightName}>{featuredSession.session.name}</Text>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{featuredSession.session.ascentCount}</Text>
              <Text style={styles.statLabel}>Výstupů</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statNumber, { color: colors.primaryDark }]}>{featuredSession.successfulAscents}</Text>
              <Text style={styles.statLabel}>Slezeno</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statNumber, { color: colors.accent }]}>{featuredSession.uniqueRoutes}</Text>
              <Text style={styles.statLabel}>Unikátní cesty</Text>
            </View>
          </View>
          <Text style={styles.sessionHighlightMeta}>
            Průměrná obtížnost:{' '}
            {featuredSession.averageGradeLabel && featuredSession.averageGradeSystem
              ? `${featuredSession.averageGradeLabel} (${featuredSession.averageGradeSystem})`
              : 'nedostupná'}
          </Text>
          <View style={styles.sessionChart}>
            {([
              ['onsight', '👁️ On-sight'],
              ['flash', '⚡ Flash'],
              ['redpoint', '🔴 Redpoint'],
              ['project', '🎯 Projekt'],
            ] as const).map(([styleKey, label]) => {
              const value = featuredSession.styleCounts[styleKey];
              const widthPercent = `${Math.max((value / featuredSessionMaxStyleCount) * 100, value > 0 ? 12 : 0)}%` as const;
              return (
                <View key={styleKey} style={styles.chartRow}>
                  <Text style={styles.chartLabel}>{label}</Text>
                  <View style={styles.chartTrack}>
                    <View style={[styles.chartFill, { width: widthPercent }]} />
                  </View>
                  <Text style={styles.chartValue}>{value}</Text>
                </View>
              );
            })}
          </View>
        </View>
      ) : null}

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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 40 },
  avatarContainer: { alignItems: 'center', marginTop: 12, marginBottom: 20 },
  avatar: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: colors.surfaceMuted, justifyContent: 'center',
    alignItems: 'center', marginBottom: 10,
    borderWidth: 1, borderColor: colors.border,
  },
  avatarText: { fontSize: 32 },
  username: { fontSize: 20, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: 13, color: colors.textMuted, marginTop: 4, textAlign: 'center' },
  sectionLabel: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 8, marginTop: 8 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statCard: {
    flex: 1, backgroundColor: colors.surface, borderRadius: 12,
    padding: 14, alignItems: 'center', elevation: 2,
    shadowColor: colors.cardShadow, shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1, shadowRadius: 2,
    borderWidth: 1, borderColor: colors.border,
  },
  statNumber: { fontSize: 22, fontWeight: '800', color: colors.text },
  statLabel: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  sessionHighlight: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sessionHighlightTitle: { fontSize: 13, fontWeight: '700', color: colors.textMuted },
  sessionHighlightName: { fontSize: 19, fontWeight: '800', color: colors.text, marginTop: 2, marginBottom: 10 },
  sessionHighlightMeta: { fontSize: 13, color: colors.textMuted, marginTop: -4, marginBottom: 10 },
  sessionChart: { gap: 8 },
  chartRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  chartLabel: { width: 96, fontSize: 12, color: colors.text },
  chartTrack: {
    flex: 1,
    height: 10,
    borderRadius: 999,
    backgroundColor: colors.surfaceMuted,
    overflow: 'hidden',
  },
  chartFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: colors.primary,
  },
  chartValue: { width: 24, textAlign: 'right', fontSize: 12, fontWeight: '700', color: colors.primaryDark },
  styleStats: {
    backgroundColor: colors.surface, borderRadius: 12, padding: 14, elevation: 2,
    shadowColor: colors.cardShadow, shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1, shadowRadius: 2,
    borderWidth: 1, borderColor: colors.border,
  },
  styleRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  styleIcon: { fontSize: 18, width: 30 },
  styleLabel: { flex: 1, fontSize: 15, color: colors.text },
  styleCount: { fontSize: 17, fontWeight: '700', color: colors.text },
});
