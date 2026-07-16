import { EnrichedTextInput } from 'react-native-enriched-html';
import type {
  EnrichedTextInputInstance,
  OnChangeStateEvent,
} from 'react-native-enriched-html';
import { useRef, useState } from 'react';
import { View, Button, StyleSheet } from 'react-native';

export default function App() {
  const ref = useRef<EnrichedTextInputInstance>(null);
  const [state, setState] = useState<OnChangeStateEvent | null>(null);

  return (
    <View style={styles.container}>
      <EnrichedTextInput
        ref={ref}
        style={styles.input}
        placeholder="Type something here..."
        onChangeState={(e) => setState(e.nativeEvent)}
      />
      <Button
        title={state?.bold.isActive ? 'Unbold' : 'Bold'}
        color={state?.bold.isActive ? 'green' : 'gray'}
        onPress={() => ref.current?.toggleBold()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12 },
  input: {
    fontSize: 18,
    padding: 12,
    minHeight: 96,
    backgroundColor: 'gainsboro',
  },
});
