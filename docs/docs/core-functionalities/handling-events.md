---
sidebar_position: 3
---

# Handling events

Since the input is [uncontrolled](/fundamentals/core-concepts#the-input-is-uncontrolled),
events are how you observe it. You change content by calling ref methods; you
react to changes by listening to the callbacks below.

Full payload shapes of the available callbacks can be found in the `EnrichedTextInput` reference.

## Content

- **`onChangeText`** - plain-text content changed.
- **`onChangeHtml`** - the HTML changed.

:::tip

The `onChangeHtml` callback has to parse the content into HTML on every keystroke.
This is a heavy computational operation that might slow down your app's performance. Consider using the `getHTML()` ref method instead if it meets your requirements.

:::

## Selection and style state

- **`onChangeSelection`** - the cursor moved or the selection changed. Gives you
  `start`, `end`, and the selected `text`. Useful for range-based methods like
  [`setLink`](/rich-text-formatting/links).
- **`onChangeState`** - the active styles at the cursor changed. This is the
  event that drives a toolbar by using reported `isActive`, `isBlocking`, and
  `isConflicting`, plus the current `alignment`. See the
  [style state model](/fundamentals/core-concepts#the-style-state-model).

## Focus

- **`onFocus`** / **`onBlur`** - the input gained or lost focus.

## Mentions

- **`onStartMention`** - a mention started being edited.
- **`onChangeMention`** - the query after the indicator changed.
- **`onEndMention`** - editing a mention stopped.
- **`onMentionDetected`** - the cursor entered or left a mention.

## Links

- **`onLinkDetected`** - the cursor entered or left a link.

## Images

- **`onPasteImages`** - the user pasted one or more images; hands you each
  image's data so you can upload and insert them with
  [`setImage`](/rich-text-formatting/inline-images).

## Keyboard and submission

- **`onKeyPress`** - a key was pressed.
- **`onSubmitEditing`** - the user presses return/enter key. Fires when `submitBehavior` is set to either `submit` or `blurAndSubmit`.
