import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ClimbingRoute, FilterState, SortState } from '../types';
import { getFilteredRoutes } from '../database/routeRepository';
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

export function HomeScreen() {
  const [routes, setRoutes] = useState<ClimbingRoute[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterState>(DEFAULT_FILTER);
  const [sort, setSort] = useState<SortState>(DEFAULT_SORT);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const loadRoutes = useCallback(async () => {
    const data = await getFilteredRoutes(search, filter, sort);
    setRoutes(data);
  }, [search, filter, sort]);

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
      <FlatList
        data={routes}
        keyExtractor={(item) => item.id}
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
