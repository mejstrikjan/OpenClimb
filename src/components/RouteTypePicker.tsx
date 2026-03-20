import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { RouteType } from '../types';

interface Props {
  value: RouteType;
  onChange: (type: RouteType) => void;
}

const TYPES: { value: RouteType; label: string; icon: string }[] = [
  { value: 'sport', label: 'Sport', icon: '🧗' },
  { value: 'boulder', label: 'Boulder', icon: '🪨' },
  { value: 'trad', label: 'Trad', icon: '⛰️' },
  { value: 'indoor', label: 'Indoor', icon: '🏢' },
];

export function RouteTypePicker({ value, onChange }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Typ cesty</Text>
      <View style={styles.row}>
        {TYPES.map((t) => (
          <TouchableOpacity
            key={t.value}
            style={[styles.chip, value === t.value && styles.chipActive]}
            onPress={() => onChange(t.value)}
          >
            <Text style={styles.icon}>{t.icon}</Text>
            <Text style={[styles.chipText, value === t.value && styles.chipTextActive]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 12 },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 6 },
  row: { flexDirection: 'row', gap: 8 },
  chip: {
    flex: 1, paddingVertical: 10, borderRadius: 10,
    borderWidth: 1, borderColor: '#ddd', alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },
  chipActive: { backgroundColor: '#2d5a27', borderColor: '#2d5a27' },
  icon: { fontSize: 20, marginBottom: 2 },
  chipText: { fontSize: 12, color: '#666' },
  chipTextActive: { color: '#fff', fontWeight: '600' },
});
