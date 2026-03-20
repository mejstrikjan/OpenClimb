import React from 'react';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';

interface Props {
  rating: number;
  onRate?: (rating: number) => void;
  size?: number;
  readonly?: boolean;
}

export function StarRating({ rating, onRate, size = 28, readonly = false }: Props) {
  return (
    <View style={styles.container}>
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity
          key={star}
          disabled={readonly}
          onPress={() => onRate?.(star)}
          style={{ padding: 2 }}
        >
          <Text style={[styles.star, { fontSize: size, color: star <= rating ? '#f5a623' : '#ccc' }]}>
            {star <= rating ? '\u2605' : '\u2606'}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  star: {
    marginHorizontal: 1,
  },
});
