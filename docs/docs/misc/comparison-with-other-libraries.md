---
sidebar_position: 2
---

# Comparison with other libraries

React Native doesn't ship a built-in rich text component, so a number of
community libraries exist. They fall into two broad categories: **native
implementations** that render directly through the platform's text system, and
**WebView wrappers** that embed a browser-based editor. This page compares
React Native Enriched HTML with the most popular alternatives in each
category.

## Native solutions

### React Native Aztec

[React Native Aztec](https://github.com/wordpress-mobile/react-native-aztec)
was WordPress's native rich text component for Gutenberg Mobile. The repository
was **archived in March 2025** and the code folded into the
[Gutenberg monorepo](https://github.com/WordPress/gutenberg), where activity
is focused on the WordPress editor itself rather than the standalone React
Native wrapper. Aztec **does not support the New Architecture (Fabric)** and is
dual-licensed under **GPL-2.0 / MPL-2.0** - both are copyleft licenses that
may require you to distribute your own source code under the same terms,
which can be a deal-breaker for proprietary apps.

### React Native Enriched Markdown

[React Native Enriched Markdown](https://github.com/software-mansion/react-native-enriched-markdown)
is another fully native library from Software Mansion (MIT-licensed, New
Architecture required). It focuses on **Markdown** rather than HTML:

- **Text component** - renders a wide range of Markdown features natively,
  including GFM tables, task lists, LaTeX math and spoiler text.
- **Text input** - provides a rich editing experience with Markdown output.

The key difference is the **content format**. Enriched Markdown targets apps
that work with Markdown end-to-end, while Enriched HTML is built for apps that
need an **HTML-based editor with advanced, customisable formatting
capabilities** and a matching display component. The two libraries can coexist in one app if you need both formats.

## WebView-based solutions

### 10tap Editor

[10tap Editor](https://github.com/10play/10tap-editor) wraps
[TipTap](https://tiptap.dev) (ProseMirror) inside a React Native WebView.
It offers a keyboard-aware toolbar and a familiar ProseMirror plugin system.

### React Native Pell Rich Editor

[React Native Pell Rich Editor](https://github.com/wxik/react-native-rich-editor)
is a lightweight WebView-based editor that uses `contentEditable` and
`document.execCommand`.

### Why native matters

All WebView-based editors share a set of inherent trade-offs compared to a
fully native approach:

|                          | Native (Enriched HTML)                                                                                                                                  | WebView editors                                                                                                                                                 |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Input latency**        | Text goes through the platform's native text system - every keystroke, selection change and style toggle is processed without leaving the native layer. | Every interaction crosses the React Native ↔ WebView bridge, adding measurable latency, especially on lower-end devices.                                        |
| **Platform integration** | Full access to native APIs: system context menus, autocorrect / predictive text, VoiceOver / TalkBack, drag-and-drop, hardware keyboards.               | Limited by what the WebView exposes; features like custom context-menu items or native accessibility trees require extra workarounds or are simply unavailable. |
| **Memory & startup**     | No WebView process to spin up - the component is just another native view in the hierarchy.                                                             | Each editor instance spawns a WebView, increasing memory use and adding a visible loading delay on first render.                                                |
| **Debugging**            | Standard React Native / native debugging tools.                                                                                                         | Requires separate WebView / browser dev-tools; bridge-related bugs can be hard to trace.                                                                        |
