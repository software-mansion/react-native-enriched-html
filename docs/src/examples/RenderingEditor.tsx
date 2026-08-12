import { EnrichedTextInput, EnrichedText } from 'react-native-enriched-html';
import type {
  EnrichedTextInputInstance,
  OnChangeStateEvent,
} from 'react-native-enriched-html';
import { useRef, useState } from 'react';
import { View, StyleSheet, Pressable, Text } from 'react-native';

export default function App() {
  const ref = useRef<EnrichedTextInputInstance>(null);
  const [state, setState] = useState<OnChangeStateEvent | null>(null);
  const [html, setHtml] = useState(
    '<p>Edit the input above, then press <b>Render</b>.</p>'
  );

  const buttons = [
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
    { label: 'H1', state: state?.h1, onPress: () => ref.current?.toggleH1() },
    {
      label: 'Quote',
      state: state?.blockQuote,
      onPress: () => ref.current?.toggleBlockQuote(),
    },
  ];

  // Pull the current HTML off the editor and hand it to the viewer.
  const render = async () => {
    const value = await ref.current?.getHTML();
    if (value) setHtml(value);
  };

  return (
    <View style={styles.container}>
      <EnrichedTextInput
        ref={ref}
        style={styles.input}
        placeholder="Type something here..."
        onChangeState={e => setState(e.nativeEvent)}
      />
      <View style={styles.row}>
        {buttons.map(button => (
          <Pressable
            key={button.label}
            disabled={button.state?.isBlocking}
            style={[
              styles.button,
              button.state?.isActive && styles.buttonActive,
              button.state?.isBlocking && styles.buttonDisabled,
            ]}
            onPress={button.onPress}>
            <Text
              style={[
                styles.text,
                button.state?.isActive && styles.textActive,
              ]}>
              {button.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.row}>
        <Pressable style={styles.button} onPress={render}>
          <Text style={styles.text}>Render ↓</Text>
        </Pressable>
      </View>

      <EnrichedText style={styles.viewer} selectable>
        {html}
      </EnrichedText>
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
  viewer: {
    fontSize: 18,
    color: '#232736',
    padding: 12,
    borderRadius: 12,
    minHeight: 64,
    backgroundColor: '#eef0ff',
  },
});
