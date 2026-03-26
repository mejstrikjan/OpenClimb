import React, { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { PhotoPicker } from '../components/PhotoPicker';
import { MapLocationPicker } from '../components/MapLocationPicker';
import { getAreaById, insertArea, updateArea } from '../database/areaRepository';
import type { RootStackParamList } from '../navigation/AppNavigator';

export function AddAreaScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'AddArea'>>();
  const areaId = route.params?.areaId;
  const isEditing = !!areaId;

  const [loaded, setLoaded] = useState(!isEditing);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [mapInteracting, setMapInteracting] = useState(false);

  useEffect(() => {
    if (!areaId) {
      return;
    }

    getAreaById(areaId).then((area) => {
      if (area) {
        setName(area.name);
        setPreviewUri(area.preview_uri);
        setLatitude(area.latitude);
        setLongitude(area.longitude);
      }
      setLoaded(true);
    });
  }, [areaId]);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Chyba', 'Zadejte název oblasti.');
      return;
    }

    setSaving(true);
    try {
      if (isEditing && areaId) {
        await updateArea(areaId, {
          name: name.trim(),
          preview_uri: previewUri,
          latitude,
          longitude,
        });
      } else {
        await insertArea({
          name: name.trim(),
          preview_uri: previewUri,
          latitude,
          longitude,
        });
      }
      navigation.goBack();
    } catch (error) {
      Alert.alert('Chyba', `Nepodařilo se uložit oblast: ${error}`);
    } finally {
      setSaving(false);
    }
  };

  if (!loaded) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingText}>Načítání oblasti...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        scrollEnabled={!mapInteracting}
        nestedScrollEnabled
      >
        <Text style={styles.sectionTitle}>Základní údaje</Text>
        <Text style={styles.label}>Název oblasti *</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="např. Roviště"
        />

        <Text style={styles.sectionTitle}>Preview ikona oblasti</Text>
        <PhotoPicker
          photoUri={previewUri}
          onPhotoSelected={setPreviewUri}
          onPhotoRemoved={() => setPreviewUri(null)}
          output="dataUri"
        />

        <Text style={styles.sectionTitle}>Mapa</Text>
        <MapLocationPicker
          latitude={latitude}
          longitude={longitude}
          onInteractionChange={setMapInteracting}
          onLocationChange={(nextLatitude, nextLongitude) => {
            setLatitude(nextLatitude);
            setLongitude(nextLongitude);
          }}
          onLocationClear={() => {
            setLatitude(null);
            setLongitude(null);
          }}
        />

        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveButtonText}>
            {saving ? 'Ukládám...' : isEditing ? 'Uložit oblast' : 'Vytvořit oblast'}
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
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 16, color: '#999' },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#222',
    marginTop: 16,
    marginBottom: 10,
  },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 6 },
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 12,
  },
  saveButton: {
    backgroundColor: '#2d5a27',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
