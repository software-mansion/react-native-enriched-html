# Stage 1 — Code review

Read every changed hunk plus enough surrounding code to understand it. Check each item that the
diff could plausibly affect.

## Editor behaviour

- Empty text; selection at the very start / end; collapsed vs ranged selection.
- Nested and overlapping styles; toggling a style on/off across a boundary.
- Paragraph styles (lists, headings, blockquote, code block, checkbox, alignment) when the
  selection spans several paragraphs, and when pressing Enter / Backspace at their edges.
- Undo / redo.
- Paste: plain text and HTML; pasting into a styled range.
- IME / composition input, autocorrect, dictation.
- Emoji and other surrogate pairs — UTF-16 offsets (JS) vs native indices.
- Very long text and fast typing (performance, debounced events).

## Native code

- iOS: main-thread-only UIKit work, retain cycles in blocks/delegates, `NSRange` bounds,
  `TARGET_OS_OSX` guards if shared code is touched (macOS port).
- Android: span flags (`SPAN_EXCLUSIVE_EXCLUSIVE` etc.), `SpannableStringBuilder` index math,
  watchers re-entering on their own edits, UI-thread access.
- Events: payload shape matches `src/spec/*NativeComponent.ts`; no emission after unmount.

## HTML round trip

- `value` → native → `getHTML()` returns equivalent HTML.
- New/changed tags or attributes are handled by the parser (`cpp/parser`, platform parsers),
  the normalizer (`src/utils/normalizeHtmlStyle.ts`, `src/web/normalization/`) and web
  sanitization (`src/web/sanitization/`).
- Attribute values are escaped.

## API surface

- New/changed prop, command or event is in `src/types.ts`, `src/spec/*NativeComponent.ts`,
  default props (`src/utils/EnrichedTextInputDefaultProps.ts`) and
  `docs/docs/api-reference/*`.
- Breaking changes are called out.

## Tests

- Logic that can be unit tested has tests: `src/web/__tests__`, `cpp/tests`, jest.
