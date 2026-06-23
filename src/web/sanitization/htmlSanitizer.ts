import DOMPurify from 'dompurify';

// We need to explicitly allow custom html attributes that can be set inside a <mention>
DOMPurify.addHook('uponSanitizeAttribute', (currentNode, hookEvent) => {
  if (currentNode.nodeName.toLowerCase() === 'mention') {
    const attrName = hookEvent.attrName.toLowerCase();

    // sanitize the mention from the tags with risk of XSS injection
    if (
      attrName.startsWith('on') ||
      attrName === 'href' ||
      attrName === 'src' ||
      attrName === 'style'
    ) {
      hookEvent.keepAttr = false;
      return;
    }

    hookEvent.forceKeepAttr = true;
  }
});

export function sanitizeHtml(html: string) {
  return DOMPurify.sanitize(html, {
    ADD_TAGS: ['mention', 'codeblock'],
    ADD_ATTR: ['text', 'indicator'],
  });
}
