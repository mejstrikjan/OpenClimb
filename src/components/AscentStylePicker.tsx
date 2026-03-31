import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { AscentStyle } from '../types';
import { colors } from '../theme/colors';

interface Props {
  value: AscentStyle;
  onChange: (style: AscentStyle) => void;
}

const STYLES: { value: AscentStyle; label: string; icon: string }[] = [
  { value: 'onsight', label: 'On-sight', icon: '👁️' },
  { value: 'flash', label: 'Flash', icon: '⚡' },
  { value: 'redpoint', label: 'Redpoint', icon: '🔴' },
  { value: 'project', label: 'Projekt', icon: '🎯' },
];

export function AscentStylePicker({ value, onChange }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Styl přelezu</Text>
      <View style={styles.row}>
        {STYLES.map((s) => (
          <TouchableOpacity
            key={s.value}
            style={[styles.chip, value === s.value && styles.chipActive]}
            onPress={() => onChange(s.value)}
          >
            <Text style={styles.icon}>{s.icon}</Text>
            <Text style={[styles.chipText, value === s.value && styles.chipTextActive]}>
              {s.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 12 },
  label: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 6 },
  row: { flexDirection: 'row', gap: 6 },
  chip: {
    flex: 1, paddingVertical: 10, borderRadius: 10,
    borderWidth: 1, borderColor: colors.border, alignItems: 'center',
    backgroundColor: colors.surface,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  icon: { fontSize: 18, marginBottom: 2 },
  chipText: { fontSize: 11, color: colors.textMuted },
  chipTextActive: { color: colors.textOnDark, fontWeight: '600' },
});
