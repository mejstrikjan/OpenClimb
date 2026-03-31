import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import {
  DEFAULT_GRADE_SYSTEM_BY_TYPE,
  GradeSystem,
  IndoorColor,
  INDOOR_COLOR_OPTIONS,
  ROCK_TYPE_OPTIONS,
  RockType,
  RouteType,
} from '../types';
import { insertRoute, updateRoute, getRouteById } from '../database/routeRepository';
import { StarRating } from '../components/StarRating';
import { GradePicker } from '../components/GradePicker';
import { PhotoPicker } from '../components/PhotoPicker';
import { RouteTypePicker } from '../components/RouteTypePicker';
import { LocationPicker } from '../components/LocationPicker';
import { HierarchyPicker } from '../components/HierarchyPicker';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { colors } from '../theme/colors';
import DateTimePicker, { DateTimePickerAndroid, type DateTimePickerEvent } from '@react-native-community/datetimepicker';

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
  const [rockType, setRockType] = useState<RockType>('');
  const [indoorColor, setIndoorColor] = useState<IndoorColor>('');
  const [routeDate, setRouteDate] = useState(new Date().toISOString().split('T')[0]);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [areaId, setAreaId] = useState<string | null>(null);
  const [cragId, setCragId] = useState<string | null>(null);
  const [sectorId, setSectorId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(!isEditing);
  const [userChangedGradeSystem, setUserChangedGradeSystem] = useState(false);
  const [showIosDatePicker, setShowIosDatePicker] = useState(false);

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
        setRockType(r.rock_type);
        setIndoorColor(r.indoor_color);
        setRouteDate(r.route_date || r.created_at.split('T')[0]);
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

  useEffect(() => {
    if (type === 'indoor') {
      setRockType('');
      return;
    }
    setIndoorColor('');
  }, [type]);

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
          rock_type: type === 'indoor' ? '' : rockType,
          indoor_color: type === 'indoor' ? indoorColor : '',
          route_date: routeDate,
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
          rock_type: type === 'indoor' ? '' : rockType,
          indoor_color: type === 'indoor' ? indoorColor : '',
          route_date: routeDate,
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

  const selectedRouteDate = parseStoredDate(routeDate);

  const handleRouteDateChange = (event: DateTimePickerEvent, pickedDate?: Date) => {
    if (Platform.OS === 'ios') {
      if (event.type === 'dismissed') {
        setShowIosDatePicker(false);
        return;
      }
      if (pickedDate) {
        setRouteDate(formatDateForStorage(pickedDate));
      }
      return;
    }

    if (event.type === 'set' && pickedDate) {
      setRouteDate(formatDateForStorage(pickedDate));
    }
  };

  const openRouteDatePicker = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: selectedRouteDate,
        mode: 'date',
        is24Hour: true,
        onChange: handleRouteDateChange,
      });
      return;
    }

    setShowIosDatePicker((current) => !current);
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

        <Text style={styles.label}>Datum vytvoření cesty</Text>
        <TouchableOpacity style={styles.dateButton} onPress={openRouteDatePicker}>
          <Text style={styles.dateButtonLabel}>Vybrané datum</Text>
          <Text style={styles.dateButtonValue}>{formatDateForDisplay(selectedRouteDate)}</Text>
          <Text style={styles.dateButtonMeta}>{routeDate}</Text>
        </TouchableOpacity>
        {Platform.OS === 'ios' && showIosDatePicker ? (
          <View style={styles.iosDatePickerWrap}>
            <DateTimePicker
              value={selectedRouteDate}
              mode="date"
              display="inline"
              onChange={handleRouteDateChange}
            />
          </View>
        ) : null}

        {type === 'indoor' ? (
          <>
            <Text style={styles.label}>Barva cesty / stěny</Text>
            <View style={styles.contextRow}>
              <TouchableOpacity
                style={[styles.contextChip, indoorColor === '' && styles.contextChipActive]}
                onPress={() => setIndoorColor('')}
              >
                <Text style={[styles.contextChipText, indoorColor === '' && styles.contextChipTextActive]}>
                  Bez určení
                </Text>
              </TouchableOpacity>
              {INDOOR_COLOR_OPTIONS.map((colorName) => {
                const active = indoorColor === colorName;
                return (
                  <TouchableOpacity
                    key={colorName}
                    style={[styles.contextChip, active && styles.contextChipActive]}
                    onPress={() => setIndoorColor(colorName)}
                  >
                    <Text style={[styles.contextChipText, active && styles.contextChipTextActive]}>{colorName}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        ) : (
          <>
            <Text style={styles.label}>Druh skály</Text>
            <View style={styles.contextRow}>
              {ROCK_TYPE_OPTIONS.map((option) => {
                const active = rockType === option.value;
                return (
                  <TouchableOpacity
                    key={option.value || 'unset-rock'}
                    style={[styles.contextChip, active && styles.contextChipActive]}
                    onPress={() => setRockType(option.value)}
                  >
                    <Text style={[styles.contextChipText, active && styles.contextChipTextActive]}>{option.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}

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
  dateButton: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  dateButtonLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 4,
  },
  dateButtonValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  dateButtonMeta: {
    marginTop: 4,
    fontSize: 12,
    color: colors.primaryDark,
    fontFamily: 'monospace',
  },
  iosDatePickerWrap: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    marginBottom: 12,
  },
  contextRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  contextChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  contextChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryDark,
  },
  contextChipText: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '700',
  },
  contextChipTextActive: {
    color: colors.textOnDark,
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

function parseStoredDate(value: string): Date {
  const parsed = new Date(`${value}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return new Date();
  }
  return parsed;
}

function formatDateForStorage(value: Date): string {
  const year = value.getFullYear();
  const month = `${value.getMonth() + 1}`.padStart(2, '0');
  const day = `${value.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDateForDisplay(value: Date): string {
  return value.toLocaleDateString('cs-CZ', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}
