---
sidebar_position: 4
---

# Custom context menu

The `contextMenuItems` prop lets you add your own actions to the native
text-selection menu - the popover that e.g. shows **Copy / Paste / Cut** when the
user long-presses selected text.

:::info

This is a **native-only** feature (iOS and Android) - which
is why this page has no live preview. To see it in action, run the snippet below in the
[example app](https://github.com/software-mansion/react-native-enriched).

:::

## The shape of an item

```ts
interface ContextMenuItem {
  text: string; // the label shown in the menu
  visible?: boolean; // whether to show it (defaults to true)
  onPress: (args: {
    text: string; // the currently selected text
    selection: { start: number; end: number }; // its range
    styleState: OnChangeStateEvent; // active styles
  }) => void;
}
```

Every `onPress` receives the same three-field payload, resolved at the moment
the item is tapped:

- **`text`** - the selected text.
- **`selection`** - the `start` and `end` offsets of the selection.
- **`styleState`** - the latest style state, the same object you get from
  `onChangeState`.

`visible` is read when the menu opens, so you can drive it from state to show an
item only in the right context.

## Example

This editor adds three items. The first two read the selection payload and run an
editor command. The third links the selection, so it's only shown via `visible`
when there's actually a ranged selection to link:

```tsx
import { EnrichedTextInput } from 'react-native-enriched-html';
import type {
  ContextMenuItem,
  EnrichedTextInputInstance,
  OnChangeSelectionEvent,
} from 'react-native-enriched-html';
import { useMemo, useRef, useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';

export default function App() {
  const ref = useRef<EnrichedTextInputInstance>(null);
  const [selection, setSelection] = useState<OnChangeSelectionEvent | null>(
    null
  );

  const hasRangedSelection = !!selection && selection.start !== selection.end;

  const contextMenuItems: ContextMenuItem[] = useMemo(
    () => [
      {
        // `text` and `selection` describe what the user long-pressed.
        text: 'Show selection',
        onPress: ({ text, selection: range }) => {
          Alert.alert(
            'Selection',
            `"${text}" at [${range.start}, ${range.end}]`
          );
        },
      },
      {
        // Menu items can call any editor command through the ref.
        text: 'Bold',
        onPress: () => {
          ref.current?.toggleBold();
        },
      },
      {
        // Only useful with a ranged selection, so hide it otherwise; when
        // shown, `selection` lets you target the exact range you were given.
        text: 'Link to Software Mansion',
        visible: hasRangedSelection,
        onPress: ({ text, selection: range }) => {
          ref.current?.setLink(
            range.start,
            range.end,
            text,
            'https://swmansion.com'
          );
        },
      },
    ],
    [hasRangedSelection]
  );

  return (
    <View style={styles.container}>
      <EnrichedTextInput
        ref={ref}
        style={styles.input}
        placeholder="Select some text, then long-press it..."
        contextMenuItems={contextMenuItems}
        onChangeSelection={(e) => setSelection(e.nativeEvent)}
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
```

:::note

Item placement differs per platform. On **iOS** your items appear in array
order, before the system items (Copy/Paste/Cut). On **Android** there is no
guaranteed order, and depending on the device manufacturer your items may be
tucked into an overflow submenu.

:::
