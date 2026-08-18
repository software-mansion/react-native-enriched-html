import { EnrichedTextInput } from 'react-native-enriched-html';
import type {
  EnrichedTextInputInstance,
  HtmlStyle,
  OnChangeMentionEvent,
} from 'react-native-enriched-html';
import { useMemo, useRef, useState } from 'react';
import { View, StyleSheet, Pressable, Text, Platform } from 'react-native';

type Emoji = { shortcode: string; char: string };

// On web, a tap outside the editor blurs it and ends the active mention before
// `onPress` fires - so `setMention` would do nothing. Preventing the default
// mousedown keeps focus in the editor. It's a no-op on native, where tapping a
// Pressable never steals focus.
const keepEditorFocused: { onMouseDown: (e: React.MouseEvent) => void } | null =
  Platform.OS === 'web'
    ? { onMouseDown: (e: { preventDefault(): void }) => e.preventDefault() }
    : null;

const EMOJIS: Emoji[] = [
  { shortcode: 'smile', char: '😄' },
  { shortcode: 'heart', char: '❤️' },
  { shortcode: 'fire', char: '🔥' },
  { shortcode: 'rocket', char: '🚀' },
];

export default function App() {
  const ref = useRef<EnrichedTextInputInstance>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const suggestions = useMemo(() => {
    if (!open) return [];
    return EMOJIS.filter(emoji =>
      emoji.shortcode.startsWith(query.toLowerCase())
    );
  }, [open, query]);

  const openPicker = () => {
    setOpen(true);
    setQuery('');
  };

  const closePicker = () => {
    setOpen(false);
    setQuery('');
  };

  const updateQuery = ({ text }: OnChangeMentionEvent) => {
    setOpen(true);
    setQuery(text);

    if (text.endsWith(':')) {
      const strippedQuery = text.slice(0, text.length - 1);
      const autoChosenEmoji = EMOJIS.find(
        emoji => emoji.shortcode === strippedQuery
      );
      if (autoChosenEmoji) {
        pick(autoChosenEmoji);
      }
    }
  };

  const pick = (emoji: Emoji) => {
    // Replaces the ":smile" the user typed with the emoji glyph.
    ref.current?.setMention(':', emoji.char, {
      'data-shortcode': emoji.shortcode,
    });
    closePicker();
  };

  return (
    <View style={styles.container}>
      <EnrichedTextInput
        ref={ref}
        style={styles.input}
        htmlStyle={htmlStyle}
        placeholder="Type ':' then a name, e.g. :smile"
        mentionIndicators={[':']}
        onStartMention={openPicker}
        onChangeMention={updateQuery}
        onEndMention={closePicker}
      />
      {suggestions.length > 0 && (
        <View style={styles.picker}>
          {suggestions.map(emoji => (
            <Pressable
              key={emoji.shortcode}
              {...keepEditorFocused}
              style={styles.row}
              onPress={() => pick(emoji)}>
              <Text style={styles.emoji}>{emoji.char}</Text>
              <Text style={styles.shortcode}>:{emoji.shortcode}:</Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

// The emoji glyph is the whole mention, so keep it visually plain.
const htmlStyle: HtmlStyle = {
  mention: {
    ':': {
      color: '#232736',
      backgroundColor: 'transparent',
      textDecorationLine: 'none',
    },
  },
};

const styles = StyleSheet.create({
  container: { position: 'relative' },
  input: {
    fontSize: 18,
    color: '#232736',
    padding: 12,
    marginBottom: 186,
    borderRadius: 12,
    minHeight: 96,
    backgroundColor: '#eef0ff',
  },
  picker: {
    position: 'absolute',
    top: 110,
    width: '100%',
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
  emoji: {
    fontSize: 20,
    width: 28,
    textAlign: 'center',
  },
  shortcode: {
    fontSize: 16,
    color: '#5b6bb0',
  },
});
