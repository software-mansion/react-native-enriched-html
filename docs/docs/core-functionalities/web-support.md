---
sidebar_position: 4
---

# Web support

Both `EnrichedTextInput` and `EnrichedText` run on the web. On native the editor
is backed by the platform's text engine; on the web it is built on
[Tiptap](https://tiptap.dev/) (on top of ProseMirror). That implementation
detail stays behind the same public API.

## One API across platforms

The web build exposes the **same props, ref methods, and events** as native.
Events keep their native shape too - they arrive as
`NativeSyntheticEvent`, read off `e.nativeEvent`, so
[event-handling](/core-functionalities/handling-events) code is portable as-is:

```tsx
<EnrichedTextInput
  onChangeHtml={e => setHtml(e.nativeEvent.value)}
  onChangeState={e => setState(e.nativeEvent)}
/>
```

The interactive examples throughout these docs are the web build running live.

## Keyboard shortcuts

The web editor ships desktop-style formatting shortcuts out of the box, along
with native browser **undo/redo**. `Mod` is `⌘` on macOS and `Ctrl` on
Windows/Linux.

| Action              | macOS          | Windows / Linux             |
| ------------------- | -------------- | --------------------------- |
| Bold                | `⌘B`           | `Ctrl+B`                    |
| Italic              | `⌘I`           | `Ctrl+I`                    |
| Underline           | `⌘U`           | `Ctrl+U`                    |
| Strikethrough       | `⌘⇧X`          | `Ctrl+Shift+X`              |
| Inline code         | `⌘⇧C`          | `Ctrl+Shift+C`              |
| Code block          | `⌘⌥⇧C`         | `Ctrl+Alt+Shift+C`          |
| Normal paragraph    | `⌘⌥0`          | `Ctrl+Alt+0`                |
| Heading 1–6         | `⌘⌥1` – `⌘⌥6`  | `Ctrl+Alt+1` – `Ctrl+Alt+6` |
| Numbered list       | `⌘⇧7`          | `Ctrl+Shift+7`              |
| Unordered list      | `⌘⇧8`          | `Ctrl+Shift+8`              |
| Checkbox list       | `⌘⇧9`          | `Ctrl+Shift+9`              |
| Paste as plain text | `⌘⇧V`          | `Ctrl+Shift+V`              |
| Undo                | `⌘Z`           | `Ctrl+Z`                    |
| Redo                | `⌘⇧Z`          | `Ctrl+Shift+Z`              |
| Select all          | `⌘A`           | `Ctrl+A`                    |

## Platform differences

A few native-only features have no web equivalent and are ignored there:

- **`contextMenuItems`** - the native editing menu isn't available; use your own
  UI instead.
- **`returnKeyLabel`** - can't be set inside a browser. `returnKeyType` maps to
  the browser's [`enterkeyhint`](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/enterkeyhint).
- **RN layout ref methods** - `measure`, `measureInWindow`, `measureLayout`, and
  `setNativeProps` are no-ops.

The [`EnrichedTextInput`](/api-reference/enriched-text-input) and
[`EnrichedText`](/api-reference/enriched-text) references note per-prop platform
support.

:::note

On web, `onPasteImages` gives each image a `blob:` URL. If you hold onto those
URIs, call `URL.revokeObjectURL(uri)` once you're done with them (e.g. after an
upload) so the browser can release the memory.

:::

## Sanitization

Unlike the native platforms, the web build sanitizes HTML for you. It runs
[DOMPurify](https://github.com/cure53/DOMPurify) at **every entrypoint** - the
`children` of `EnrichedText`, and `defaultValue`, `setValue`, and pasted content
on `EnrichedTextInput`. Sanitization is also run on the input component's **output** - `getHtml()`.
All of it makes that untrusted markup can't inject scripts or unsafe attributes into the DOM.

:::caution

Sanitization is tied to link detection: the [`linkRegex`](/rich-text-formatting/links)
you provide determines which `href` values are allowed to survive on `<a>`
elements. Anchors whose URLs don't match the pattern have their `href` stripped
during sanitization.

:::

## Server-side rendering

The library does **not** support SSR. Normalization and sanitization both need a
DOM to work against, which isn't available during server rendering. In an SSR
framework (Next.js, Remix, …), make sure both `EnrichedTextInput` and
`EnrichedText` render **client-side only**.
