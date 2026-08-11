import { type FC } from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

export interface FontFamilyOption {
  label: string;
  value: string;
}

interface Props {
  families: FontFamilyOption[];
  activeFamily: string;
  onSelectFamily: (family: string) => void;
  onClear: () => void;
}

export const FontFamilyPickerRow: FC<Props> = ({
  families,
  activeFamily,
  onSelectFamily,
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
        testID="font-family-clear"
        style={styles.clearButton}
        onPress={onClear}
      >
        <Text style={styles.clearText}>✕</Text>
      </Pressable>
      {families.map(({ label, value }) => {
        const isActive = value === activeFamily;
        return (
          <Pressable
            key={value}
            testID={`font-family-${value}`}
            onPress={() => onSelectFamily(value)}
            style={[styles.familyButton, isActive && styles.familyButtonActive]}
          >
            <Text style={[styles.familyText, { fontFamily: value }]}>
              {label}
            </Text>
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
  familyButton: {
    minWidth: 36,
    height: 28,
    paddingHorizontal: 8,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  familyButtonActive: {
    backgroundColor: 'rgb(0, 26, 114)',
    borderWidth: 2,
    borderColor: 'white',
  },
  familyText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 16,
  },
});
