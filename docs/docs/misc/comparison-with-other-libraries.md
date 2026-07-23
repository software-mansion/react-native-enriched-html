---
sidebar_position: 2
---

# Comparison with other libraries

Most rich text solutions for React Native fall into one of two camps: those
that embed a browser-based editor inside a `WebView`, and those that drive the
platform's native text components directly. React Native Enriched HTML belongs
to the second group, and that choice shapes almost everything about how it
performs and feels.

## WebView-based editors

WebView editors load an HTML/JavaScript rich text engine (often something like
Quill, ProseMirror, or a `contenteditable` surface) inside a web view and
bridge messages between it and your React Native code.

This approach is flexible - it reuses the mature web editing ecosystem - but it
comes with structural costs:

- **A browser in every editor.** Each editor spins up a full web view, with its
  own memory footprint and startup cost.
- **Bridge latency.** Every keystroke, selection change, and style toggle
  crosses the React Native ↔ web view boundary as a serialized message, which
  adds lag and opens the door to state desynchronization.
- **Foreign look and feel.** Text selection handles, the context menu, the
  keyboard, and scrolling are the web view's, not the platform's, so they rarely
  match the rest of your app.
- **Styling seams.** Fonts, insets, and system behaviours have to be
  re-created in CSS to approximate native components.

## React Native Enriched HTML

`EnrichedTextInput` and `EnrichedText` are **fully native** components built on
the New Architecture (Fabric). There is no web view and no HTML engine hidden
inside the editor.

- **Native performance.** The input styles text live, on the native side, as
  you type - there's no bridge round-trip per keystroke and no browser to boot.
- **Uncontrolled by design.** The input owns its content natively and you talk
  to it through a `ref`, so heavy rich text state never round-trips through
  JavaScript. See [Core concepts](/fundamentals/core-concepts) for the details.
- **Native UX for free.** Selection handles, the context menu, the keyboard,
  and accessibility come from the platform, so they behave exactly like every
  other input in your app.
- **HTML in, HTML out.** The editor produces a predictable, fixed set of tags,
  and the matching `EnrichedText` display component renders that HTML 1:1 - a
  shared styling API keeps editing and display visually identical.

## When a WebView editor might still fit

A native library trades some flexibility for speed and consistency. If you need
a feature the platform text systems don't offer yet (for example deeply nested
document structures or a plugin ecosystem specific to a web editor), a WebView
solution may still be the pragmatic choice. For the large majority of rich text
needs in a mobile app - comments, chat, notes, posts - a native component is
faster, lighter, and closer to the platform.

<!--
TODO: add a concrete feature-by-feature comparison table (performance,
bundle size, native UX, offline behaviour) once benchmark numbers and the
set of libraries to compare against are confirmed with the team.
-->
