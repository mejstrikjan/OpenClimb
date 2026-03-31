import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, SectionList, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ClimbingRoute, FilterState, SortState } from '../types';
import { getFilteredRoutes } from '../database/routeRepository';
import { getAllAreas } from '../database/areaRepository';
import { RouteCard } from '../components/RouteCard';
import { FilterSortBar } from '../components/FilterSortBar';
import type { RootStackParamList } from '../navigation/AppNavigator';

const DEFAULT_FILTER: FilterState = {
  types: [],
  gradeMin: '',
  gradeMax: '',
  gradeSystem: 'French',
  minRating: 0,
};

const DEFAULT_SORT: SortState = {
  field: 'updated_at',
  direction: 'desc',
};

type RouteSection = {
  title: string;
  areaId: string | null;
  totalCount: number;
  data: ClimbingRoute[];
};

export function HomeScreen() {
  const [routes, setRoutes] = useState<ClimbingRoute[]>([]);
  const [areaNames, setAreaNames] = useState<Record<string, string>>({});
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterState>(DEFAULT_FILTER);
  const [sort, setSort] = useState<SortState>(DEFAULT_SORT);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const loadRoutes = useCallback(async () => {
    const [data, areas] = await Promise.all([getFilteredRoutes(search, filter, sort), getAllAreas()]);
    setAreaNames(
      Object.fromEntries(areas.map((area) => [area.id, area.name]))
    );
    setRoutes(data);
    setExpandedSections((current) => {
      const next = { ...current };
      const seen = new Set<string>();
      data.forEach((route) => {
        const sectionKey = route.area_id ?? 'unassigned';
        if (!seen.has(sectionKey)) {
          seen.add(sectionKey);
          if (next[sectionKey] === undefined) {
            next[sectionKey] = true;
          }
        }
      });
      return next;
    });
  }, [search, filter, sort]);

  const toggleSection = useCallback((sectionKey: string) => {
    setExpandedSections((current) => ({ ...current, [sectionKey]: !(current[sectionKey] ?? true) }));
  }, []);

  const sectionSource = useMemo(
    () => buildSections(routes, areaNames, expandedSections),
    [routes, areaNames, expandedSections]
  );

  useFocusEffect(
    useCallback(() => {
      loadRoutes();
    }, [loadRoutes])
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Hledat cesty..."
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={loadRoutes}
          returnKeyType="search"
        />
      </View>
      <FilterSortBar
        filter={filter}
        sort={sort}
        onFilterChange={(f) => setFilter(f)}
        onSortChange={(s) => setSort(s)}
      />
      <SectionList
        sections={sectionSource}
        keyExtractor={(item) => item.id}
        renderSectionHeader={({ section }) => {
          const sectionKey = section.areaId ?? 'unassigned';
          const expanded = expandedSections[sectionKey] ?? true;
          return (
            <TouchableOpacity style={styles.sectionHeader} onPress={() => toggleSection(sectionKey)}>
              <View>
                <Text style={styles.sectionTitle}>
                  {expanded ? '▾' : '▸'} {section.title}
                </Text>
                <Text style={styles.sectionMeta}>{section.totalCount} cest</Text>
              </View>
            </TouchableOpacity>
          );
        }}
        renderItem={({ item }) => (
          <RouteCard
            route={item}
            onPress={() => navigation.navigate('RouteDetail', { routeId: item.id })}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🧗</Text>
            <Text style={styles.emptyText}>Žádné cesty</Text>
            <Text style={styles.emptySubtext}>Přidejte cestu tlačítkem + nebo změňte filtr</Text>
          </View>
        }
        stickySectionHeadersEnabled={false}
        contentContainerStyle={routes.length === 0 ? styles.emptyList : styles.list}
      />
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddRoute')}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f0f0' },
  searchContainer: { padding: 16, paddingBottom: 8 },
  searchInput: {
    backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 16,
    paddingVertical: 12, fontSize: 16, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1,
    shadowRadius: 2, elevation: 2,
  },
  list: { paddingBottom: 80 },
  sectionHeader: {
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 2,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#dfe8d8',
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#20301c',
  },
  sectionMeta: {
    fontSize: 12,
    color: '#5f7057',
    marginTop: 2,
  },
  emptyList: { flexGrow: 1 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 100 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 18, fontWeight: '600', color: '#999' },
  emptySubtext: { fontSize: 14, color: '#bbb', marginTop: 4 },
  fab: {
    position: 'absolute', bottom: 24, right: 24,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#2d5a27', justifyContent: 'center',
    alignItems: 'center', elevation: 6,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3, shadowRadius: 4,
  },
  fabText: { color: '#fff', fontSize: 28, fontWeight: '300', marginTop: -2 },
});

function buildSections(
  routes: ClimbingRoute[],
  areaNames: Record<string, string>,
  expandedSections: Record<string, boolean>
): RouteSection[] {
  const sections = new Map<string, RouteSection>();

  routes.forEach((route) => {
    const sectionKey = route.area_id ?? 'unassigned';
    const title =
      route.area_id
        ? areaNames[route.area_id] ?? 'Neznámá oblast'
        : 'Bez oblasti';

    if (!sections.has(sectionKey)) {
      sections.set(sectionKey, {
        title,
        areaId: route.area_id,
        totalCount: 0,
        data: [],
      });
    }

    const section = sections.get(sectionKey)!;
    section.totalCount += 1;

    if (expandedSections[sectionKey] ?? true) {
      section.data.push(route);
    }
  });

  return Array.from(sections.values());
}
