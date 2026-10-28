import { EnrichedTextInput } from 'react-native-enriched-html';
import type {
  EnrichedTextInputInstance,
  OnChangeStateEvent,
} from 'react-native-enriched-html';
import { useRef, useState } from 'react';
import { View, StyleSheet, Pressable, Text } from 'react-native';
import { htmlStyle } from './htmlStyle';

const TEXT_COLOR = '#ff8560';
const HIGHLIGHT_COLOR = '#c1c6e5';
const FONT_SIZE = 26;
const FONT_FAMILY = 'cursive';

export default function App() {
  const ref = useRef<EnrichedTextInputInstance>(null);
  const [state, setState] = useState<OnChangeStateEvent | null>(null);

  const customStyle = state?.customStyle;

  const buttons = [
    {
      label: 'Color',
      isActive: !!customStyle?.foregroundColor,
      onPress: () =>
        ref.current?.setStyle({
          foregroundColor: customStyle?.foregroundColor ? null : TEXT_COLOR,
        }),
    },
    {
      label: 'Highlight',
      isActive: !!customStyle?.backgroundColor,
      onPress: () =>
        ref.current?.setStyle({
          backgroundColor: customStyle?.backgroundColor
            ? null
            : HIGHLIGHT_COLOR,
        }),
    },
    {
      label: 'Font size',
      isActive: !!customStyle?.fontSize,
      onPress: () =>
        ref.current?.setStyle({
          fontSize: customStyle?.fontSize ? null : FONT_SIZE,
        }),
    },
    {
      label: 'Font family',
      isActive: !!customStyle?.fontFamily,
      onPress: () =>
        ref.current?.setStyle({
          fontFamily: customStyle?.fontFamily ? null : FONT_FAMILY,
        }),
    },
  ];

  return (
    <View style={styles.container}>
      <EnrichedTextInput
        ref={ref}
        style={styles.input}
        htmlStyle={htmlStyle}
        placeholder="Select some text and style it below..."
        onChangeState={e => setState(e.nativeEvent)}
      />
      <View style={styles.row}>
        {buttons.map(button => (
          <Pressable
            key={button.label}
            style={[styles.button, button.isActive && styles.buttonActive]}
            onPress={button.onPress}>
            <Text style={[styles.text, button.isActive && styles.textActive]}>
              {button.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12 },
  input: {
    fontSize: 18,
    color: '#232736',
    padding: 12,
    borderRadius: 12,
    minHeight: 96,
    backgroundColor: '#eef0ff',
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  button: {
    width: 120,
    padding: 8,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#919fcf',
  },
  buttonActive: {
    borderColor: '#57b495',
    backgroundColor: '#57b495',
  },
  text: {
    textAlign: 'center',
    color: '#919fcf',
  },
  textActive: {
    color: '#eef0ff',
  },
});
