import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet, TouchableOpacity, Alert, Switch } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { AscentStyle } from '../types';
import { insertAscent, getAscentById, updateAscent } from '../database/ascentRepository';
import { getRouteById } from '../database/routeRepository';
import { AscentStylePicker } from '../components/AscentStylePicker';
import type { RootStackParamList } from '../navigation/AppNavigator';

export function AddAscentScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'AddAscent'>>();
  const { routeId, ascentId } = route.params;
  const isEditing = !!ascentId;

  const [routeName, setRouteName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [style, setStyle] = useState<AscentStyle>('redpoint');
  const [success, setSuccess] = useState(true);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(!isEditing);

  useEffect(() => {
    getRouteById(routeId).then((r) => {
      if (r) setRouteName(`${r.name} (${r.grade})`);
    });
    if (ascentId) {
      getAscentById(ascentId).then((a) => {
        if (a) {
          setDate(a.date);
          setStyle(a.style);
          setSuccess(a.success);
          setNotes(a.notes);
        }
        setLoaded(true);
      });
    }
  }, [routeId, ascentId]);

  const handleSave = async () => {
    if (!date.trim()) {
      Alert.alert('Chyba', 'Zadejte datum.');
      return;
    }
    setSaving(true);
    try {
      if (isEditing && ascentId) {
        await updateAscent(ascentId, { date, style, success, notes: notes.trim() });
      } else {
        await insertAscent({
          route_id: routeId,
          date,
          style,
          success,
          notes: notes.trim(),
        });
      }
      navigation.goBack();
    } catch (error) {
      console.error('Save ascent error:', error);
      Alert.alert('Chyba', `Nepodařilo se uložit: ${error}`);
    } finally {
      setSaving(false);
    }
  };

  if (!loaded) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ fontSize: 16, color: '#999' }}>Načítání...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.routeInfo}>
        <Text style={styles.routeLabel}>Cesta</Text>
        <Text style={styles.routeName}>{routeName}</Text>
      </View>

      <Text style={styles.label}>Datum</Text>
      <TextInput
        style={styles.input}
        value={date}
        onChangeText={setDate}
        placeholder="RRRR-MM-DD"
        keyboardType="numbers-and-punctuation"
      />

      <AscentStylePicker value={style} onChange={setStyle} />

      <View style={styles.switchRow}>
        <Text style={styles.label}>Slezeno</Text>
        <Switch
          value={success}
          onValueChange={setSuccess}
          trackColor={{ false: '#ddd', true: '#2d5a27' }}
          thumbColor={success ? '#fff' : '#f4f3f4'}
        />
        <Text style={styles.switchText}>{success ? '✅ Slezeno' : '🔄 Pokus'}</Text>
      </View>

      <Text style={styles.label}>Poznámky</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={notes}
        onChangeText={setNotes}
        placeholder="Jak to šlo? Klíčové momenty, podmínky..."
        multiline
        numberOfLines={4}
        textAlignVertical="top"
      />

      <TouchableOpacity
        style={[styles.saveButton, saving && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={saving}
      >
        <Text style={styles.saveButtonText}>
          {saving ? 'Ukládám...' : isEditing ? 'Uložit změny' : 'Zaznamenat výstup'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f0f0' },
  content: { padding: 16, paddingBottom: 40 },
  routeInfo: {
    backgroundColor: '#e8f5e9', borderRadius: 10, padding: 12, marginBottom: 16,
  },
  routeLabel: { fontSize: 12, color: '#888' },
  routeName: { fontSize: 17, fontWeight: '700', color: '#2d5a27', marginTop: 2 },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 6 },
  input: {
    backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 14,
    paddingVertical: 12, fontSize: 16, borderWidth: 1, borderColor: '#ddd',
    marginBottom: 12,
  },
  textArea: { minHeight: 80 },
  switchRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16,
  },
  switchText: { fontSize: 14, color: '#555' },
  saveButton: {
    backgroundColor: '#2d5a27', paddingVertical: 16, borderRadius: 12,
    alignItems: 'center', marginTop: 12,
  },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
