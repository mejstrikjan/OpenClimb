import React, { useState, useCallback } from 'react';
import { View, Text, Image, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ClimbingRoute, Ascent } from '../types';
import { getRouteById, deleteRoute } from '../database/routeRepository';
import { getAscentsByRoute, deleteAscent } from '../database/ascentRepository';
import { getAreaById } from '../database/areaRepository';
import { getCragById } from '../database/cragRepository';
import { getSectorById } from '../database/sectorRepository';
import { StarRating } from '../components/StarRating';
import { AscentCard } from '../components/AscentCard';
import { MapyWebView } from '../components/MapyWebView';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { colors } from '../theme/colors';

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
  const [ascents, setAscents] = useState<Ascent[]>([]);
  const [locationBreadcrumb, setLocationBreadcrumb] = useState('');
  const [areaPreviewUri, setAreaPreviewUri] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadRoute();
      loadAscents();
    }, [params.routeId])
  );

  const loadRoute = async () => {
    const r = await getRouteById(params.routeId);
    setRoute(r);
    if (r) {
      const parts: string[] = [];
      if (r.area_id) {
        const area = await getAreaById(r.area_id);
        if (area) {
          parts.push(area.name);
          setAreaPreviewUri(area.preview_uri);
        } else {
          setAreaPreviewUri(null);
        }
      } else {
        setAreaPreviewUri(null);
      }
      if (r.crag_id) {
        const crag = await getCragById(r.crag_id);
        if (crag) parts.push(crag.name);
      }
      if (r.sector_id) {
        const sector = await getSectorById(r.sector_id);
        if (sector) parts.push(sector.name);
      }
      setLocationBreadcrumb(parts.join(' > '));
    }
  };

  const loadAscents = async () => {
    const a = await getAscentsByRoute(params.routeId);
    setAscents(a);
  };

  const handleDelete = () => {
    Alert.alert('Smazat cestu', 'Opravdu chcete smazat tuto cestu? Smažou se i všechny záznamy v deníku.', [
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

  const handleDeleteAscent = (ascentId: string) => {
    Alert.alert('Smazat záznam', 'Opravdu chcete smazat tento záznam?', [
      { text: 'Zrušit', style: 'cancel' },
      {
        text: 'Smazat', style: 'destructive',
        onPress: async () => {
          await deleteAscent(ascentId);
          loadAscents();
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

      {locationBreadcrumb ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Místo</Text>
          <Text style={styles.breadcrumb}>📍 {locationBreadcrumb}</Text>
        </View>
      ) : null}

      {route.description ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Popis</Text>
          <Text style={styles.description}>{route.description}</Text>
        </View>
      ) : null}

      {route.latitude !== null && route.longitude !== null && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>GPS</Text>
          <Text style={styles.coords}>
            {route.latitude.toFixed(6)}, {route.longitude.toFixed(6)}
          </Text>
          <View style={styles.routeMapWrap}>
            <MapyWebView
              mode="browse"
              height={220}
              centerLatitude={route.latitude}
              centerLongitude={route.longitude}
              zoom={13}
              markers={[
                {
                  id: route.id,
                  title: route.name,
                  latitude: route.latitude,
                  longitude: route.longitude,
                  subtitle: TYPE_LABELS[route.type] || route.type,
                  previewUri: route.photo_uri ?? areaPreviewUri,
                  emoji:
                    route.type === 'boulder'
                      ? '🪨'
                      : route.type === 'trad'
                        ? '⛰️'
                        : route.type === 'indoor'
                          ? '🏢'
                          : '🧗',
                },
              ]}
              emptyStateTitle="Chybí Mapy.com API klíč"
              emptyStateText="Mapový náhled cesty vyžaduje nakonfigurovaný Mapy.com klíč."
            />
          </View>
        </View>
      )}

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Deník výstupů ({ascents.length})</Text>
          <TouchableOpacity
            style={styles.addAscentBtn}
            onPress={() => navigation.navigate('AddAscent', { routeId: route.id })}
          >
            <Text style={styles.addAscentBtnText}>+ Zaznamenat</Text>
          </TouchableOpacity>
        </View>
        {ascents.length === 0 ? (
          <Text style={styles.emptyAscents}>Zatím žádné výstupy</Text>
        ) : (
          ascents.map((a) => (
            <AscentCard
              key={a.id}
              ascent={a}
              onDelete={() => handleDeleteAscent(a.id)}
            />
          ))
        )}
      </View>

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
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: 40 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 16, color: colors.textMuted },
  photo: { width: '100%', height: 250 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', padding: 16, paddingBottom: 8,
  },
  name: { fontSize: 22, fontWeight: '800', color: colors.text, flex: 1, marginRight: 8 },
  gradeBadge: {
    backgroundColor: colors.primary, paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 8,
  },
  gradeText: { color: colors.textOnDark, fontWeight: '700', fontSize: 15 },
  metaRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: 16, marginBottom: 8,
  },
  typeLabel: { fontSize: 15, color: colors.textMuted },
  section: {
    backgroundColor: colors.surface, marginHorizontal: 16, marginTop: 12,
    borderRadius: 12, padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  breadcrumb: { fontSize: 15, color: colors.primaryDark, fontWeight: '500' },
  description: { fontSize: 15, lineHeight: 22, color: colors.text },
  coords: { fontSize: 14, color: colors.primaryDark, fontFamily: 'monospace' },
  routeMapWrap: { marginTop: 12 },
  info: { fontSize: 14, color: colors.textMuted, marginBottom: 4 },
  addAscentBtn: {
    backgroundColor: colors.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6,
  },
  addAscentBtnText: { color: colors.textOnDark, fontSize: 12, fontWeight: '600' },
  emptyAscents: { fontSize: 14, color: colors.textMuted, textAlign: 'center', paddingVertical: 12 },
  editButton: {
    marginHorizontal: 16, marginTop: 24, paddingVertical: 14,
    backgroundColor: colors.primary, borderRadius: 12, alignItems: 'center',
  },
  editButtonText: { color: colors.textOnDark, fontSize: 16, fontWeight: '700' },
  deleteButton: {
    marginHorizontal: 16, marginTop: 12, paddingVertical: 14,
    backgroundColor: colors.danger, borderRadius: 12, alignItems: 'center',
  },
  deleteButtonText: { color: colors.textOnDark, fontSize: 16, fontWeight: '700' },
});
