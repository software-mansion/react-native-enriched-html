import DOMPurify from 'dompurify';
import type { SanitizationConfig } from '../../types';

const MENTION_ATTRS = ['text', 'indicator'];

// Non-URL <img> attributes we emit. They must be listed as "URI safe" because
// DOMPurify validates every attribute value that isn't in its built-in
// URI_SAFE_ATTRIBUTES set against ALLOWED_URI_REGEXP.
const IMG_DIMENSION_ATTRS = ['width', 'height'];

// Attributes DOMPurify keeps by default and are commonly used, so we don't emit an unnecessary warning
const COMMONLY_ALLOWED_ATTRS = ['id', 'class', 'style'];

export function sanitizeHtml(html: string, config?: SanitizationConfig) {
  return DOMPurify.sanitize(html, {
    ADD_TAGS: ['mention', 'codeblock'],
    ADD_ATTR: MENTION_ATTRS,
    ADD_URI_SAFE_ATTR: [...MENTION_ATTRS, ...IMG_DIMENSION_ATTRS],
    // if not supplied, fall back to DOMPurify's built-in default.
    ...(config?.linkRegex ? { ALLOWED_URI_REGEXP: config.linkRegex } : {}),
  });
}

export function sanitizeMentionAttributes(
  attributes?: Record<string, string>
): Record<string, string> {
  if (!attributes) return {};

  const el = document.createElement('mention');
  for (const [name, value] of Object.entries(attributes)) {
    try {
      el.setAttribute(name, value);
    } catch {
      // Ignore invalid attribute names.
    }
  }

  const cleaned = new DOMParser()
    .parseFromString(sanitizeHtml(el.outerHTML), 'text/html')
    .querySelector('mention');

  const out: Record<string, string> = {};
  if (!cleaned) return out;

  for (const attr of Array.from(cleaned.attributes)) {
    if (MENTION_ATTRS.includes(attr.name.toLowerCase())) continue;
    out[attr.name] = attr.value;
  }
  return out;
}

// Runtime warning: custom attributes without a "data-" prefix may be
// removed by sanitization. This is a heuristic (it does not run DOMPurify).
export function checkMentionAttributes(attributes?: Record<string, string>) {
  if (!attributes) return;

  Object.keys(attributes).forEach((attrName) => {
    const lower = attrName.toLowerCase();
    if (
      lower.startsWith('data-') ||
      MENTION_ATTRS.includes(lower) ||
      COMMONLY_ALLOWED_ATTRS.includes(lower)
    ) {
      return;
    }
    console.warn(
      `[EnrichedMention] Attribute "${attrName}" on the <mention> tag may be removed during sanitization. ` +
        `Consider using the "data-" prefix for custom data attributes.`
    );
  });
}
