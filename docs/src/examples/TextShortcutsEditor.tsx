import { EnrichedTextInput } from 'react-native-enriched-html';
import type { EnrichedTextInputInstance } from 'react-native-enriched-html';
import { useRef } from 'react';
import { View, StyleSheet } from 'react-native';

export default function App() {
  const ref = useRef<EnrichedTextInputInstance>(null);

  return (
    <View style={styles.container}>
      <EnrichedTextInput
        ref={ref}
        style={styles.input}
        // Two shortcuts, one of each kind:
        // - '# ' at the start of a paragraph turns the line into an H1 (paragraph style)
        // - '**text**' wraps the delimited text in bold (inline style)
        textShortcuts={[
          { trigger: '# ', style: 'h1' },
          { trigger: '**', style: 'bold' },
        ]}
        placeholder="Try '# ' at the line start, or wrap a word in **stars**..."
      />
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
});
