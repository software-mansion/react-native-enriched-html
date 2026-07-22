import { EnrichedTextInput } from 'react-native-enriched-html';
import type { EnrichedTextInputInstance } from 'react-native-enriched-html';
import { useRef } from 'react';
import { View, StyleSheet, Pressable, Text } from 'react-native';

const user = { id: '1', name: 'John' };

export default function App() {
  const ref = useRef<EnrichedTextInputInstance>(null);

  const insertMention = () => {
    // Replaces the active '@' mention the user has started by typing '@'.
    ref.current?.setMention('@', `@${user.name}`, { id: user.id });
  };

  return (
    <View style={styles.container}>
      <EnrichedTextInput
        ref={ref}
        style={styles.input}
        placeholder="Type '@', then tap the button below..."
      />
      <Pressable style={styles.button} onPress={insertMention}>
        <Text style={styles.text}>@{user.name}</Text>
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
  text: {
    textAlign: 'center',
    color: '#919fcf',
  },
});
