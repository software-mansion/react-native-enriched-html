---
sidebar_position: 3
---

# Core concepts

You've built an editor. Before going on, it's worth understanding the few
ideas the whole library is built on. They explain why the API looks the way it
does and help you understand further chapters better.

## The input is uncontrolled

`EnrichedTextInput` does not take its content from a prop and does not push
every keystroke back into React state. It owns its content on the native side
and you talk to it through a `ref`.

This is deliberate. Rich text changes constantly — every character, selection
move and style toggle — and round-tripping all of that through JavaScript state
would be extremely slow and open to a possible de-synchronization of those states.
Keeping it native makes the editor fast and stable.

In practice this means:

- To **change** the content or formatting, call a method on the ref, e.g. `ref.current?.toggleBold()`, `ref.current?.setValue(html)`, or `ref.current?.setLink(...)`.
- To **observe** changes to the content or formatting, listen to events such as `onChangeState`, `onChangeHtml`, or `onChangeSelection`.

You never set a `value` prop and re-render to make an edit happen.

## HTML is the source of truth

The editor's content is HTML. `setValue` and `defaultValue` seeds it with an HTML string,
`getHTML` reads the current content back, and `onChangeHtml` streams it as it
changes. What you store and what you render is a string of HTML.

The library uses a fixed set of standard and custom tags, so the output is
predictable and portable. [Supported tags](/fundamentals/html-format-and-supported-tags)
lists exactly what it produces and accepts.

:::caution

Sanitizing HTML is your responsibility. The library doesn't guarantee safe HTML, so
sanitize anything you persist, render elsewhere, or accept from untrusted
sources.

:::

## Normalization

HTML can be messy. Whether users paste rich text from applications like Google Docs or Microsoft Word, or you inject external HTML via `defaultValue`, `setValue`, or pass it directly as `children` into `EnrichedText`, the markup often contains additional wrapper elements, inline styles, and structural quirks that may not match the HTML structure expected by the library.

To handle this, both components provide a `useHtmlNormalizer` prop that normalizes incoming HTML. The normalizer cleans and restructures the input into the predictable format the library relies on (e.g., it maps `<strong>` to `<b>`, unwraps `<div>` containers into `<p>` tags, and strips unsupported tags). The `useHtmlNormalizer` prop defaults to `true`.

All supported and canonical tags are listed in [Supported tags](/fundamentals/html-format-and-supported-tags).

## Two components, one HTML format

The library is split into an editor and a viewer:

- **`EnrichedTextInput`** — the interactive editor from the previous page.
- **`EnrichedText`** — a read-only display component that renders the input's
  HTML.

The HTML format that both components expect is identical, what allows you to integrate them seamlessly. A common setup edits in `EnrichedTextInput`, stores the `getHTML` output, and later displays it with `EnrichedText`.

## The style state model

Not every style can be combined with every other. For example, a paragraph can't be both a heading and a list item, code blocks don't support inline formatting such as bold or italic. The editor tracks this and reports it through `onChangeState`, which gives each style three booleans:

- **`isActive`** — the style is applied at the current selection. Use it to
  highlight a toolbar button.
- **`isBlocking`** — another active style forbids this one entirely, so toggling
  it would do nothing. For example bold is blocked inside a code block. Use it
  to disable a button.
- **`isConflicting`** — this style would replace an active one if toggled on.
  For example switching a blockquote paragraph to a heading removes the
  blockquote. Use it to hint that the toggle is a swap, not an addition.

Driving your toolbar from these three flags keeps the UI honest: buttons light
up and grey out according to the editor's state.

For the comprehensive list of which styles block or conflict with each other, see
[Supported tags](/fundamentals/html-format-and-supported-tags).
