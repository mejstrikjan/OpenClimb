import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { ClimbingRoute, ROCK_TYPE_OPTIONS } from '../types';
import { StarRating } from './StarRating';
import { colors } from '../theme/colors';

interface Props {
  route: ClimbingRoute;
  onPress: () => void;
}

const TYPE_ICONS: Record<string, string> = {
  sport: '🧗',
  boulder: '🪨',
  trad: '⛰️',
  indoor: '🏢',
};

const TYPE_ACCENTS: Record<string, string> = {
  sport: colors.primary,
  boulder: '#6A5B4D',
  trad: '#7A6242',
  indoor: '#4E6A8A',
};

export function RouteCard({ route, onPress }: Props) {
  const rockTypeLabel = ROCK_TYPE_OPTIONS.find((item) => item.value === route.rock_type)?.label;
  const contextualMeta =
    route.type === 'indoor'
      ? route.indoor_color
        ? `Barva ${route.indoor_color}`
        : null
      : route.rock_type
        ? rockTypeLabel ?? null
        : null;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      {route.photo_uri && (
        <Image source={{ uri: route.photo_uri }} style={styles.photo} />
      )}
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.name} numberOfLines={1}>{route.name}</Text>
          <View style={styles.gradeBadge}>
            <Text style={styles.gradeText}>{route.grade || '?'}</Text>
          </View>
        </View>
        <View style={styles.meta}>
          <Text style={styles.type}>{TYPE_ICONS[route.type] || ''} {route.type}</Text>
          <StarRating rating={route.rating} size={16} readonly />
        </View>
        {contextualMeta ? (
          <View style={[styles.contextBadge, { backgroundColor: TYPE_ACCENTS[route.type] ?? colors.primary }]}>
            <Text style={styles.contextBadgeText}>{contextualMeta}</Text>
          </View>
        ) : null}
        {route.description ? (
          <Text style={styles.description} numberOfLines={2}>{route.description}</Text>
        ) : null}
        {!route.synced && <Text style={styles.unsyncedBadge}>Nesynchro</Text>}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface, borderRadius: 12,
    marginHorizontal: 16, marginVertical: 6,
    shadowColor: colors.cardShadow, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  photo: { width: '100%', height: 140 },
  content: { padding: 12 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  name: { fontSize: 17, fontWeight: '700', color: colors.text, flex: 1, marginRight: 8 },
  gradeBadge: {
    backgroundColor: colors.primary, paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 6,
  },
  gradeText: { color: colors.textOnDark, fontWeight: '700', fontSize: 13 },
  meta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  type: { fontSize: 13, color: colors.textMuted, textTransform: 'capitalize' },
  contextBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    marginTop: 2,
  },
  contextBadgeText: { color: colors.textOnDark, fontWeight: '700', fontSize: 11 },
  description: { fontSize: 13, color: colors.textMuted, marginTop: 4 },
  unsyncedBadge: {
    marginTop: 6, alignSelf: 'flex-start', fontSize: 11,
    color: colors.warning, fontWeight: '600',
  },
});
