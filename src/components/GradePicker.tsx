import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { GradeSystem, getGradesForSystem } from '../types';

interface Props {
  system: GradeSystem;
  grade: string;
  onSystemChange: (system: GradeSystem) => void;
  onGradeChange: (grade: string) => void;
}

const SYSTEMS: GradeSystem[] = ['French', 'UIAA', 'V-scale'];

export function GradePicker({ system, grade, onSystemChange, onGradeChange }: Props) {
  const [modalVisible, setModalVisible] = useState(false);
  const grades = getGradesForSystem(system);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Hodnotící systém</Text>
      <View style={styles.systemRow}>
        {SYSTEMS.map((s) => (
          <TouchableOpacity
            key={s}
            style={[styles.systemButton, system === s && styles.systemButtonActive]}
            onPress={() => {
              onSystemChange(s);
              onGradeChange('');
            }}
          >
            <Text style={[styles.systemText, system === s && styles.systemTextActive]}>{s}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Obtížnost</Text>
      <TouchableOpacity style={styles.gradeSelector} onPress={() => setModalVisible(true)}>
        <Text style={styles.gradeSelectorText}>{grade || 'Vyberte obtížnost...'}</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Vyberte obtížnost ({system})</Text>
            <ScrollView style={styles.gradeList}>
              {grades.map((g) => (
                <TouchableOpacity
                  key={g}
                  style={[styles.gradeItem, grade === g && styles.gradeItemActive]}
                  onPress={() => { onGradeChange(g); setModalVisible(false); }}
                >
                  <Text style={[styles.gradeItemText, grade === g && styles.gradeItemTextActive]}>{g}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.closeButtonText}>Zavřít</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 12 },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 6 },
  systemRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  systemButton: {
    flex: 1, paddingVertical: 8, borderRadius: 8,
    borderWidth: 1, borderColor: '#ddd', alignItems: 'center',
  },
  systemButtonActive: { backgroundColor: '#2d5a27', borderColor: '#2d5a27' },
  systemText: { fontSize: 14, color: '#666' },
  systemTextActive: { color: '#fff', fontWeight: '600' },
  gradeSelector: {
    borderWidth: 1, borderColor: '#ddd', borderRadius: 8,
    padding: 12, backgroundColor: '#f9f9f9',
  },
  gradeSelectorText: { fontSize: 16, color: '#333' },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16,
    padding: 20, maxHeight: '60%',
  },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12, textAlign: 'center' },
  gradeList: { marginBottom: 12 },
  gradeItem: {
    paddingVertical: 12, paddingHorizontal: 16,
    borderBottomWidth: 1, borderBottomColor: '#eee',
  },
  gradeItemActive: { backgroundColor: '#e8f5e9' },
  gradeItemText: { fontSize: 16, color: '#333' },
  gradeItemTextActive: { color: '#2d5a27', fontWeight: '600' },
  closeButton: {
    paddingVertical: 14, backgroundColor: '#eee',
    borderRadius: 8, alignItems: 'center',
  },
  closeButtonText: { fontSize: 16, fontWeight: '600', color: '#666' },
});
