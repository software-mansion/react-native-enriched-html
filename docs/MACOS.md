# macOS Support (Experimental)

macOS support is provided through [react-native-macos](https://github.com/microsoft/react-native-macos) and is still experimental. APIs and behavior can change in future releases without a major version bump.

## Requirements

- `react-native-macos` `0.81.x` paired with `react-native` `0.81.x` (react-native-macos releases track React Native minor versions; `0.81` is the newest supported line).
- macOS 14.0 or newer (deployment target).
- The React Native New Architecture (Fabric) is **mandatory**. The library is Fabric-only and Fabric is opt-in on react-native-macos, so your `macos/Podfile` must set:

```ruby
ENV['RCT_NEW_ARCH_ENABLED'] = '1'
```

No extra installation steps are needed beyond the regular native setup: the library's podspec declares an `osx` platform, autolinking picks it up, and the same codegen artifacts used on iOS are compiled for macOS.

```sh
cd macos && bundle install && bundle exec pod install
```

## Enriched Text Input

### What works

- Typing, selection and all editing flows of the shared engine (zero-width space handling, paragraph merging, text shortcuts)
- Inline marks: bold, italic, underline, strikethrough, inline code
- Headings (h1-h6)
- Blockquote, code block
- Ordered lists, unordered lists, checkbox lists (including toggling a checkbox by clicking it)
- Inline images and animated GIFs (via `setImage` and `onPasteImages`)
- Manual links (`setLink` / `removeLink`) and automatic link detection (`linkRegex`)
- Mentions: `mentionIndicators`, `startMention`, `setMention` and all mention events
- `getHTML`, `setValue`, `setSelection`, `setTextAlignment`, `focus`, `blur`
- All change events: `onChangeText`, `onChangeHtml`, `onChangeState`, `onChangeSelection`, `onKeyPress`, `onFocus`, `onBlur`
- Copy / cut / paste with the same pipeline as iOS: HTML, RTF and plain text formats, pasted images (including image files copied from Finder) via `onPasteImages`
- `submitBehavior` and `onSubmitEditing` (Enter; Shift-Enter and Option-Enter flow through the same newline pipeline)
- Custom context menu items via `contextMenuItems` (added to the right-click menu)
- Input theming: `placeholder`, `placeholderTextColor`, `selectionColor` (drives both insertion point and selection highlight), `cursorColor`
- `editable`, `scrollEnabled`, `autoFocus`, `defaultValue`, `useHtmlNormalizer`, `textShortcuts`

### Unsupported / platform differences

- **`returnKeyType`**: ignored — macOS has no software keyboard.
- **`autoCapitalize`**: ignored — macOS has no software keyboard.
- **`allowFontScaling`**: has no effect — macOS has no Dynamic Type; fonts always render at their configured sizes.
- **`androidExperimentalSynchronousEvents`**: Android-only.

## Enriched Text

### What works

- Rendering of all supported tags with the same drawing pipeline as iOS (blockquote bars, code block backgrounds, list bullets/decimals/checkboxes, inline images and GIFs)
- `onLinkPress` and `onMentionPress` (mouse clicks) with press feedback styling
- `selectable`, `selectionColor`, `numberOfLines`, `ellipsizeMode`, `useHtmlNormalizer`
- Copying selected text (HTML, RTF and plain text formats)

### Unsupported / platform differences

- **`allowFontScaling`**: has no effect — macOS has no Dynamic Type.

## Running the example app

The repository contains a dedicated macOS example app in `apps/example-macos` (the main example runs a newer React Native version than react-native-macos supports).

```sh
yarn install
cd apps/example-macos/macos && bundle install && bundle exec pod install && cd ..
yarn macos
```

You can also open the workspace in Xcode with `yarn xcode:macos` from the repository root.
