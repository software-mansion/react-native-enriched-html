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
export function checkboxHtmlToWeb(html: string): string {
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
