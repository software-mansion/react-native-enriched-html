import { type FC } from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

interface Props {
  sizes: number[];
  activeSize: number;
  onSelectSize: (size: number) => void;
  onClear: () => void;
}

export const FontSizePickerRow: FC<Props> = ({
  sizes,
  activeSize,
  onSelectSize,
  onClear,
}) => {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <Pressable
        testID="font-size-clear"
        style={styles.clearButton}
        onPress={onClear}
      >
        <Text style={styles.clearText}>✕</Text>
      </Pressable>
      {sizes.map((size) => {
        const isActive = size === activeSize;
        return (
          <Pressable
            key={size}
            testID={`font-size-${size}`}
            onPress={() => onSelectSize(size)}
            style={[styles.sizeButton, isActive && styles.sizeButtonActive]}
          >
            <Text style={styles.sizeText}>{size}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: 'rgba(0, 26, 114, 0.9)',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 8,
  },
  clearButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearText: {
    color: 'white',
    fontSize: 14,
    lineHeight: 16,
  },
  sizeButton: {
    minWidth: 36,
    height: 28,
    paddingHorizontal: 8,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sizeButtonActive: {
    backgroundColor: 'rgb(0, 26, 114)',
    borderWidth: 2,
    borderColor: 'white',
  },
  sizeText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 16,
  },
});
