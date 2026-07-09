export function prepareHtmlForWeb(html: string): string {
  if (typeof DOMParser === 'undefined') return html;

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  wrapBareLiContentInParagraph(doc);
  checkboxHtmlToWeb(doc);

  return doc.body.innerHTML;
}

/*
 * Native list format:
 *   <ul>
 *     <li>foo</li>
 *     <li></li>
 *   </ul>
 *
 * Web-native, with <p> wrappers to display the content correctly:
 *   <ul>
 *     <li>
 *       <p>foo</p>
 *     </li>
 *     <li>
 *       <p></p>
 *     </li>
 *   </ul>
 */
function wrapBareLiContentInParagraph(doc: Document) {
  // Target only standard lists (ignore checkbox lists, as they get wrapped in <label> later)
  const listItems = doc.querySelectorAll(
    'ul:not([data-type="checkbox"]) > li, ol > li'
  );

  listItems.forEach((li) => {
    if (li.firstElementChild?.tagName.toUpperCase() === 'P') return;

    const nodesToWrap: Node[] = [];
    const childNodes = Array.from(li.childNodes);

    for (const node of childNodes) {
      if (
        node.nodeType === Node.ELEMENT_NODE &&
        ['UL', 'OL'].includes((node as Element).tagName.toUpperCase())
      ) {
        break;
      }
      nodesToWrap.push(node);
    }

    const p = doc.createElement('p');

    li.insertBefore(p, childNodes[0] || null);

    nodesToWrap.forEach((node) => p.appendChild(node));
  });
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
function checkboxHtmlToWeb(doc: Document) {
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
}
