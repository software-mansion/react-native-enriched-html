# Stage 3 — Feature parity (iOS / Android / web)

react-native-enriched ships the same `EnrichedTextInput` / `EnrichedText` API on three
implementations. A change on one is usually needed on the others. Shared pieces: TS API in
`src/`, HTML parser in `cpp/` (used by native).

## Where each feature lives

| Area | iOS | Android | Web |
| --- | --- | --- | --- |
| Input component | `ios/EnrichedTextInputView.mm`, `ios/enrichedInputTextView/`, `ios/inputAttributesManager/` | `android/.../enriched/textinput/` (view, `watchers/`, `events/`) | `src/web/EnrichedTextInput.tsx`, `src/web/pmPlugins/`, `src/web/tiptapWatchers/` |
| Text (read-only) component | `ios/EnrichedTextView.mm`, `ios/enrichedTextTextView/` | `android/.../enriched/text/` | `src/web/EnrichedText.tsx`, `EnrichedText.css` |
| Styles (bold, lists, headings, links, mentions, images, code, blockquote, checkbox, alignment, custom) | `ios/styles/*Style.mm` | `android/.../textinput/styles/*.kt`, `spans/`, `common/spans/` | `src/web/formats/Enriched*.ts`, `formatRules.ts` |
| HTML parse / serialize | `ios/htmlParser/`, `ios/inputHtmlParser/`, `ios/textHtmlParser/`, `cpp/parser` | `android/.../common/parser/`, `cpp/parser` | `src/web/htmlExtensions/`, `src/web/sanitization/`, `src/web/normalization/` |
| Props / events / commands | `ios/EnrichedTextInputView.mm` (`updateProps`, command handlers) | view manager + `events/` | `src/web/EnrichedTextInput.tsx`, `src/web/nativeMappers/` |
| Shared API | `src/types.ts`, `src/spec/*NativeComponent.ts`, `src/native/*.tsx`, `src/utils/` | same | same |

Paths are starting points — grep for the style/prop/command name across `ios/ android/ src/web/`
to find the real counterpart.

## Procedure

1. List the behaviours the change touches (a style, a prop, a command, an event, parsing of a
   tag, keyboard handling, ...). One row each.
2. For each row and each platform, find the code that implements it **after** the change:
   - changed in this diff → check it does the same thing as the other platforms (same defaults,
     same edge-case handling, same emitted event payload and HTML output);
   - not changed → read the existing code and decide whether it already behaves the same or now
     diverges. A bug fixed on one platform is a parity gap if the same bug exists on another.
3. New/changed prop, command or event: it must be in `src/spec/*NativeComponent.ts` (native),
   handled on iOS **and** Android, mapped on web (or intentionally no-op with a reason), typed in
   `src/types.ts`, and documented in `docs/docs/api-reference/`.
4. Mark each cell:
   - ✅ `code` (verified by reading) / ✅ `code+device` (also confirmed with Argent)
   - ❌ missing or behaves differently — say how
   - ➖ n/a — not meaningful on that platform; cite the entry in
     `docs/docs/misc/compatibility.mdx` or `known-limitations.md` if it's a known gap
   - ❓ couldn't determine — explain; treat as a finding to resolve, not a pass
5. Severity: undocumented ❌ → `major` "parity gap"; intentional but undocumented ➖ → `minor`
   (add to `compatibility.mdx`); ❓ → `minor` unless it hides a likely bug.
6. Note macOS (`react-native-macos`, in-progress port) only if the diff touches shared iOS code
   guarded by `TARGET_OS_OSX` / `RCT_*` platform macros.
