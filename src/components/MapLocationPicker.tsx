import React, { useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as Location from 'expo-location';
import { MapyWebView } from './MapyWebView';
import { hasMapyApiKey } from '../config/mapy';
import { colors } from '../theme/colors';

interface Props {
  latitude: number | null;
  longitude: number | null;
  onLocationChange: (lat: number, lng: number) => void;
  onLocationClear: () => void;
  onInteractionChange?: (interacting: boolean) => void;
}

type Region = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

const DEFAULT_REGION: Region = {
  latitude: 49.8175,
  longitude: 15.473,
  latitudeDelta: 2.4,
  longitudeDelta: 2.4,
};

export function MapLocationPicker({
  latitude,
  longitude,
  onLocationChange,
  onLocationClear,
  onInteractionChange,
}: Props) {
  const [loadingCurrentLocation, setLoadingCurrentLocation] = useState(false);

  const region = useMemo<Region>(() => {
    if (latitude === null || longitude === null) {
      return DEFAULT_REGION;
    }

    return {
      latitude,
      longitude,
      latitudeDelta: 0.15,
      longitudeDelta: 0.15,
    };
  }, [latitude, longitude]);

  const handleUseCurrentLocation = async () => {
    setLoadingCurrentLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Oprávnění', 'Pro získání polohy je potřeba oprávnění k lokaci.');
        return;
      }

      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      onLocationChange(location.coords.latitude, location.coords.longitude);
    } catch {
      Alert.alert('Chyba', 'Nepodařilo se získat aktuální polohu.');
    } finally {
      setLoadingCurrentLocation(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Poloha oblasti na mapě</Text>
      <Text style={styles.hint}>Klepnutím do mapy nastavíte bublinu oblasti.</Text>

      <MapyWebView
        mode="picker"
        height={220}
        centerLatitude={region.latitude}
        centerLongitude={region.longitude}
        zoom={latitude !== null && longitude !== null ? 13 : 7}
        markers={[]}
        selectedLatitude={latitude}
        selectedLongitude={longitude}
        emptyStateTitle="Chybí Mapy.com API klíč"
        emptyStateText="Přidejte EXPO_PUBLIC_MAPY_API_KEY do .env.local. Do té doby lze použít aktuální lokaci tlačítkem níže."
        onSelectLocation={onLocationChange}
        onMapError={(message) => Alert.alert('Výběr polohy', message)}
        onInteractionChange={onInteractionChange}
      />

      <View style={styles.actions}>
        <TouchableOpacity style={styles.secondaryButton} onPress={handleUseCurrentLocation} disabled={loadingCurrentLocation}>
          <Text style={styles.secondaryButtonText}>
            {loadingCurrentLocation ? 'Získávám polohu...' : 'Použít aktuální polohu'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.clearButton} onPress={onLocationClear}>
          <Text style={styles.clearButtonText}>Vymazat</Text>
        </TouchableOpacity>
      </View>

      {latitude !== null && longitude !== null ? (
        <Text style={styles.coords}>
          {latitude.toFixed(6)}, {longitude.toFixed(6)}
        </Text>
      ) : (
        <Text style={styles.empty}>Oblast zatím nemá uloženou polohu.</Text>
      )}
      {!hasMapyApiKey() ? (
        <Text style={styles.securityText}>
          Doporučení: v Mapy.com omezte klíč podle User-Agent a povolte jen potřebné služby.
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  hint: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 8,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  secondaryButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: colors.primaryDark,
    fontWeight: '700',
  },
  clearButton: {
    paddingHorizontal: 16,
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: colors.danger,
  },
  clearButtonText: {
    color: colors.textOnDark,
    fontWeight: '700',
  },
  coords: {
    marginTop: 10,
    fontSize: 13,
    color: colors.primaryDark,
    fontFamily: 'monospace',
  },
  empty: {
    marginTop: 10,
    fontSize: 13,
    color: colors.textMuted,
  },
  securityText: {
    marginTop: 10,
    fontSize: 12,
    color: colors.primaryDark,
  },
});
