import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ascent, ClimbingRoute } from '../types';
import { getAllAscents } from '../database/ascentRepository';
import { getRouteById } from '../database/routeRepository';
import { AscentCard } from '../components/AscentCard';
import type { RootStackParamList } from '../navigation/AppNavigator';

interface AscentWithRoute extends Ascent {
  routeName: string;
  routeGrade: string;
}

export function LogbookScreen() {
  const [ascents, setAscents] = useState<AscentWithRoute[]>([]);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  useFocusEffect(
    useCallback(() => {
      loadAscents();
    }, [])
  );

  const loadAscents = async () => {
    const all = await getAllAscents();
    const routeCache: Record<string, ClimbingRoute | null> = {};
    const enriched: AscentWithRoute[] = [];
    for (const a of all) {
      if (!routeCache[a.route_id]) {
        routeCache[a.route_id] = await getRouteById(a.route_id);
      }
      const r = routeCache[a.route_id];
      enriched.push({
        ...a,
        routeName: r?.name ?? 'Smazaná cesta',
        routeGrade: r?.grade ?? '',
      });
    }
    setAscents(enriched);
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={ascents}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <AscentCard
            ascent={item}
            routeName={item.routeName}
            routeGrade={item.routeGrade}
            onPress={() => navigation.navigate('RouteDetail', { routeId: item.route_id })}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📖</Text>
            <Text style={styles.emptyText}>Deník je prázdný</Text>
            <Text style={styles.emptySubtext}>Zaznamenejte svůj první výstup z detailu cesty</Text>
          </View>
        }
        contentContainerStyle={ascents.length === 0 ? styles.emptyList : styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f0f0' },
  list: { paddingVertical: 8 },
  emptyList: { flexGrow: 1 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 100 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 18, fontWeight: '600', color: '#999' },
  emptySubtext: { fontSize: 14, color: '#bbb', marginTop: 4, textAlign: 'center', paddingHorizontal: 40 },
});
