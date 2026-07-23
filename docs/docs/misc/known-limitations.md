---
sidebar_position: 3
---

# Known limitations

This page lists limitations that apply to **every** platform. Behaviours that
differ only between iOS, Android, and Web are documented separately under
[Compatibility](/misc/compatibility).

Some of these are on our [Roadmap](/misc/roadmap); others are deliberate design
choices that keep the library fast and its output predictable.

## Single-level lists only

The editor supports a single level of ordered and unordered lists. **Nested
lists are not supported** - you can't indent a list item to create a sublist.
Multi-level list support is planned; see the [Roadmap](/misc/roadmap).

## Fixed set of HTML tags

The library intentionally works with a fixed, curated set of standard and
custom HTML tags rather than accepting arbitrary markup. Tags outside that set
are stripped or normalized away when they enter the editor. This is a
deliberate design decision: it keeps the produced HTML portable and guarantees
that the `EnrichedTextInput` and the `EnrichedText` display render identically. See
[Supported tags](/fundamentals/html-format-and-supported-tags) for the full
list.

## New Architecture required

The components are built exclusively for the React Native New Architecture
(Fabric). There is no Old Architecture (Paper) fallback. See
[Compatibility](/misc/compatibility) for supported React Native versions.
