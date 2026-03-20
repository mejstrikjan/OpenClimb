import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { GradeSystem, RouteType } from '../types';
import { insertRoute } from '../database/routeRepository';
import { StarRating } from '../components/StarRating';
import { GradePicker } from '../components/GradePicker';
import { PhotoPicker } from '../components/PhotoPicker';
import { RouteTypePicker } from '../components/RouteTypePicker';
import { LocationPicker } from '../components/LocationPicker';

export function AddRouteScreen() {
  const navigation = useNavigation();
  const [name, setName] = useState('');
  const [gradeSystem, setGradeSystem] = useState<GradeSystem>('French');
  const [grade, setGrade] = useState('');
  const [type, setType] = useState<RouteType>('sport');
  const [description, setDescription] = useState('');
  const [rating, setRating] = useState(0);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Chyba', 'Zadejte název cesty.');
      return;
    }
    setSaving(true);
    try {
      await insertRoute({
        name: name.trim(),
        grade,
        grade_system: gradeSystem,
        type,
        description: description.trim(),
        rating,
        latitude,
        longitude,
        sector_id: null,
        photo_uri: photoUri,
      });
      navigation.goBack();
    } catch (error) {
      console.error('Save route error:', error);
      Alert.alert('Chyba', `Nepodařilo se uložit cestu: ${error}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.sectionTitle}>Základní údaje</Text>

        <Text style={styles.label}>Název cesty *</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="např. Stěna smrti"
        />

        <RouteTypePicker value={type} onChange={setType} />

        <GradePicker
          system={gradeSystem}
          grade={grade}
          onSystemChange={setGradeSystem}
          onGradeChange={setGrade}
        />

        <Text style={styles.sectionTitle}>Hodnocení</Text>
        <View style={styles.ratingRow}>
          <Text style={styles.label}>Kvalita cesty</Text>
          <StarRating rating={rating} onRate={setRating} size={32} />
        </View>

        <Text style={styles.sectionTitle}>Popis</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="Popište cestu — charakter, klíčová místa, tipy..."
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        <Text style={styles.sectionTitle}>Média a lokace</Text>
        <PhotoPicker
          photoUri={photoUri}
          onPhotoSelected={setPhotoUri}
          onPhotoRemoved={() => setPhotoUri(null)}
        />

        <LocationPicker
          latitude={latitude}
          longitude={longitude}
          onLocationChange={(lat, lng) => { setLatitude(lat); setLongitude(lng); }}
          onLocationClear={() => { setLatitude(null); setLongitude(null); }}
        />

        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveButtonText}>
            {saving ? 'Ukládám...' : 'Uložit cestu'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f0f0' },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  sectionTitle: {
    fontSize: 18, fontWeight: '700', color: '#222',
    marginTop: 16, marginBottom: 10,
  },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 6 },
  input: {
    backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 14,
    paddingVertical: 12, fontSize: 16, borderWidth: 1, borderColor: '#ddd',
    marginBottom: 12,
  },
  textArea: { minHeight: 100 },
  ratingRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 12,
  },
  saveButton: {
    backgroundColor: '#2d5a27', paddingVertical: 16, borderRadius: 12,
    alignItems: 'center', marginTop: 20,
  },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
