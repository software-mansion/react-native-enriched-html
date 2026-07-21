import { EnrichedTextInput } from 'react-native-enriched-html';
import type {
  EnrichedTextInputInstance,
  HtmlStyle,
  OnChangeMentionEvent,
} from 'react-native-enriched-html';
import { useMemo, useRef, useState } from 'react';
import { View, StyleSheet, Pressable, Text, Platform } from 'react-native';

type Suggestion = { id: string; name: string };

// On web, a tap outside the editor blurs it and ends the active mention before
// `onPress` fires - so `setMention` would do nothing. Preventing the default
// mousedown keeps focus in the editor. It's a no-op on native, where tapping a
// Pressable never steals focus.
const keepEditorFocused: any =
  Platform.OS === 'web'
    ? { onMouseDown: (e: { preventDefault(): void }) => e.preventDefault() }
    : null;

const USERS: Suggestion[] = [
  { id: 'u1', name: 'John Doe' },
  { id: 'u2', name: 'Jane Smith' },
  { id: 'u3', name: 'Alice Johnson' },
  { id: 'u4', name: 'Bob Brown' },
];

const CHANNELS: Suggestion[] = [
  { id: 'c1', name: 'general' },
  { id: 'c2', name: 'engineering' },
  { id: 'c3', name: 'random' },
  { id: 'c4', name: 'announcements' },
];

// Each mention kind is styled by its indicator.
const htmlStyle: HtmlStyle = {
  mention: {
    '@': {
      color: '#2b7a4b',
      backgroundColor: '#d8f3e3',
      textDecorationLine: 'none',
    },
    '#': {
      color: '#2b5f9e',
      backgroundColor: '#d8e6f9',
      textDecorationLine: 'none',
    },
  },
};

export default function App() {
  const ref = useRef<EnrichedTextInputInstance>(null);
  // The indicator of the mention being edited ('@' | '#'), or null when idle.
  const [indicator, setIndicator] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const suggestions = useMemo(() => {
    if (indicator === null) return [];
    const source = indicator === '#' ? CHANNELS : USERS;
    const q = query.toLowerCase();
    return source.filter(item => item.name.toLowerCase().startsWith(q));
  }, [indicator, query]);

  const openPicker = (nextIndicator: string) => {
    setIndicator(nextIndicator);
    setQuery('');
  };

  const closePicker = () => {
    setIndicator(null);
    setQuery('');
  };

  const pick = (item: Suggestion) => {
    if (indicator === null) return;
    // Replaces the "@jo" / "#gen" the user typed with a finished mention.
    ref.current?.setMention(indicator, `${indicator}${item.name}`, {
      id: item.id,
    });
    closePicker();
  };

  return (
    <View style={styles.container}>
      <EnrichedTextInput
        ref={ref}
        style={styles.input}
        htmlStyle={htmlStyle}
        placeholder="Type '@' for people or '#' for channels..."
        mentionIndicators={['@', '#']}
        onStartMention={openPicker}
        onChangeMention={({ indicator: ind, text }: OnChangeMentionEvent) => {
          setIndicator(ind);
          setQuery(text);
        }}
        onEndMention={closePicker}
      />
      {suggestions.length > 0 && (
        <View style={styles.picker}>
          {suggestions.map(item => (
            <Pressable
              key={item.id}
              {...keepEditorFocused}
              style={styles.row}
              onPress={() => pick(item)}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{indicator}</Text>
              </View>
              <Text style={styles.rowText}>{item.name}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 8 },
  input: {
    fontSize: 18,
    color: '#232736',
    padding: 12,
    borderRadius: 12,
    minHeight: 96,
    backgroundColor: '#eef0ff',
  },
  picker: {
    borderWidth: 1,
    borderColor: '#dfe3f5',
    borderRadius: 12,
    backgroundColor: '#ffffff',
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  badge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eef0ff',
  },
  badgeText: {
    color: '#5b6bb0',
    fontWeight: '600',
  },
  rowText: {
    fontSize: 16,
    color: '#232736',
  },
});
