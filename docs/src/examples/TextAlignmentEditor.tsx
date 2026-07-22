import { EnrichedTextInput } from 'react-native-enriched-html';
import type {
  EnrichedTextInputInstance,
  OnChangeStateEvent,
} from 'react-native-enriched-html';
import { useRef, useState } from 'react';
import { View, StyleSheet, Pressable, Text } from 'react-native';
import { htmlStyle } from './htmlStyle';

const alignments = ['left', 'center', 'right', 'justify'] as const;

export default function App() {
  const ref = useRef<EnrichedTextInputInstance>(null);
  const [state, setState] = useState<OnChangeStateEvent | null>(null);

  const renderButton = (alignment: (typeof alignments)[number]) => {
    // A single string reports the alignment of the paragraph at the cursor.
    const isActive = state?.alignment === alignment;
    return (
      <Pressable
        key={alignment}
        style={[styles.button, isActive && styles.buttonActive]}
        onPress={() => ref.current?.setTextAlignment(alignment)}>
        <Text style={[styles.text, isActive && styles.textActive]}>
          {alignment}
        </Text>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <EnrichedTextInput
        ref={ref}
        style={styles.input}
        htmlStyle={htmlStyle}
        placeholder="Type a paragraph, then align it below..."
        onChangeState={e => setState(e.nativeEvent)}
      />
      <View style={styles.row}>{alignments.map(renderButton)}</View>
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
  text: {
    textAlign: 'center',
    color: '#919fcf',
  },
  textActive: {
    color: '#eef0ff',
  },
});
