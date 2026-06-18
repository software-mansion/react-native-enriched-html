import DOMPurify from 'dompurify';

export function sanitizeHtml(html: string) {
  return DOMPurify.sanitize(html, {
    ADD_TAGS: ['mention'],
    ADD_ATTR: ['text', 'indicator'],
  });
}
