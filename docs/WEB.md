# Web Support (Experimental)

Web support is still experimental. APIs and behavior can change in future releases without a major version bump. Expect breaking changes until the web path is stabilized.

## Enriched Text Input

### What works

- Inline marks: bold, italic, underline, strikethrough, inline code
- Headings (h1-h6)
- Blockquote, code block
- Ordered lists, unordered lists, checkbox lists
- Images (via `setImage` ref method and optional `onPasteImages` when pasting image data)
- Manual links (via `setLink` ref method)
- Mentions
- Automatic link detection
- `getHTML`, `setValue`, selection mapping
- Core callbacks: `onChange`, `onChangeState`, `onFocus`, `onBlur`, `onSelectionChange`
- Submit props: `submitBehavior` and `onSubmitEditing`. `returnKeyType` is only a hint, it maps to [enterkeyhint](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/enterkeyhint) (`done`, `go`, `next`, `previous`, `search`, `send`, `default`/`enter`). Not all values of `ReturnKeyTypeOptions` are supported, the behavior of this prop is heavily dependent on the browser's capabilities.
- Input theming via `placeholderTextColor`, `cursorColor` and `selectionColor` props
- Keyboard shortcuts for formatting
- `useHtmlNormalizer`
- Setting text alignment via `setTextAlignment()`

### Keyboard shortcuts

See [Web Keyboard Shortcuts](./INPUT_API_REFERENCE.md#web-keyboard-shortcuts) for the up-to-date list of Web keyboard shortcuts.

### Unsupported

- **`returnKeyLabel`**: ignored on web, it's not possible to set it inside a browser.
- **Context menu**: `contextMenuItems` is ignored.
- **RN layout ref methods**: `measure`, `measureInWindow`, `measureLayout`, and `setNativeProps` are no-ops.
- **`ViewProps`**: Props inherited from `View` beyond the implemented subset are not forwarded.
- **`textShortcuts`**: ignored on web.

## Enriched Text

### What works

- Customizing the styling using props: `style`, `htmlStyle`, `selectionColor`.
- `selectable` prop
- `useHtmlNormalizer`

### Unsupported

- **`ellipsizeMode`**: ignored on web.
- **`numberOfLines`**: ignored on web.
- **Press events**: `onLinkPress` and `onMentionPress` callbacks are ignored on web.
- **RN layout ref methods**: `measure`, `measureInWindow`, `measureLayout`, and `setNativeProps` are no-ops.

## HTML sanitization

You are responsible for sanitizing HTML on both input and output. The library does not guarantee safe or clean HTML output. This applies to any HTML you persist, render elsewhere, or accept from untrusted sources (XSS, paste attacks, etc.).
