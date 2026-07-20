import { EnrichedTextInput } from 'react-native-enriched-html';
import type {
  EnrichedTextInputInstance,
  OnChangeSelectionEvent,
} from 'react-native-enriched-html';
import { useRef, useState } from 'react';
import { View, StyleSheet, Pressable, Text } from 'react-native';

// Autolink any "issue-123" style token.
const linkRegex = /issue-\d+/g;

export default function App() {
  const ref = useRef<EnrichedTextInputInstance>(null);
  const [selection, setSelection] = useState<OnChangeSelectionEvent | null>(
    null
  );

  const hasSelection = !!selection && selection.start !== selection.end;

  const addLink = () => {
    if (!selection) return;
    // Turn the current selection into a link pointing at our docs.
    ref.current?.setLink(
      selection.start,
      selection.end,
      selection.text,
      'https://swmansion.com'
    );
  };

  return (
    <View style={styles.container}>
      <EnrichedTextInput
        ref={ref}
        style={styles.input}
        placeholder="Type issue-123, or select text below..."
        linkRegex={linkRegex}
        onChangeSelection={e => setSelection(e.nativeEvent)}
      />
      <Pressable
        disabled={!hasSelection}
        style={[styles.button, !hasSelection && styles.buttonDisabled]}
        onPress={addLink}>
        <Text style={styles.text}>Link the selection</Text>
      </Pressable>
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
  button: {
    alignSelf: 'center',
    padding: 8,
    paddingHorizontal: 16,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#919fcf',
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  text: {
    textAlign: 'center',
    color: '#919fcf',
  },
});
