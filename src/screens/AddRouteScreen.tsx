import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { GradeSystem, RouteType } from '../types';
import { insertRoute, updateRoute, getRouteById } from '../database/routeRepository';
import { StarRating } from '../components/StarRating';
import { GradePicker } from '../components/GradePicker';
import { PhotoPicker } from '../components/PhotoPicker';
import { RouteTypePicker } from '../components/RouteTypePicker';
import { LocationPicker } from '../components/LocationPicker';
import { HierarchyPicker } from '../components/HierarchyPicker';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { colors } from '../theme/colors';

const DEFAULT_GRADE_SYSTEM_BY_TYPE: Record<RouteType, GradeSystem> = {
  sport: 'French',
  trad: 'French',
  boulder: 'V-scale',
  indoor: 'UIAA',
};

export function AddRouteScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'AddRoute'>>();
  const editId = route.params?.routeId;
  const isEditing = !!editId;

  const [name, setName] = useState('');
  const [gradeSystem, setGradeSystem] = useState<GradeSystem>('French');
  const [grade, setGrade] = useState('');
  const [type, setType] = useState<RouteType>('sport');
  const [description, setDescription] = useState('');
  const [rating, setRating] = useState(0);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [areaId, setAreaId] = useState<string | null>(null);
  const [cragId, setCragId] = useState<string | null>(null);
  const [sectorId, setSectorId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(!isEditing);
  const [userChangedGradeSystem, setUserChangedGradeSystem] = useState(false);

  useEffect(() => {
    if (!editId) return;
    getRouteById(editId).then((r) => {
      if (r) {
        setName(r.name);
        setGradeSystem(r.grade_system);
        setGrade(r.grade);
        setType(r.type);
        setDescription(r.description);
        setRating(r.rating);
        setPhotoUri(r.photo_uri);
        setLatitude(r.latitude);
        setLongitude(r.longitude);
        setAreaId(r.area_id);
        setCragId(r.crag_id);
        setSectorId(r.sector_id);
        setUserChangedGradeSystem(true);
      }
      setLoaded(true);
    });
  }, [editId]);

  useEffect(() => {
    if (isEditing || userChangedGradeSystem) {
      return;
    }

    const nextSystem = DEFAULT_GRADE_SYSTEM_BY_TYPE[type];
    if (gradeSystem !== nextSystem) {
      setGradeSystem(nextSystem);
      setGrade('');
    }
  }, [gradeSystem, isEditing, type, userChangedGradeSystem]);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Chyba', 'Zadejte název cesty.');
      return;
    }
    setSaving(true);
    try {
      if (isEditing) {
        await updateRoute(editId, {
          name: name.trim(),
          grade,
          grade_system: gradeSystem,
          type,
          description: description.trim(),
          rating,
          latitude,
          longitude,
          area_id: areaId,
          crag_id: cragId,
          sector_id: sectorId,
          photo_uri: photoUri,
        });
      } else {
        await insertRoute({
          name: name.trim(),
          grade,
          grade_system: gradeSystem,
          type,
          description: description.trim(),
          rating,
          latitude,
          longitude,
          area_id: areaId,
          crag_id: cragId,
          sector_id: sectorId,
          photo_uri: photoUri,
        });
      }
      navigation.goBack();
    } catch (error) {
      console.error('Save route error:', error);
      Alert.alert('Chyba', `Nepodařilo se uložit cestu: ${error}`);
    } finally {
      setSaving(false);
    }
  };

  if (!loaded) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ fontSize: 16, color: colors.textMuted }}>Načítání...</Text>
      </View>
    );
  }

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
          onSystemChange={(system) => {
            setUserChangedGradeSystem(true);
            setGradeSystem(system);
          }}
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

        <Text style={styles.sectionTitle}>Lokace</Text>
        <HierarchyPicker
          areaId={areaId}
          cragId={cragId}
          sectorId={sectorId}
          onChange={(a, c, s) => { setAreaId(a); setCragId(c); setSectorId(s); }}
        />

        <Text style={styles.sectionTitle}>Média a GPS</Text>
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
            {saving ? 'Ukládám...' : isEditing ? 'Uložit změny' : 'Uložit cestu'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  sectionTitle: {
    fontSize: 18, fontWeight: '700', color: colors.text,
    marginTop: 16, marginBottom: 10,
  },
  label: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 6 },
  input: {
    backgroundColor: colors.surface, borderRadius: 10, paddingHorizontal: 14,
    paddingVertical: 12, fontSize: 16, borderWidth: 1, borderColor: colors.border,
    marginBottom: 12,
  },
  textArea: { minHeight: 100 },
  ratingRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 12,
  },
  saveButton: {
    backgroundColor: colors.primary, paddingVertical: 16, borderRadius: 12,
    alignItems: 'center', marginTop: 20,
  },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: { color: colors.textOnDark, fontSize: 17, fontWeight: '700' },
});
