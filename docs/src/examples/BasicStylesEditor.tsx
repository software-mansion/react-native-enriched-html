import { EnrichedTextInput } from 'react-native-enriched-html';
import type {
  EnrichedTextInputInstance,
  OnChangeStateEvent,
} from 'react-native-enriched-html';
import { useRef, useState } from 'react';
import { View, StyleSheet, Pressable, Text } from 'react-native';
import { htmlStyle } from './htmlStyle';

export default function App() {
  const ref = useRef<EnrichedTextInputInstance>(null);
  const [state, setState] = useState<OnChangeStateEvent | null>(null);

  // Inline styles apply to the selected characters.
  const inlineButtons = [
    {
      label: 'Bold',
      state: state?.bold,
      onPress: () => ref.current?.toggleBold(),
    },
    {
      label: 'Italic',
      state: state?.italic,
      onPress: () => ref.current?.toggleItalic(),
    },
    {
      label: 'Underline',
      state: state?.underline,
      onPress: () => ref.current?.toggleUnderline(),
    },
    {
      label: 'Strike',
      state: state?.strikeThrough,
      onPress: () => ref.current?.toggleStrikeThrough(),
    },
  ];

  // Paragraph styles apply to the whole line the cursor sits in.
  const paragraphButtons = [
    { label: 'H1', state: state?.h1, onPress: () => ref.current?.toggleH1() },
    { label: 'H2', state: state?.h2, onPress: () => ref.current?.toggleH2() },
    {
      label: 'Quote',
      state: state?.blockQuote,
      onPress: () => ref.current?.toggleBlockQuote(),
    },
    {
      label: 'Code',
      state: state?.codeBlock,
      onPress: () => ref.current?.toggleCodeBlock(),
    },
  ];

  const renderButton = (button: (typeof inlineButtons)[number]) => (
    <Pressable
      key={button.label}
      disabled={button.state?.isBlocking}
      style={[
        styles.button,
        button.state?.isActive && styles.buttonActive,
        button.state?.isBlocking && styles.buttonDisabled,
      ]}
      onPress={button.onPress}>
      <Text style={[styles.text, button.state?.isActive && styles.textActive]}>
        {button.label}
      </Text>
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <EnrichedTextInput
        ref={ref}
        style={styles.input}
        htmlStyle={htmlStyle}
        placeholder="Type something here..."
        onChangeState={e => setState(e.nativeEvent)}
      />
      <View style={styles.row}>{inlineButtons.map(renderButton)}</View>
      <View style={styles.row}>{paragraphButtons.map(renderButton)}</View>
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
    width: 90,
    padding: 8,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#919fcf',
  },
  buttonActive: {
    borderColor: '#57b495',
    backgroundColor: '#57b495',
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  text: {
    textAlign: 'center',
    color: '#919fcf',
  },
  textActive: {
    color: '#eef0ff',
  },
});
