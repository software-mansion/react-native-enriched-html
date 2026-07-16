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
- `onLinkPress` and `onMentionPress` callbacks

### Unsupported

- **`ellipsizeMode`**: ignored on web.
- **`numberOfLines`**: ignored on web.
- **RN layout ref methods**: `measure`, `measureInWindow`, `measureLayout`, and `setNativeProps` are no-ops.

## HTML sanitization

On web, HTML is sanitized automatically with [DOMPurify](https://github.com/cure53/DOMPurify) on both input and output. This reduces XSS risk, but you should still treat untrusted HTML with caution and apply your own server-side sanitization.

- **`EnrichedText`** sanitizes its `children` before rendering.
- **`EnrichedTextInput`** sanitizes every HTML entry point — `defaultValue`, the `setValue` ref method, and pasted HTML — as well as its output from `getHTML` and the `onChangeHtml` callback.

### Custom mention attributes

To attach custom data to a mention, use the `data-` prefix (e.g. `data-user-id`) to make sure they survive sanitization. Attributes passed to the `setMention` ref method are properly sanitized.

## Client-only rendering (no SSR)

Both `EnrichedText` and `EnrichedTextInput` are **client-only** components. They rely on browser-only APIs (`DOMParser`, `DOMPurify`, `TipTap`) and are **not designed for server-side rendering (SSR)**.

If your application uses SSR (Next.js, Remix, Gatsby, etc.), make sure these components only render on the client.
