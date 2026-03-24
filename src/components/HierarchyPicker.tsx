import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, Modal, ScrollView, Alert } from 'react-native';
import { Area, Crag, Sector } from '../types';
import { getAllAreas, insertArea } from '../database/areaRepository';
import { getCragsByArea, getAllCrags, insertCrag } from '../database/cragRepository';
import { getSectorsByCrag, getSectorsByArea, getAllSectors, insertSector } from '../database/sectorRepository';

interface Props {
  areaId: string | null;
  cragId: string | null;
  sectorId: string | null;
  onChange: (areaId: string | null, cragId: string | null, sectorId: string | null) => void;
}

type PickerLevel = 'area' | 'crag' | 'sector';

export function HierarchyPicker({ areaId, cragId, sectorId, onChange }: Props) {
  const [areas, setAreas] = useState<Area[]>([]);
  const [crags, setCrags] = useState<Crag[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [modalLevel, setModalLevel] = useState<PickerLevel | null>(null);
  const [newName, setNewName] = useState('');

  const [selectedArea, setSelectedArea] = useState<Area | null>(null);
  const [selectedCrag, setSelectedCrag] = useState<Crag | null>(null);
  const [selectedSector, setSelectedSector] = useState<Sector | null>(null);

  useEffect(() => { loadAreas(); }, []);

  useEffect(() => {
    if (areaId) {
      getAllAreas().then((a) => setSelectedArea(a.find((x) => x.id === areaId) ?? null));
      getCragsByArea(areaId).then(setCrags);
    }
  }, [areaId]);

  useEffect(() => {
    if (cragId) {
      getAllCrags().then((c) => setSelectedCrag(c.find((x) => x.id === cragId) ?? null));
      getSectorsByCrag(cragId).then(setSectors);
    } else if (areaId) {
      getSectorsByArea(areaId).then(setSectors);
    }
  }, [cragId, areaId]);

  useEffect(() => {
    if (sectorId) {
      getAllSectors().then((s) => setSelectedSector(s.find((x) => x.id === sectorId) ?? null));
    }
  }, [sectorId]);

  const loadAreas = async () => {
    const a = await getAllAreas();
    setAreas(a);
  };

  const openPicker = async (level: PickerLevel) => {
    setNewName('');
    if (level === 'area') {
      await loadAreas();
    } else if (level === 'crag') {
      const c = areaId ? await getCragsByArea(areaId) : await getAllCrags();
      setCrags(c);
    } else {
      const s = cragId ? await getSectorsByCrag(cragId) : areaId ? await getSectorsByArea(areaId) : await getAllSectors();
      setSectors(s);
    }
    setModalLevel(level);
  };

  const selectArea = (area: Area | null) => {
    setSelectedArea(area);
    setSelectedCrag(null);
    setSelectedSector(null);
    onChange(area?.id ?? null, null, null);
    setModalLevel(null);
  };

  const selectCrag = (crag: Crag | null) => {
    setSelectedCrag(crag);
    setSelectedSector(null);
    onChange(areaId, crag?.id ?? null, null);
    setModalLevel(null);
  };

  const selectSector = (sector: Sector | null) => {
    setSelectedSector(sector);
    onChange(areaId, cragId, sector?.id ?? null);
    setModalLevel(null);
  };

  const createNew = async () => {
    if (!newName.trim()) return;
    try {
      if (modalLevel === 'area') {
        const id = await insertArea({ name: newName.trim() });
        const area: Area = { id, name: newName.trim(), latitude: null, longitude: null, created_at: '', synced: false };
        selectArea(area);
      } else if (modalLevel === 'crag') {
        const id = await insertCrag({ name: newName.trim(), area_id: areaId });
        const crag: Crag = { id, name: newName.trim(), area_id: areaId, latitude: null, longitude: null, created_at: '', synced: false };
        selectCrag(crag);
      } else if (modalLevel === 'sector') {
        const id = await insertSector({ name: newName.trim(), crag_id: cragId, area_id: cragId ? null : areaId });
        const sector: Sector = { id, name: newName.trim(), crag_id: cragId, area_id: cragId ? null : areaId, latitude: null, longitude: null, created_at: '', synced: false };
        selectSector(sector);
      }
    } catch (e) {
      Alert.alert('Chyba', `Nepodařilo se vytvořit: ${e}`);
    }
  };

  const getItems = (): { id: string; name: string }[] => {
    if (modalLevel === 'area') return areas;
    if (modalLevel === 'crag') return crags;
    return sectors;
  };

  const getTitle = (): string => {
    if (modalLevel === 'area') return 'Oblast';
    if (modalLevel === 'crag') return 'Skála';
    return 'Sektor';
  };

  const handleSelect = (item: { id: string; name: string }) => {
    if (modalLevel === 'area') selectArea(item as Area);
    else if (modalLevel === 'crag') selectCrag(item as Crag);
    else selectSector(item as Sector);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Místo</Text>

      <View style={styles.row}>
        <TouchableOpacity style={[styles.levelButton, selectedArea && styles.levelButtonActive]} onPress={() => openPicker('area')}>
          <Text style={styles.levelLabel}>Oblast</Text>
          <Text style={[styles.levelValue, !selectedArea && styles.levelPlaceholder]} numberOfLines={1}>
            {selectedArea?.name ?? 'Vybrat...'}
          </Text>
        </TouchableOpacity>
        {selectedArea && (
          <TouchableOpacity style={styles.clearSmall} onPress={() => selectArea(null)}>
            <Text style={styles.clearText}>x</Text>
          </TouchableOpacity>
        )}
      </View>

      {selectedArea && (
        <View style={styles.row}>
          <TouchableOpacity style={[styles.levelButton, selectedCrag && styles.levelButtonActive]} onPress={() => openPicker('crag')}>
            <Text style={styles.levelLabel}>Skála</Text>
            <Text style={[styles.levelValue, !selectedCrag && styles.levelPlaceholder]} numberOfLines={1}>
              {selectedCrag?.name ?? 'Přeskočit / Vybrat...'}
            </Text>
          </TouchableOpacity>
          {selectedCrag && (
            <TouchableOpacity style={styles.clearSmall} onPress={() => selectCrag(null)}>
              <Text style={styles.clearText}>x</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {(selectedArea || selectedCrag) && (
        <View style={styles.row}>
          <TouchableOpacity style={[styles.levelButton, selectedSector && styles.levelButtonActive]} onPress={() => openPicker('sector')}>
            <Text style={styles.levelLabel}>Sektor</Text>
            <Text style={[styles.levelValue, !selectedSector && styles.levelPlaceholder]} numberOfLines={1}>
              {selectedSector?.name ?? 'Přeskočit / Vybrat...'}
            </Text>
          </TouchableOpacity>
          {selectedSector && (
            <TouchableOpacity style={styles.clearSmall} onPress={() => selectSector(null)}>
              <Text style={styles.clearText}>x</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <Modal visible={modalLevel !== null} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{getTitle()}</Text>
            <ScrollView style={styles.itemList}>
              {getItems().map((item) => (
                <TouchableOpacity key={item.id} style={styles.item} onPress={() => handleSelect(item)}>
                  <Text style={styles.itemText}>{item.name}</Text>
                </TouchableOpacity>
              ))}
              {getItems().length === 0 && (
                <Text style={styles.emptyText}>Zatím žádné položky</Text>
              )}
            </ScrollView>
            <View style={styles.newRow}>
              <TextInput
                style={styles.newInput}
                value={newName}
                onChangeText={setNewName}
                placeholder={`Nová ${getTitle().toLowerCase()}...`}
              />
              <TouchableOpacity style={styles.newButton} onPress={createNew}>
                <Text style={styles.newButtonText}>+</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={() => setModalLevel(null)}>
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
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  levelButton: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1, borderColor: '#ddd', borderRadius: 8,
    padding: 10, backgroundColor: '#f9f9f9',
  },
  levelButtonActive: { borderColor: '#2d5a27', backgroundColor: '#e8f5e9' },
  levelLabel: { fontSize: 12, color: '#888', marginRight: 8 },
  levelValue: { fontSize: 14, color: '#333', flex: 1, textAlign: 'right' },
  levelPlaceholder: { color: '#aaa' },
  clearSmall: {
    marginLeft: 6, width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#e74c3c', justifyContent: 'center', alignItems: 'center',
  },
  clearText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16,
    padding: 20, maxHeight: '60%',
  },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12, textAlign: 'center' },
  itemList: { marginBottom: 12 },
  item: {
    paddingVertical: 12, paddingHorizontal: 16,
    borderBottomWidth: 1, borderBottomColor: '#eee',
  },
  itemText: { fontSize: 16, color: '#333' },
  emptyText: { fontSize: 14, color: '#bbb', textAlign: 'center', paddingVertical: 20 },
  newRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  newInput: {
    flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 8,
    padding: 10, fontSize: 15,
  },
  newButton: {
    width: 44, height: 44, borderRadius: 8, backgroundColor: '#2d5a27',
    justifyContent: 'center', alignItems: 'center',
  },
  newButtonText: { color: '#fff', fontSize: 22, fontWeight: '600' },
  closeButton: {
    paddingVertical: 14, backgroundColor: '#eee',
    borderRadius: 8, alignItems: 'center',
  },
  closeButtonText: { fontSize: 16, fontWeight: '600', color: '#666' },
});
