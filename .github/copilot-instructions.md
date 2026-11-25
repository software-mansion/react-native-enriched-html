# Review instructions

Condensed from `.agents/skills/review-changes/` (code review + parity stages; no device testing).
Keep the two in sync. Copilot reads only the first 4,000 characters — keep this file short.

react-native-enriched ships one `EnrichedTextInput` / `EnrichedText` API on three
implementations: iOS (`ios/`), Android (`android/`), web (`src/web/`). Shared: TS API (`src/`),
HTML parser (`cpp/parser`). Lint, typecheck, tests and native formatting run in CI — don't
report what those catch.

## Feature parity (most important)

A change to one platform usually needs the same change on the others. For each behaviour the PR
touches, find its counterpart and check it behaves the same (defaults, edge cases, event
payloads, HTML output):

- styles: `ios/styles/*Style.mm` ↔ `android/**/textinput/styles/*.kt` + `spans/` ↔ `src/web/formats/Enriched*.ts`
- HTML parsing: `ios/{html,inputHtml,textHtml}Parser/` ↔ `android/**/common/parser/` ↔ `src/web/htmlExtensions/`, `sanitization/`, `normalization/` (+ `cpp/parser`)
- props/commands/events: `ios/EnrichedTextInputView.mm` ↔ Android view manager + `events/` ↔ `src/web/EnrichedTextInput.tsx`, `nativeMappers/`

Flag as a **parity gap** any platform that is missing the change or diverges, unless it is
listed in `docs/docs/misc/compatibility.mdx` / `known-limitations.md` or explained in the PR. A
bug fixed on one platform that still exists on another is a parity gap. An intentional but
undocumented difference: ask for a `compatibility.mdx` entry.

## Correctness

- Empty text; selection at start/end; collapsed vs ranged selection.
- Nested/overlapping styles; toggling a style across a boundary.
- Paragraph styles (lists, headings, blockquote, code block, checkbox, alignment) over several
  paragraphs, and Enter/Backspace at their edges.
- Undo/redo; paste of plain text and HTML; IME/composition.
- Emoji / surrogate pairs: UTF-16 offsets (JS) vs native indices.
- iOS: UIKit work off the main thread, retain cycles in blocks/delegates, `NSRange` bounds,
  `TARGET_OS_OSX` guards in shared code.
- Android: span flags, `SpannableStringBuilder` index math, watchers re-entering on their own
  edits, UI-thread access.
- Events: payload matches `src/spec/*NativeComponent.ts`; nothing emitted after unmount.

## HTML round trip

`value` → native → `getHTML()` must give equivalent HTML. New/changed tags or attributes must be
handled by the parsers, the normalizer and web sanitization; attribute values must be escaped.

## API surface

New/changed props, commands or events must appear in `src/types.ts`,
`src/spec/*NativeComponent.ts`, default props, and `docs/docs/api-reference/`. Call out breaking
changes. Unit-testable logic needs tests (`src/web/__tests__`, `cpp/tests`).

## How to comment

- Severity prefix: **blocker** (crash, data loss, HTML corruption), **major** (wrong behaviour,
  common edge case, parity gap), **minor** (rare edge case, missing test/docs).
- Point at the line, say what goes wrong and how to reproduce it, suggest a fix. For parity
  gaps, name the counterpart file that needs the change.
- No style nits, no praise, no summaries of what the PR does.
