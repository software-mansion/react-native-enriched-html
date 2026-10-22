const HTML_OPEN = '<html>';
const HTML_CLOSE = '</html>';
const BODY_OPEN = '<body>';
const BODY_CLOSE = '</body>';

/**
 * Strips the <html> tags and, if there is a <body> pair inside, keeps only its content
 * (anything outside of it is dropped).
 *
 * Must run before sanitization, as DOMPurify drops these tags and would leave
 * content from outside of <body> in the result.
 */
export function extractHtmlContent(html: string): string {
  const trimmed = html.trim();
  if (!trimmed.startsWith(HTML_OPEN) || !trimmed.endsWith(HTML_CLOSE)) {
    return html;
  }

  const inner = trimmed.slice(HTML_OPEN.length, -HTML_CLOSE.length);
  const bodyStart = inner.indexOf(BODY_OPEN);
  if (bodyStart === -1) return inner;

  const contentStart = bodyStart + BODY_OPEN.length;
  // only look for the closing tag after the opening one
  const bodyEnd = inner.indexOf(BODY_CLOSE, contentStart);
  if (bodyEnd === -1) return inner;

  return inner.slice(contentStart, bodyEnd);
}
