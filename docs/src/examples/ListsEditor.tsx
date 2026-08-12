import { EnrichedTextInput } from 'react-native-enriched-html';
import type {
  EnrichedTextInputInstance,
  OnChangeStateEvent,
} from 'react-native-enriched-html';
import { useRef, useState } from 'react';
import { View, StyleSheet, Pressable, Text } from 'react-native';

export default function App() {
  const ref = useRef<EnrichedTextInputInstance>(null);
  const [state, setState] = useState<OnChangeStateEvent | null>(null);

  // Lists are paragraph styles - each toggle affects whole lines, and only
  // one list type can be active on a paragraph at a time.
  const listButtons = [
    {
      label: 'Bulleted',
      state: state?.unorderedList,
      onPress: () => ref.current?.toggleUnorderedList(),
    },
    {
      label: 'Numbered',
      state: state?.orderedList,
      onPress: () => ref.current?.toggleOrderedList(),
    },
    {
      label: 'Checkbox',
      state: state?.checkboxList,
      // Pass whether new checkboxes start checked or unchecked.
      onPress: () => ref.current?.toggleCheckboxList(false),
    },
  ];

  const renderButton = (button: (typeof listButtons)[number]) => (
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
        placeholder="Type a few lines, then turn them into a list..."
        onChangeState={e => setState(e.nativeEvent)}
      />
      <View style={styles.row}>{listButtons.map(renderButton)}</View>
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
