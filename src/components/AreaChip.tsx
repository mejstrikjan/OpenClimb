import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Area } from '../types';

interface Props {
  area: Area;
  routeCount: number;
  onPress: () => void;
}

export function AreaChip({ area, routeCount, onPress }: Props) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.previewWrap}>
        {area.preview_uri ? (
          <Image source={{ uri: area.preview_uri }} style={styles.preview} />
        ) : (
          <View style={[styles.preview, styles.previewFallback]}>
            <Text style={styles.previewEmoji}>🪨</Text>
          </View>
        )}
      </View>
      <Text style={styles.name} numberOfLines={1}>
        {area.name}
      </Text>
      <Text style={styles.meta}>{routeCount} cest</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 104,
    marginRight: 12,
    alignItems: 'center',
  },
  previewWrap: {
    width: 76,
    height: 76,
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 8,
    backgroundColor: '#d8e7d2',
    borderWidth: 2,
    borderColor: '#fff',
  },
  preview: {
    width: '100%',
    height: '100%',
  },
  previewFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewEmoji: {
    fontSize: 28,
  },
  name: {
    fontSize: 13,
    fontWeight: '700',
    color: '#24331f',
    textAlign: 'center',
  },
  meta: {
    marginTop: 2,
    fontSize: 11,
    color: '#6d7f66',
  },
});
