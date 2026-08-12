import { EnrichedTextInput } from 'react-native-enriched-html';
import type { EnrichedTextInputInstance } from 'react-native-enriched-html';
import { useRef } from 'react';
import { View, StyleSheet, Pressable, Text } from 'react-native';

export default function App() {
  const ref = useRef<EnrichedTextInputInstance>(null);

  const insertImage = () => {
    // A real, loadable image. You supply the dimensions yourself - here we
    // ask Lorem Picsum for a 320x160 photo and pass the proportionally down-scaled size.
    ref.current?.setImage('https://picsum.photos/320/160', 160, 80);
  };

  const insertBrokenImage = () => {
    // An unreachable source. The editor renders its static placeholder
    // instead of failing, so you can see what a broken image looks like.
    ref.current?.setImage('https://picsum.photos/does-not-exist', 160, 80);
  };

  return (
    <View style={styles.container}>
      <EnrichedTextInput
        ref={ref}
        style={styles.input}
        placeholder="Place the cursor, then insert an image below..."
      />
      <View style={styles.row}>
        <Pressable style={styles.button} onPress={insertImage}>
          <Text style={styles.text}>Insert image</Text>
        </Pressable>
        <Pressable style={styles.button} onPress={insertBrokenImage}>
          <Text style={styles.text}>Insert broken image</Text>
        </Pressable>
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
