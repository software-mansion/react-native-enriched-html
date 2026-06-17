import { type FC } from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

interface Props {
  colors: string[];
  activeColor: string;
  onSelectColor: (color: string) => void;
  onClear: () => void;
}

export const ColorPickerRow: FC<Props> = ({
  colors,
  activeColor,
  onSelectColor,
  onClear,
}) => {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <Pressable style={styles.clearButton} onPress={onClear}>
        <Text style={styles.clearText}>✕</Text>
      </Pressable>
      {colors.map((color) => {
        const isActive = color.toLowerCase() === activeColor?.toLowerCase();
        return (
          <Pressable
            key={color}
            onPress={() => onSelectColor(color)}
            style={[
              styles.swatch,
              { backgroundColor: color },
              isActive && styles.swatchActive,
              color === '#FFFFFF' && styles.swatchBordered,
            ]}
          />
        );
      })}
    </ScrollView>
  );
};

const SWATCH_SIZE = 28;

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
    width: SWATCH_SIZE,
    height: SWATCH_SIZE,
    borderRadius: SWATCH_SIZE / 2,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearText: {
    color: 'white',
    fontSize: 14,
    lineHeight: 16,
  },
  swatch: {
    width: SWATCH_SIZE,
    height: SWATCH_SIZE,
    borderRadius: SWATCH_SIZE / 2,
  },
  swatchActive: {
    borderWidth: 3,
    borderColor: 'white',
  },
  swatchBordered: {
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.25)',
  },
});
