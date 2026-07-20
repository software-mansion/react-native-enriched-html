---
sidebar_position: 1
---

# Styling the input

`EnrichedTextInput` is styled through two separate props. Together they cover
everything from the container's dimensions down to the color of a bullet point.

- **`style`** - the container's layouting behavior and its base typography (`fontSize`, `color`, `fontFamily`, …). It accepts a subset of React Native's `TextStyle`, described by
  `EnrichedInputStyle`.
- **`htmlStyle`** - the appearance of individual rich text elements: heading
  sizes, blockquote borders, code colors, list markers, mention colors, and so
  on.

```tsx
<EnrichedTextInput
  style={{
    fontSize: 16,
    color: '#232736',
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#eef0ff',
  }}
  htmlStyle={{
    h1: { fontSize: 28, bold: true },
    blockquote: { borderColor: '#57b495', borderWidth: 3 },
    code: { color: '#c026d3' },
  }}
/>
```

## `htmlStyle`

`htmlStyle` maps each supported element to a small config object. Anything you
omit falls back to the built-in default. The available keys are:

| Key          | Styles         | Notable options                                             |
| ------------ | -------------- | ----------------------------------------------------------- |
| `h1`–`h6`    | Headings       | `fontSize`, `bold`                                          |
| `blockquote` | Blockquote     | `borderColor`, `borderWidth`, `gapWidth`, `color`           |
| `codeblock`  | Code block     | `color`, `backgroundColor`, `borderRadius`                  |
| `code`       | Inline code    | `color`, `backgroundColor`                                  |
| `a`          | Links          | `color`, `textDecorationLine`                               |
| `mention`    | Mentions       | `color`, `backgroundColor`, `textDecorationLine`            |
| `ol`         | Ordered list   | `markerColor`, `markerFontWeight`, `marginLeft`, `gapWidth` |
| `ul`         | Unordered list | `bulletColor`, `bulletSize`, `marginLeft`, `gapWidth`       |
| `ulCheckbox` | Checkbox list  | `boxColor`, `boxSize`, `marginLeft`, `gapWidth`             |

The full list of properties, defaults, and platform notes lives in the
`EnrichedTextInput` reference.

### Styling mentions per indicator

`mention` accepts either a single config applied to every mention, or a record
keyed by [indicator](/rich-text-formatting/mentions) so each mention type gets
its own look:

```tsx
htmlStyle={{
  mention: {
    '@': { color: '#2563eb', backgroundColor: '#dbeafe' },
    '#': { color: '#16a34a', backgroundColor: '#dcfce7' },
  },
}}
```

:::tip

You can also create a default `mention` style config, by using the `'default'` key.

```tsx
htmlStyle={{
  mention: {
    'default': { color: '#2563eb', backgroundColor: '#dbeafe' },
    '#': { color: '#16a34a', backgroundColor: '#dcfce7' },
  },
}}
```

This way you can create a style for any mention indicator to fallback if it doesn't have one fully defined.

:::
