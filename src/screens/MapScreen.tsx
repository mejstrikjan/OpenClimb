import React, { useState, useCallback, useMemo } from 'react';
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Area, ClimbingRoute, RouteType } from '../types';
import { getAllRoutes } from '../database/routeRepository';
import { getAllAreas } from '../database/areaRepository';
import { AreaChip } from '../components/AreaChip';
import { MapyWebView } from '../components/MapyWebView';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { hasMapyApiKey } from '../config/mapy';

type Region = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

const DEFAULT_REGION: Region = {
  latitude: 49.8175,
  longitude: 15.473,
  latitudeDelta: 2.7,
  longitudeDelta: 2.7,
};

const TYPE_FILTERS: Array<{ type: RouteType; label: string; emoji: string }> = [
  { type: 'sport', label: 'Sport', emoji: '🧗' },
  { type: 'boulder', label: 'Boulder', emoji: '🪨' },
  { type: 'trad', label: 'Trad', emoji: '⛰️' },
  { type: 'indoor', label: 'Indoor', emoji: '🏢' },
];

export function MapScreen() {
  const [routes, setRoutes] = useState<ClimbingRoute[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<RouteType[]>([]);
  const [onlyWithPreview, setOnlyWithPreview] = useState(false);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  useFocusEffect(
    useCallback(() => {
      Promise.all([getAllRoutes(), getAllAreas()]).then(([loadedRoutes, loadedAreas]) => {
        setRoutes(loadedRoutes);
        setAreas(loadedAreas);
      });
    }, [])
  );

  const routesByAreaId = useMemo(() => {
    const countMap = new Map<string, number>();
    routes.forEach((route) => {
      if (route.area_id) {
        countMap.set(route.area_id, (countMap.get(route.area_id) ?? 0) + 1);
      }
    });
    return countMap;
  }, [routes]);

  const filteredRouteCountsByAreaId = useMemo(() => {
    const countMap = new Map<string, number>();
    routes.forEach((route) => {
      if (!route.area_id) {
        return;
      }
      if (selectedTypes.length > 0 && !selectedTypes.includes(route.type)) {
        return;
      }
      countMap.set(route.area_id, (countMap.get(route.area_id) ?? 0) + 1);
    });
    return countMap;
  }, [routes, selectedTypes]);

  const filteredAreas = useMemo(() => {
    return areas.filter((area) => {
      if (onlyWithPreview && !area.preview_uri) {
        return false;
      }
      if (selectedTypes.length === 0) {
        return true;
      }
      return (filteredRouteCountsByAreaId.get(area.id) ?? 0) > 0;
    });
  }, [areas, filteredRouteCountsByAreaId, onlyWithPreview, selectedTypes]);

  const areasWithLocation = useMemo(
    () => filteredAreas.filter((area) => area.latitude !== null && area.longitude !== null),
    [filteredAreas]
  );

  const mapRegion = useMemo<Region>(() => {
    if (areasWithLocation.length === 0) {
      return DEFAULT_REGION;
    }

    return {
      latitude: areasWithLocation[0].latitude ?? DEFAULT_REGION.latitude,
      longitude: areasWithLocation[0].longitude ?? DEFAULT_REGION.longitude,
      latitudeDelta: 1.2,
      longitudeDelta: 1.2,
    };
  }, [areasWithLocation]);

  const areaMarkers = useMemo(
    () =>
      areasWithLocation.map((area) => ({
        id: area.id,
        title: area.name,
        latitude: area.latitude!,
        longitude: area.longitude!,
        subtitle: `${(selectedTypes.length > 0 ? filteredRouteCountsByAreaId : routesByAreaId).get(area.id) ?? 0} cest`,
        previewUri: area.preview_uri,
        emoji: '🪨',
      })),
    [areasWithLocation, filteredRouteCountsByAreaId, routesByAreaId, selectedTypes.length]
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Lezecké oblasti</Text>
          <Text style={styles.subtitle}>
            {filteredAreas.length} zobrazených oblastí, {areasWithLocation.length} z nich má polohu na mapě
          </Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate('AddArea')}>
          <Text style={styles.addButtonText}>+ Oblast</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Ikony oblastí</Text>
          <Text style={styles.sectionMeta}>Filtry + editace</Text>
        </View>
        <View style={styles.filterRow}>
          {TYPE_FILTERS.map(({ type, label, emoji }) => {
            const active = selectedTypes.includes(type);
            return (
              <TouchableOpacity
                key={type}
                style={[styles.filterChip, active && styles.filterChipActive]}
                onPress={() =>
                  setSelectedTypes((current) =>
                    current.includes(type) ? current.filter((item) => item !== type) : [...current, type]
                  )
                }
              >
                <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                  {emoji} {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <TouchableOpacity
          style={[styles.toggleRow, onlyWithPreview && styles.toggleRowActive]}
          onPress={() => setOnlyWithPreview((current) => !current)}
        >
          <Text style={[styles.toggleText, onlyWithPreview && styles.toggleTextActive]}>
            {onlyWithPreview ? '✓' : '○'} Jen oblasti s ikonou
          </Text>
        </TouchableOpacity>

        <FlatList
          horizontal
          data={filteredAreas}
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={filteredAreas.length === 0 ? styles.emptyAreasList : styles.areaList}
          ListEmptyComponent={
            <View style={styles.emptyCard}>
              <Text style={styles.emptyCardTitle}>Nic neodpovídá filtru</Text>
              <Text style={styles.emptyCardText}>Zkuste změnit typy cest nebo vypnout filtr ikon.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <AreaChip
              area={item}
              routeCount={(selectedTypes.length > 0 ? filteredRouteCountsByAreaId : routesByAreaId).get(item.id) ?? 0}
              onPress={() => navigation.navigate('AddArea', { areaId: item.id })}
            />
          )}
        />
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Mapa oblastí</Text>
          <Text style={styles.sectionMeta}>Mapy.com + clustering</Text>
        </View>
        <MapyWebView
          mode="browse"
          height={300}
          centerLatitude={mapRegion.latitude}
          centerLongitude={mapRegion.longitude}
          zoom={areasWithLocation.length === 0 ? 7 : 10}
          markers={areaMarkers}
          emptyStateTitle="Chybí Mapy.com API klíč"
          emptyStateText="Uložte klíč do .env.local jako EXPO_PUBLIC_MAPY_API_KEY. Klíč nedávejte do repozitáře a v Mapy.com ho omezte na User-Agent a jen na potřebné služby."
          onMarkerPress={(areaId) => navigation.navigate('AddArea', { areaId })}
          onMapError={(message) => Alert.alert('Mapa oblastí', message)}
        />
        {areasWithLocation.length === 0 ? (
          <View style={styles.mapHint}>
            <Text style={styles.mapHintTitle}>Mapa je zatím prázdná</Text>
            <Text style={styles.mapHintText}>
              Otevřete oblast a klepnutím do mapy jí nastavte souřadnice.
            </Text>
          </View>
        ) : null}
        {!hasMapyApiKey() ? (
          <View style={styles.securityHint}>
            <Text style={styles.securityHintTitle}>Doporučené zabezpečení klíče</Text>
            <Text style={styles.securityHintText}>
              V administraci Mapy.com nastavte omezení podle User-Agent a povolte jen službu mapových dlaždic.
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.footerPanel}>
        <Text style={styles.footerTitle}>Rychlý přehled</Text>
        <Text style={styles.footerText}>
          Oblasti s mapou: {areasWithLocation.length} / {filteredAreas.length}
        </Text>
        <Text style={styles.footerText}>
          Cesty přiřazené do oblastí: {routes.filter((route) => route.area_id).length} / {routes.length}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#eef1eb', padding: 16 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: { fontSize: 24, fontWeight: '800', color: '#20301c' },
  subtitle: { fontSize: 13, color: '#6d7f66', marginTop: 4 },
  addButton: {
    backgroundColor: '#2d5a27',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 14,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#24331f',
  },
  sectionMeta: {
    fontSize: 12,
    color: '#83917d',
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#edf3e8',
  },
  filterChipActive: {
    backgroundColor: '#2d5a27',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#486043',
  },
  filterChipTextActive: {
    color: '#fff',
  },
  toggleRow: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#fff6df',
    marginBottom: 12,
  },
  toggleRowActive: {
    backgroundColor: '#ffe7a8',
  },
  toggleText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#78631d',
  },
  toggleTextActive: {
    color: '#5c490e',
  },
  areaList: {
    paddingRight: 4,
  },
  emptyAreasList: {
    flexGrow: 1,
  },
  emptyCard: {
    borderRadius: 14,
    padding: 18,
    backgroundColor: '#f4f7f2',
  },
  emptyCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#24331f',
    marginBottom: 4,
  },
  emptyCardText: {
    fontSize: 13,
    color: '#788775',
  },
  mapHint: {
    marginTop: 10,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#f4f7f2',
  },
  mapHintTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#24331f',
    marginBottom: 2,
  },
  mapHintText: {
    fontSize: 13,
    color: '#788775',
  },
  securityHint: {
    marginTop: 10,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#fff7df',
  },
  securityHintTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#5d4a0a',
    marginBottom: 2,
  },
  securityHintText: {
    fontSize: 13,
    color: '#7a651f',
  },
  footerPanel: {
    backgroundColor: '#dfe8d8',
    borderRadius: 18,
    padding: 16,
  },
  footerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#20301c',
    marginBottom: 6,
  },
  footerText: {
    fontSize: 13,
    color: '#405039',
    marginBottom: 2,
  },
});
