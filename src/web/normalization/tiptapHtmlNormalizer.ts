import { sanitizeHtml } from '../sanitization/htmlSanitizer';
import type { SanitizationConfig } from '../../types';
import {
  checkboxHtmlForTiptap,
  checkboxHtmlFromTiptap,
} from './checkboxHtmlNormalizer';
import { normalizeHtml } from './htmlNormalizer';

export function prepareHtmlForTiptap(
  html: string,
  useHtmlNormalizer: boolean | undefined,
  sanitizationConfig?: SanitizationConfig
): string {
  html = sanitizeHtml(html, sanitizationConfig);
  if (useHtmlNormalizer) {
    html = normalizeHtml(html);
  }
  html = checkboxHtmlForTiptap(html);
  html = html.replace(/<br\s*\/?>/gi, '<p></p>');
  return html;
}

export function normalizeHtmlFromTiptap(
  html: string,
  sanitizationConfig?: SanitizationConfig
): string {
  html = sanitizeHtml(html, sanitizationConfig);
  html = checkboxHtmlFromTiptap(html);

  // Strip <p> wrappers inside <li> elements.
  // TipTap renders <li><p>text</p></li> but native expects <li>text</li>.
  // This regex is safe because EnrichedListItem.content is 'paragraph', which
  // prevents TipTap from ever emitting nested lists
  html = html.replace(
    /<li([^>]*)>\s*<p[^>]*>(.*?)<\/p>\s*<\/li>/gs,
    '<li$1>$2</li>'
  );

  // Convert remaining empty <p></p> to <br> (outside of lists)
  html = html.replace(/<p><\/p>/g, '<br>');

  // Convert <img> tags to self-closing tags
  html = html.replace(/<img\b([^>]*)>/gi, (_, attrs: string) => {
    if (attrs.trimEnd().endsWith('/')) {
      return `<img${attrs}>`;
    }
    return `<img${attrs}/>`;
  });

  return `<html>${html}</html>`;
}
