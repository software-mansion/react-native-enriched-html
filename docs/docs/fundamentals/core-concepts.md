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

- To **change** content or styling, call a method: `ref.current?.toggleBold()`,
  `ref.current?.setValue(html)`, `ref.current?.setLink(...)`.
- To **observe** content or styling, listen to an event: `onChangeState`,
  `onChangeHtml`, `onChangeSelection`.

You never set a `value` prop and re-render to make an edit happen.

## HTML is the source of truth

The editor's content is HTML. `setValue` and `defaultValue` seeds it with an HTML string,
`getHTML` reads the current content back, and `onChangeHtml` streams it as it
changes. What you store and what you render is a string of HTML.

The library uses a fixed set of standard and custom tags, so the output is
predictable and portable. [Supported HTML tags](/fundamentals/html-format-and-supported-tags)
lists exactly what it produces and accepts.

:::caution

You own sanitization. The library doesn't guarantee safe or clean HTML, so
sanitize anything you persist, render elsewhere, or accept from untrusted
sources.

:::

## Normalization
HTML can be messy. If a user pastes text from Google Docs or MS Word, it can arrive packed with wrapper tags, inline styles, and structural quirks that don't match the format we expect.

To handle this, both components provide a `useHtmlNormalizer` prop that normalizes incoming HTML. The normalizer cleans and restructures the input into the predictable format the library expects (e.g. it maps `<strong>` to `<b>`, unwraps `<div>` containers into `<p>` tags, and strips unsupported tags). The `useHtmlNormalizer` prop defaults to `true`.
All supported and canonical tags are listed in [Supported HTML tags](/fundamentals/html-format-and-supported-tags).

## Two components, one styling API

The library is split into an editor and a viewer:

- **`EnrichedTextInput`** — the interactive editor from the previous page.
- **`EnrichedText`** — a read-only display component that renders the input's
  HTML.

Both accept the same `htmlStyle` prop, which describes how each tag looks
(heading sizes, blockquote borders, code block colors, and so on). Because they
share it, text looks identical whether it's being edited or displayed — no
drift between the two. A common setup edits in `EnrichedTextInput`, stores the
`getHTML` output, and later shows it with `EnrichedText`.

## The style state model

Not every style can combine with every other. A heading isn't a list; bold
inside a code block doesn't make sense. The editor tracks this and reports it
through `onChangeState`, which gives each style three booleans:

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
[Supported HTML tags](/fundamentals/html-format-and-supported-tags).
