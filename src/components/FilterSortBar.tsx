import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView } from 'react-native';
import { FilterState, SortState, SortField, SortDirection, RouteType, GradeSystem, getGradesForSystem } from '../types';
import { StarRating } from './StarRating';

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
    borderWidth: 1, borderColor: '#ddd', backgroundColor: '#fff',
  },
  filterToggleActive: { backgroundColor: '#2d5a27', borderColor: '#2d5a27' },
  filterToggleText: { fontSize: 13, color: '#666' },
  filterToggleTextActive: { color: '#fff', fontWeight: '600' },
  sortRow: { flexDirection: 'row', flex: 1, gap: 4 },
  sortChip: {
    paddingHorizontal: 8, paddingVertical: 6, borderRadius: 6,
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#eee',
  },
  sortChipActive: { backgroundColor: '#e8f5e9', borderColor: '#2d5a27' },
  sortText: { fontSize: 11, color: '#888' },
  sortTextActive: { color: '#2d5a27', fontWeight: '600' },
  filterPanel: {
    backgroundColor: '#fff', borderRadius: 10, padding: 12, marginTop: 8,
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1, shadowRadius: 2,
  },
  filterLabel: { fontSize: 13, fontWeight: '600', color: '#333', marginBottom: 6 },
  typeRow: { flexDirection: 'row', gap: 6, marginBottom: 10 },
  typeChip: {
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6,
    borderWidth: 1, borderColor: '#ddd',
  },
  typeChipActive: { backgroundColor: '#2d5a27', borderColor: '#2d5a27' },
  typeText: { fontSize: 12, color: '#666' },
  typeTextActive: { color: '#fff', fontWeight: '600' },
  gradeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  gradeBtn: {
    flex: 1, padding: 8, borderRadius: 6, borderWidth: 1,
    borderColor: '#ddd', alignItems: 'center',
  },
  gradeBtnText: { fontSize: 14, color: '#333' },
  gradeSep: { color: '#999' },
  clearGrade: { fontSize: 12, color: '#e74c3c', fontWeight: '600' },
  systemRow: { flexDirection: 'row', gap: 6, marginTop: 4 },
  sysChip: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6,
    borderWidth: 1, borderColor: '#ddd',
  },
  sysChipActive: { backgroundColor: '#2d5a27', borderColor: '#2d5a27' },
  sysText: { fontSize: 11, color: '#666' },
  sysTextActive: { color: '#fff' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16,
    padding: 20, maxHeight: '50%',
  },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12, textAlign: 'center' },
  gradeList: { marginBottom: 12 },
  gradeItem: { paddingVertical: 10, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#eee' },
  gradeItemText: { fontSize: 16, color: '#333' },
  closeBtn: {
    paddingVertical: 12, backgroundColor: '#eee', borderRadius: 8, alignItems: 'center',
  },
  closeBtnText: { fontSize: 16, fontWeight: '600', color: '#666' },
});
