export function prepareHtmlForWeb(html: string) {
  return addImageErrorFallback(checkboxHtmlToWeb(html));
}

/*
 * Flag images that fail to load so CSS can swap in a broken-image
 * placeholder (see `img.error` in EnrichedText.css).
 *
 * The markup is rendered via dangerouslySetInnerHTML, where an `onerror`
 * attribute on an <img> still fires on load failure. This runs AFTER
 * sanitization on purpose, so the handler we add isn't stripped.
 */
function addImageErrorFallback(html: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  doc.querySelectorAll('img').forEach((img) => {
    const src = img.getAttribute('src');

    if (!src || src.trim() === '') {
      img.classList.add('error');
    }

    img.setAttribute('onerror', "this.classList.add('error')");
  });

  return doc.body.innerHTML;
}

/*
 * Native checkbox format (as produced by the editor):
 *   <ul data-type="checkbox">
 *     <li checked>foo</li>
 *     <li>bar</li>
 *   </ul>
 *
 * Web-native, display-only format:
 *   <ul data-type="checkbox">
 *     <li>
 *       <input type="checkbox" id="…" checked>
 *       <label for="…">foo</label>
 *     </li>
 *     <li>
 *       <input type="checkbox" id="…">
 *       <label for="…">bar</label>
 *     </li>
 *   </ul>
 */
function checkboxHtmlToWeb(html: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  let idCounter = 0;

  doc.querySelectorAll('ul[data-type="checkbox"]').forEach((ul) => {
    ul.querySelectorAll('li').forEach((li) => {
      const checked = li.hasAttribute('checked');
      const id = `enriched-checkbox-${idCounter++}`;
      const labelContent = li.innerHTML;

      li.removeAttribute('checked');
      li.innerHTML =
        `<input type="checkbox" id="${id}"${checked ? ' checked' : ''}>` +
        `<label for="${id}">${labelContent}</label>`;
    });
  });

  return doc.body.innerHTML;
}
