# Styling the input

`EnrichedTextInput` is styled through two separate props. Together they cover
everything from the container's dimensions down to the color of a bullet point.

* **`style`** - the container's layout behavior and its base typography (`fontSize`, `color`, `fontFamily`, …). It accepts a subset of React Native's `TextStyle`, described by
  `EnrichedInputStyle`.
* **`htmlStyle`** - the appearance of individual rich text elements: heading
  sizes, blockquote borders, code colors, list markers, mention colors, and so
  on.
* **`placeholderTextColor`** - the color of the placeholder text.
* **`selectionColor`** - the color of the text selection highlight.
* **`cursorColor`** - the color of the text cursor.

> **Note**
>
> `cursorColor` is not supported on iOS. For more platform differences, see [Compatibility](/misc/compatibility).

Here's an interactive live example - edit the `style` and `htmlStyle` values below and the preview updates live.
You can also check the full API reference for `htmlStyle` and `style`, come back and experiment around here.

```jsx live
function StylingExample() {
  return (
    <EnrichedTextInput
      defaultValue="<h1>Heading</h1><ul><li>list with <code>inline code</code></li></ul><blockquote>Blockquote</blockquote><codeblock>codeblock</codeblock>"
      style={{
        fontSize: 16,
        color: '#232736',
        padding: 12,
        borderRadius: 12,
        backgroundColor: '#eef0ff',
      }}
      htmlStyle={{
        h1: { fontSize: 28, bold: true },
        ul: { bulletColor: 'cyan', bulletSize: 8 },
        code: { color: 'red', backgroundColor: 'yellow' },
        blockquote: { borderColor: '#57b495', borderWidth: 3 },
        codeblock: { color: 'aquamarine', backgroundColor: '#67c4a5'}
      }}
    />
  );
}
```

## `style`

`style` accepts a subset of React Native's `TextStyle` - layout, appearance,
and base typography - described by `EnrichedInputStyle`. Most of these map directly
to their React Native `TextStyle` counterparts. Some are platform-limited
(e.g. `shadowColor` is iOS-only, `elevation` is Android-only) - see the
[`EnrichedTextInput`](/api-reference/enriched-text-input#style) reference for the full property list.

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
[`EnrichedTextInput`](/api-reference/enriched-text-input#htmlstyle) reference.

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

> **Tip**
>
> You can also create a default `mention` style config, by using the `'default'` key.
>
> ```tsx
> htmlStyle={{
>   mention: {
>     'default': { color: '#2563eb', backgroundColor: '#dbeafe' },
>     '#': { color: '#16a34a', backgroundColor: '#dcfce7' },
>   },
> }}
> ```
>
> This way you can create a style for any mention indicator to fallback if it doesn't have one fully defined.
