import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

interface Props {
  photoUri: string | null;
  onPhotoSelected: (uri: string) => void;
  onPhotoRemoved: () => void;
  output?: 'uri' | 'dataUri';
}

function resolveSelectedPhoto(
  asset: ImagePicker.ImagePickerAsset,
  output: 'uri' | 'dataUri'
): string {
  if (output === 'dataUri' && asset.base64) {
    const mimeType = asset.mimeType ?? 'image/jpeg';
    return `data:${mimeType};base64,${asset.base64}`;
  }

  return asset.uri;
}

export function PhotoPicker({
  photoUri,
  onPhotoSelected,
  onPhotoRemoved,
  output = 'uri',
}: Props) {
  const pickFromGallery = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Oprávnění', 'Pro výběr fotek je potřeba přístup ke galerii.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: true,
      aspect: [4, 3],
      base64: output === 'dataUri',
    });
    if (!result.canceled && result.assets[0]) {
      onPhotoSelected(resolveSelectedPhoto(result.assets[0], output));
    }
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Oprávnění', 'Pro focení je potřeba přístup ke kameře.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
      allowsEditing: true,
      aspect: [4, 3],
      base64: output === 'dataUri',
    });
    if (!result.canceled && result.assets[0]) {
      onPhotoSelected(resolveSelectedPhoto(result.assets[0], output));
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Fotografie</Text>
      {photoUri ? (
        <View style={styles.previewContainer}>
          <Image source={{ uri: photoUri }} style={styles.preview} />
          <TouchableOpacity style={styles.removeButton} onPress={onPhotoRemoved}>
            <Text style={styles.removeButtonText}>Odebrat</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.button} onPress={takePhoto}>
            <Text style={styles.buttonIcon}>📷</Text>
            <Text style={styles.buttonText}>Vyfotit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={pickFromGallery}>
            <Text style={styles.buttonIcon}>🖼️</Text>
            <Text style={styles.buttonText}>Z galerie</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 12 },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 6 },
  buttonRow: { flexDirection: 'row', gap: 12 },
  button: {
    flex: 1, paddingVertical: 24, borderRadius: 12,
    borderWidth: 2, borderColor: '#ddd', borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9f9f9',
  },
  buttonIcon: { fontSize: 28, marginBottom: 4 },
  buttonText: { fontSize: 14, color: '#666' },
  previewContainer: { alignItems: 'center' },
  preview: { width: '100%', height: 200, borderRadius: 12 },
  removeButton: {
    marginTop: 8, paddingVertical: 8, paddingHorizontal: 16,
    backgroundColor: '#e74c3c', borderRadius: 8,
  },
  removeButtonText: { color: '#fff', fontWeight: '600' },
});
