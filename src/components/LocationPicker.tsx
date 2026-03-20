import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Modal } from 'react-native';
import * as Location from 'expo-location';

interface Props {
  latitude: number | null;
  longitude: number | null;
  onLocationChange: (lat: number, lng: number) => void;
  onLocationClear: () => void;
}

export function LocationPicker({ latitude, longitude, onLocationChange, onLocationClear }: Props) {
  const [loading, setLoading] = useState(false);

  const getCurrentLocation = async () => {
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Oprávnění', 'Pro získání polohy je potřeba oprávnění k lokaci.');
        return;
      }
      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      onLocationChange(location.coords.latitude, location.coords.longitude);
    } catch {
      Alert.alert('Chyba', 'Nepodařilo se získat polohu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Lokace</Text>
      {latitude !== null && longitude !== null ? (
        <View style={styles.locationInfo}>
          <View style={styles.coordsBox}>
            <Text style={styles.coordsText}>
              {latitude.toFixed(6)}, {longitude.toFixed(6)}
            </Text>
          </View>
          <TouchableOpacity style={styles.clearButton} onPress={onLocationClear}>
            <Text style={styles.clearButtonText}>Odebrat</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.button}
          onPress={getCurrentLocation}
          disabled={loading}
        >
          <Text style={styles.buttonIcon}>📍</Text>
          <Text style={styles.buttonText}>
            {loading ? 'Získávám polohu...' : 'Použít aktuální polohu'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 12 },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 6 },
  button: {
    paddingVertical: 16, borderRadius: 12,
    borderWidth: 2, borderColor: '#ddd', borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9f9f9',
  },
  buttonIcon: { fontSize: 24, marginBottom: 4 },
  buttonText: { fontSize: 14, color: '#666' },
  locationInfo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  coordsBox: {
    flex: 1, padding: 12, backgroundColor: '#e8f5e9',
    borderRadius: 8,
  },
  coordsText: { fontSize: 14, color: '#2d5a27', fontFamily: 'monospace' },
  clearButton: {
    paddingVertical: 8, paddingHorizontal: 12,
    backgroundColor: '#e74c3c', borderRadius: 8,
  },
  clearButtonText: { color: '#fff', fontWeight: '600', fontSize: 12 },
});
