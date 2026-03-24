import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ascent } from '../types';

interface Props {
  ascent: Ascent;
  routeName?: string;
  routeGrade?: string;
  onPress?: () => void;
  onDelete?: () => void;
}

const STYLE_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  onsight: { label: 'On-sight', icon: '👁️', color: '#8e44ad' },
  flash: { label: 'Flash', icon: '⚡', color: '#f39c12' },
  redpoint: { label: 'Redpoint', icon: '🔴', color: '#e74c3c' },
  project: { label: 'Projekt', icon: '🎯', color: '#3498db' },
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
        <Text style={styles.success}>
          {ascent.success ? '✅ Slezeno' : '🔄 Pokus'}
        </Text>
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
    backgroundColor: '#fff', borderRadius: 10,
    marginHorizontal: 16, marginVertical: 4,
    padding: 12, elevation: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1, shadowRadius: 2,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  left: { flex: 1, marginRight: 8 },
  date: { fontSize: 13, color: '#888' },
  routeName: { fontSize: 15, fontWeight: '600', color: '#222', marginTop: 2 },
  badge: {
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6,
  },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  footer: { marginTop: 2 },
  success: { fontSize: 13, color: '#555' },
  notes: { fontSize: 13, color: '#888', marginTop: 4, fontStyle: 'italic' },
  deleteBtn: { position: 'absolute', top: 8, right: 8 },
  deleteBtnText: { fontSize: 11, color: '#e74c3c' },
});
