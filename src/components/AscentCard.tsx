import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ascent } from '../types';
import { colors } from '../theme/colors';

interface Props {
  ascent: Ascent;
  routeName?: string;
  routeGrade?: string;
  onPress?: () => void;
  onDelete?: () => void;
}

const STYLE_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  onsight: { label: 'On-sight', icon: '👁️', color: '#6E4E94' },
  flash: { label: 'Flash', icon: '⚡', color: colors.accent },
  redpoint: { label: 'Redpoint', icon: '🔴', color: colors.primaryDark },
  project: { label: 'Projekt', icon: '🎯', color: '#4F6E8F' },
};

const CATEGORY_LABELS: Record<string, { label: string; color: string }> = {
  training: { label: 'Trénink', color: colors.surfaceMuted },
  trip: { label: 'Výjezd', color: colors.primarySoft },
  milestone: { label: 'Milník', color: '#F6D9A8' },
  competition: { label: 'Závody', color: '#E6D7C7' },
};

export function AscentCard({ ascent, routeName, routeGrade, onPress, onDelete }: Props) {
  const style = STYLE_LABELS[ascent.style] ?? STYLE_LABELS.redpoint;
  const dateStr = new Date(ascent.date).toLocaleDateString('cs-CZ');

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7} disabled={!onPress}>
      <View style={styles.header}>
        <View style={styles.left}>
          <Text style={styles.date}>{dateStr}</Text>
          {routeName && (
            <Text style={styles.routeName} numberOfLines={1}>
              {routeName} {routeGrade ? `(${routeGrade})` : ''}
            </Text>
          )}
        </View>
        <View style={[styles.badge, { backgroundColor: style.color }]}>
          <Text style={styles.badgeText}>{style.icon} {style.label}</Text>
        </View>
      </View>
      <View style={styles.footer}>
        <View style={styles.metaRow}>
          <Text style={styles.success}>
            {ascent.success ? '✅ Slezeno' : '🔄 Pokus'}
          </Text>
          {ascent.category ? (
            <View style={[styles.categoryBadge, { backgroundColor: CATEGORY_LABELS[ascent.category]?.color ?? colors.surfaceMuted }]}>
              <Text style={styles.categoryBadgeText}>
                {CATEGORY_LABELS[ascent.category]?.label ?? ascent.category}
              </Text>
            </View>
          ) : null}
        </View>
        {ascent.notes ? (
          <Text style={styles.notes} numberOfLines={2}>{ascent.notes}</Text>
        ) : null}
      </View>
      {onDelete && (
        <TouchableOpacity style={styles.deleteBtn} onPress={onDelete}>
          <Text style={styles.deleteBtnText}>Smazat</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface, borderRadius: 10,
    marginHorizontal: 16, marginVertical: 4,
    padding: 12, elevation: 2,
    shadowColor: colors.cardShadow, shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1, shadowRadius: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  left: { flex: 1, marginRight: 8 },
  date: { fontSize: 13, color: colors.textMuted },
  routeName: { fontSize: 15, fontWeight: '600', color: colors.text, marginTop: 2 },
  badge: {
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6,
  },
  badgeText: { color: colors.textOnDark, fontSize: 11, fontWeight: '600' },
  footer: { marginTop: 2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  success: { fontSize: 13, color: colors.textMuted },
  categoryBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  categoryBadgeText: { fontSize: 11, color: colors.text, fontWeight: '700' },
  notes: { fontSize: 13, color: colors.textMuted, marginTop: 4, fontStyle: 'italic' },
  deleteBtn: { position: 'absolute', top: 8, right: 8 },
  deleteBtnText: { fontSize: 11, color: colors.danger },
});
