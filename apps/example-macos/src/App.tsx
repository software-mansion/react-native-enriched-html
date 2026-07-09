import { useRef, useState } from 'react';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  EnrichedText,
  EnrichedTextInput,
  type EnrichedTextInputInstance,
  type OnChangeStateEvent,
} from 'react-native-enriched-html';

interface ToolbarButtonProps {
  label: string;
  active?: boolean;
  onPress: () => void;
}

function ToolbarButton({ label, active, onPress }: ToolbarButtonProps) {
  return (
    <Pressable
      style={[styles.button, active && styles.buttonActive]}
      onPress={onPress}
    >
      <Text style={styles.buttonLabel}>{label}</Text>
    </Pressable>
  );
}

export default function App() {
  const ref = useRef<EnrichedTextInputInstance>(null);
  const [styleState, setStyleState] = useState<OnChangeStateEvent | null>(null);
  const [html, setHtml] = useState('');

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.heading}>EnrichedTextInput</Text>
        <View style={styles.toolbar}>
          <ToolbarButton
            label="B"
            active={styleState?.bold.isActive}
            onPress={() => ref.current?.toggleBold()}
          />
          <ToolbarButton
            label="I"
            active={styleState?.italic.isActive}
            onPress={() => ref.current?.toggleItalic()}
          />
          <ToolbarButton
            label="U"
            active={styleState?.underline.isActive}
            onPress={() => ref.current?.toggleUnderline()}
          />
          <ToolbarButton
            label="S"
            active={styleState?.strikeThrough.isActive}
            onPress={() => ref.current?.toggleStrikeThrough()}
          />
          <ToolbarButton
            label="Code"
            active={styleState?.inlineCode.isActive}
            onPress={() => ref.current?.toggleInlineCode()}
          />
          <ToolbarButton
            label="H1"
            active={styleState?.h1.isActive}
            onPress={() => ref.current?.toggleH1()}
          />
          <ToolbarButton
            label="Quote"
            active={styleState?.blockQuote.isActive}
            onPress={() => ref.current?.toggleBlockQuote()}
          />
          <ToolbarButton
            label="Code block"
            active={styleState?.codeBlock.isActive}
            onPress={() => ref.current?.toggleCodeBlock()}
          />
          <ToolbarButton
            label="1."
            active={styleState?.orderedList.isActive}
            onPress={() => ref.current?.toggleOrderedList()}
          />
          <ToolbarButton
            label="•"
            active={styleState?.unorderedList.isActive}
            onPress={() => ref.current?.toggleUnorderedList()}
          />
          <ToolbarButton
            label="☑"
            active={styleState?.checkboxList.isActive}
            onPress={() => ref.current?.toggleCheckboxList(false)}
          />
        </View>
        <EnrichedTextInput
          ref={ref}
          style={styles.input}
          placeholder="Type something rich..."
          onChangeState={(e) => setStyleState(e.nativeEvent)}
          onChangeHtml={(e) => setHtml(e.nativeEvent.value)}
        />
        <Text style={styles.heading}>HTML output</Text>
        <Text style={styles.html}>{html}</Text>
        <Text style={styles.heading}>EnrichedText</Text>
        <EnrichedText style={styles.text}>{html}</EnrichedText>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // Explicit colors: the RN root window is white regardless of the system
    // appearance, while Text defaults to the semantic labelColor (white in
    // dark mode), which would make all labels invisible.
    backgroundColor: '#fff',
  },
  content: {
    padding: 16,
    gap: 12,
  },
  heading: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  toolbar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  button: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#8888',
  },
  buttonActive: {
    backgroundColor: '#4444',
  },
  buttonLabel: {
    fontSize: 14,
    color: '#000',
  },
  input: {
    minHeight: 120,
    borderWidth: 1,
    borderColor: '#8888',
    borderRadius: 8,
    padding: 8,
    fontSize: 16,
  },
  html: {
    fontFamily: 'Menlo',
    fontSize: 12,
    color: '#000',
  },
  text: {
    fontSize: 16,
  },
});
