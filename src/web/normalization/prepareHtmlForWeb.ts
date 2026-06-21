export function prepareHtmlForWeb(html: string) {
  return checkboxHtmlToWeb(html);
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
 *       <input type="checkbox" checked>
 *       <label>foo</label>
 *     </li>
 *     <li>
 *       <input type="checkbox">
 *       <label>bar</label>
 *     </li>
 *   </ul>
 */
function checkboxHtmlToWeb(html: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  doc.querySelectorAll('ul[data-type="checkbox"]').forEach((ul) => {
    ul.querySelectorAll('li').forEach((li) => {
      const checked = li.hasAttribute('checked');
      const labelContent = li.innerHTML;

      li.removeAttribute('checked');
      li.innerHTML =
        `<input type="checkbox"${checked ? ' checked' : ''}>` +
        `<label>${labelContent}</label>`;
    });
  });

  return doc.body.innerHTML;
}
