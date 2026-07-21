---
sidebar_position: 2
---

# EnrichedText

`EnrichedText` is a read-only component that renders rich text from an HTML string.
It accepts the same HTML format produced by [`EnrichedTextInput`](/api-reference/enriched-text-input).

## Reference

```tsx
import { EnrichedText } from 'react-native-enriched-html';

function App() {
  return (
    <EnrichedText style={{ fontSize: 16 }}>
      {'<p>Hello <b>world</b></p>'}
    </EnrichedText>
  );
}
```

<details>
<summary>Type definitions</summary>

```ts
interface EnrichedTextProps extends ViewProps {
  children: string;
  style?: TextStyle;
  htmlStyle?: EnrichedTextHtmlStyle;
  useHtmlNormalizer?: boolean;
  ellipsizeMode?: 'head' | 'middle' | 'tail' | 'clip';
  numberOfLines?: number;
  selectable?: boolean;
  selectionColor?: ColorValue;
  allowFontScaling?: boolean;
  onLinkPress?: (event: OnLinkPressEvent) => void;
  onMentionPress?: (event: OnMentionPressEvent) => void;
}
```

</details>

## Props

### `allowFontScaling` <Optional /> {#allowfontscaling}

If `true`, the text respects the system's accessibility font scaling settings.

| Type      | Default | Platforms    |
| --------- | ------- | ------------ |
| `boolean` | `true`  | Android, iOS |

### `children` {#children}

The HTML string to render. Accepts the HTML format produced by
[`EnrichedTextInput`](/api-reference/enriched-text-input). See
[Supported tags](/fundamentals/html-format-and-supported-tags) for the full tag set.

| Type     | Default | Platforms         |
| -------- | ------- | ----------------- |
| `string` | —       | Android, iOS, Web |

### `style` {#style}

Standard React Native `TextStyle` applied to the text.

| Type        | Default | Platforms         |
| ----------- | ------- | ----------------- |
| `TextStyle` | —       | Android, iOS, Web |

### `htmlStyle` {#htmlstyle}

Customizes styles of HTML elements, including press colors for interactive
elements. See [`EnrichedTextHtmlStyle`](#enrichedtexthtmlstyle-type).

| Type                    | Default | Platforms         |
| ----------------------- | ------- | ----------------- |
| `EnrichedTextHtmlStyle` | —       | Android, iOS, Web |

### `useHtmlNormalizer` <Optional /> {#usehtmlnormalizer}

If `true`, external HTML (for example from Google Docs, Word, or web pages) is
normalized before rendering. This converts arbitrary HTML into the canonical
tag subset that the enriched parser understands. See
[Normalization](/fundamentals/core-concepts#normalization).

| Type      | Default | Platforms         |
| --------- | ------- | ----------------- |
| `boolean` | `true`  | Android, iOS, Web |

### `ellipsizeMode` <Optional /> {#ellipsizemode}

How the text should be truncated when `numberOfLines` is set and the text overflows.

- `head` — truncates at the beginning, e.g. `...wxyz`
- `middle` — truncates in the middle, e.g. `ab...yz`
- `tail` — truncates at the end, e.g. `abcd...`
- `clip` — clips the text without inserting an ellipsis

| Type                                     | Default  | Platforms    |
| ---------------------------------------- | -------- | ------------ |
| `'head' \| 'middle' \| 'tail' \| 'clip'` | `'tail'` | Android, iOS |

:::note

On Android, when `numberOfLines` is set to a value higher than `1`, only
`tail` works correctly.

:::

### `numberOfLines` <Optional /> {#numberoflines}

Limits the number of displayed lines. Set to `0` for unlimited lines.

| Type     | Default | Platforms    |
| -------- | ------- | ------------ |
| `number` | `0`     | Android, iOS |

### `selectable` <Optional /> {#selectable}

If `true`, the text can be selected by the user (for example for copy/paste).

| Type      | Default | Platforms         |
| --------- | ------- | ----------------- |
| `boolean` | `false` | Android, iOS, Web |

### `selectionColor` <Optional /> {#selectioncolor}

The color of the text selection highlight.

| Type                                           | Default        | Platforms         |
| ---------------------------------------------- | -------------- | ----------------- |
| [`color`](https://reactnative.dev/docs/colors) | system default | Android, iOS, Web |

### `onLinkPress` <Optional /> {#onlinkpress}

Called when the user presses a link element. Receives an `OnLinkPressEvent`
containing the link's URL.

```ts
interface OnLinkPressEvent {
  url: string;
}
```

| Type                                | Default | Platforms         |
| ----------------------------------- | ------- | ----------------- |
| `(event: OnLinkPressEvent) => void` | —       | Android, iOS, Web |

### `onMentionPress` <Optional /> {#onmentionpress}

Called when the user presses a mention element. Receives an
`OnMentionPressEvent` with the mention's text, indicator character, and custom
attributes.

```ts
interface OnMentionPressEvent {
  text: string;
  indicator: string;
  attributes: Record<string, string>;
}
```

| Type                                   | Default | Platforms         |
| -------------------------------------- | ------- | ----------------- |
| `(event: OnMentionPressEvent) => void` | —       | Android, iOS, Web |

## EnrichedTextHtmlStyle type

Extends [`HtmlStyle`](/api-reference/enriched-text-input#htmlstyle-type) with
additional press-state styling for interactive elements. All properties from
`HtmlStyle` are supported except `a` and `mention`, which are replaced by the
extended versions below.

```ts
interface EnrichedTextHtmlStyle extends Omit<HtmlStyle, 'a' | 'mention'> {
  a?: {
    color?: ColorValue;
    textDecorationLine?: 'underline' | 'none';
    pressColor?: ColorValue;
  };
  mention?:
    | Record<string, EnrichedTextMentionStyleProperties>
    | EnrichedTextMentionStyleProperties;
}

interface EnrichedTextMentionStyleProperties {
  color?: ColorValue;
  backgroundColor?: ColorValue;
  textDecorationLine?: 'underline' | 'none';
  pressColor?: ColorValue;
  pressBackgroundColor?: ColorValue;
}
```

### a (link)

Inherits all properties from [`HtmlStyle`'s `a`](/api-reference/enriched-text-input#a-link)
and adds:

- `pressColor` — the color of the link text while it is being pressed. Takes a
  [color](https://reactnative.dev/docs/colors) value.

### mention

Inherits all properties from
[`HtmlStyle`'s `mention`](/api-reference/enriched-text-input#mention) and adds:

- `pressColor` — the color of the mention text while it is being pressed. Takes
  a [color](https://reactnative.dev/docs/colors) value.
- `pressBackgroundColor` — the background color of the mention while it is being
  pressed. Takes a [color](https://reactnative.dev/docs/colors) value.

Same as in `HtmlStyle`, if only a single config is given the style applies to
all mention types. To style each indicator separately, pass a record with
indicators as keys and configs as values.

## Remarks

- `EnrichedText` is read-only. Use [`EnrichedTextInput`](/api-reference/enriched-text-input)
  when the user needs to edit content.
- Pass the HTML string as `children`, not as a `value` prop.
- Sanitizing HTML is your responsibility. See
  [Core concepts](/fundamentals/core-concepts#html-is-the-source-of-truth).

## Platform compatibility

<PlatformCompatibility android ios web />
