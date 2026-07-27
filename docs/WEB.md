# Web Support

## Enriched Text Input

### Keyboard shortcuts

See [Web Keyboard Shortcuts](./INPUT_API_REFERENCE.md#web-keyboard-shortcuts) for the up-to-date list of Web keyboard shortcuts.

### Unsupported

- **`returnKeyLabel`**: ignored on web, it's not possible to set it inside a browser.
- **Context menu**: `contextMenuItems` is ignored.
- **RN layout ref methods**: `measure`, `measureInWindow`, `measureLayout`, and `setNativeProps` are no-ops.
- **`ViewProps`**: Props inherited from `View` beyond the implemented subset are not forwarded.

## Enriched Text

### Unsupported

- **`ellipsizeMode`**: ignored on web.
- **`numberOfLines`**: ignored on web.
- **RN layout ref methods**: `measure`, `measureInWindow`, `measureLayout`, and `setNativeProps` are no-ops.

## HTML sanitization

You are responsible for sanitizing HTML on both input and output. The library does not guarantee safe or clean HTML output. This applies to any HTML you persist, render elsewhere, or accept from untrusted sources (XSS, paste attacks, etc.).
