import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView } from 'react-native';
import {
  DEFAULT_GRADE_SYSTEM_BY_TYPE,
  FilterState,
  SortState,
  SortField,
  SortDirection,
  RouteType,
  GradeSystem,
  getGradesForSystem,
} from '../types';
import { StarRating } from './StarRating';
import { colors } from '../theme/colors';

interface Props {
  filter: FilterState;
  sort: SortState;
  onFilterChange: (filter: FilterState) => void;
  onSortChange: (sort: SortState) => void;
}

const ROUTE_TYPES: { value: RouteType; label: string }[] = [
  { value: 'sport', label: 'Sport' },
  { value: 'boulder', label: 'Boulder' },
  { value: 'trad', label: 'Trad' },
  { value: 'indoor', label: 'Indoor' },
];

const SORT_OPTIONS: { field: SortField; label: string }[] = [
  { field: 'updated_at', label: 'Datum' },
  { field: 'name', label: 'Název' },
  { field: 'grade', label: 'Obtížnost' },
  { field: 'rating', label: 'Hodnocení' },
];

export function FilterSortBar({ filter, sort, onFilterChange, onSortChange }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [gradeModal, setGradeModal] = useState<'min' | 'max' | null>(null);

  const activeCount =
    filter.types.length +
    (filter.minRating > 0 ? 1 : 0) +
    (filter.gradeMin ? 1 : 0) +
    (filter.gradeMax ? 1 : 0);

  const toggleType = (t: RouteType) => {
    const types = filter.types.includes(t)
      ? filter.types.filter((x) => x !== t)
      : [...filter.types, t];

    if (types.length === 1) {
      const nextSystem = DEFAULT_GRADE_SYSTEM_BY_TYPE[types[0]];
      onFilterChange({ ...filter, types, gradeSystem: nextSystem, gradeMin: '', gradeMax: '' });
      return;
    }

    onFilterChange({ ...filter, types });
  };

  const grades = getGradesForSystem(filter.gradeSystem);

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <TouchableOpacity
          style={[styles.filterToggle, expanded && styles.filterToggleActive]}
          onPress={() => setExpanded(!expanded)}
        >
          <Text style={[styles.filterToggleText, expanded && styles.filterToggleTextActive]}>
            Filtr {activeCount > 0 ? `(${activeCount})` : ''}
          </Text>
        </TouchableOpacity>

        <View style={styles.sortRow}>
          {SORT_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.field}
              style={[styles.sortChip, sort.field === opt.field && styles.sortChipActive]}
              onPress={() => {
                if (sort.field === opt.field) {
                  onSortChange({ field: opt.field, direction: sort.direction === 'asc' ? 'desc' : 'asc' });
                } else {
                  onSortChange({ field: opt.field, direction: opt.field === 'rating' ? 'desc' : 'asc' });
                }
              }}
            >
              <Text style={[styles.sortText, sort.field === opt.field && styles.sortTextActive]}>
                {opt.label} {sort.field === opt.field ? (sort.direction === 'asc' ? '↑' : '↓') : ''}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {expanded && (
        <View style={styles.filterPanel}>
          <Text style={styles.filterLabel}>Typ</Text>
          <View style={styles.typeRow}>
            {ROUTE_TYPES.map((t) => (
              <TouchableOpacity
                key={t.value}
                style={[styles.typeChip, filter.types.includes(t.value) && styles.typeChipActive]}
                onPress={() => toggleType(t.value)}
              >
                <Text style={[styles.typeText, filter.types.includes(t.value) && styles.typeTextActive]}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.filterLabel}>Min. hodnocení</Text>
          <StarRating
            rating={filter.minRating}
            onRate={(r) => onFilterChange({ ...filter, minRating: r === filter.minRating ? 0 : r })}
            size={24}
          />

          <Text style={[styles.filterLabel, { marginTop: 10 }]}>Obtížnost ({filter.gradeSystem})</Text>
          <View style={styles.gradeRow}>
            <TouchableOpacity style={styles.gradeBtn} onPress={() => setGradeModal('min')}>
              <Text style={styles.gradeBtnText}>{filter.gradeMin || 'Od...'}</Text>
            </TouchableOpacity>
            <Text style={styles.gradeSep}>—</Text>
            <TouchableOpacity style={styles.gradeBtn} onPress={() => setGradeModal('max')}>
              <Text style={styles.gradeBtnText}>{filter.gradeMax || 'Do...'}</Text>
            </TouchableOpacity>
            {(filter.gradeMin || filter.gradeMax) && (
              <TouchableOpacity onPress={() => onFilterChange({ ...filter, gradeMin: '', gradeMax: '' })}>
                <Text style={styles.clearGrade}>Vymazat</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.systemRow}>
            {(['French', 'UIAA', 'V-scale'] as GradeSystem[]).map((s) => (
              <TouchableOpacity
                key={s}
                style={[styles.sysChip, filter.gradeSystem === s && styles.sysChipActive]}
                onPress={() => onFilterChange({ ...filter, gradeSystem: s, gradeMin: '', gradeMax: '' })}
              >
                <Text style={[styles.sysText, filter.gradeSystem === s && styles.sysTextActive]}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {filter.types.length === 1 ? (
            <Text style={styles.systemHint}>
              Výchozí systém se podle typu nastavil na {DEFAULT_GRADE_SYSTEM_BY_TYPE[filter.types[0]]}.
            </Text>
          ) : null}
        </View>
      )}

      <Modal visible={gradeModal !== null} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {gradeModal === 'min' ? 'Minimální obtížnost' : 'Maximální obtížnost'}
            </Text>
            <ScrollView style={styles.gradeList}>
              {grades.map((g) => (
                <TouchableOpacity
                  key={g}
                  style={styles.gradeItem}
                  onPress={() => {
                    if (gradeModal === 'min') onFilterChange({ ...filter, gradeMin: g });
                    else onFilterChange({ ...filter, gradeMax: g });
                    setGradeModal(null);
                  }}
                >
                  <Text style={styles.gradeItemText}>{g}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setGradeModal(null)}>
              <Text style={styles.closeBtnText}>Zavřít</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, marginBottom: 4 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  filterToggle: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8,
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface,
  },
  filterToggleActive: { backgroundColor: colors.surfaceDark, borderColor: colors.surfaceDark },
  filterToggleText: { fontSize: 13, color: colors.textMuted },
  filterToggleTextActive: { color: colors.textOnDark, fontWeight: '600' },
  sortRow: { flexDirection: 'row', flex: 1, gap: 4 },
  sortChip: {
    paddingHorizontal: 8, paddingVertical: 6, borderRadius: 6,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
  },
  sortChipActive: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  sortText: { fontSize: 11, color: colors.textMuted },
  sortTextActive: { color: colors.primaryDark, fontWeight: '600' },
  filterPanel: {
    backgroundColor: colors.surface, borderRadius: 10, padding: 12, marginTop: 8,
    elevation: 2, shadowColor: colors.cardShadow, shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1, shadowRadius: 2,
  },
  filterLabel: { fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 6 },
  typeRow: { flexDirection: 'row', gap: 6, marginBottom: 10 },
  typeChip: {
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6,
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceMuted,
  },
  typeChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  typeText: { fontSize: 12, color: colors.textMuted },
  typeTextActive: { color: colors.textOnDark, fontWeight: '600' },
  gradeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  gradeBtn: {
    flex: 1, padding: 8, borderRadius: 6, borderWidth: 1,
    borderColor: colors.border, alignItems: 'center', backgroundColor: colors.surfaceMuted,
  },
  gradeBtnText: { fontSize: 14, color: colors.text },
  gradeSep: { color: colors.textMuted },
  clearGrade: { fontSize: 12, color: colors.danger, fontWeight: '600' },
  systemRow: { flexDirection: 'row', gap: 6, marginTop: 4 },
  sysChip: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6,
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceMuted,
  },
  sysChipActive: { backgroundColor: colors.surfaceDark, borderColor: colors.surfaceDark },
  sysText: { fontSize: 11, color: colors.textMuted },
  sysTextActive: { color: colors.textOnDark },
  systemHint: { marginTop: 6, fontSize: 11, color: colors.textMuted },
  modalOverlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: colors.surface, borderTopLeftRadius: 16, borderTopRightRadius: 16,
    padding: 20, maxHeight: '50%',
  },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12, textAlign: 'center', color: colors.text },
  gradeList: { marginBottom: 12 },
  gradeItem: { paddingVertical: 10, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  gradeItemText: { fontSize: 16, color: colors.text },
  closeBtn: {
    paddingVertical: 12, backgroundColor: colors.surfaceMuted, borderRadius: 8, alignItems: 'center',
  },
  closeBtnText: { fontSize: 16, fontWeight: '600', color: colors.textMuted },
});
