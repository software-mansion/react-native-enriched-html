import { ENRICHED_TEXT_CLASSNAME } from '../constants/classNames';

const BLOCK_TAGS = new Set([
  'P',
  'H1',
  'H2',
  'H3',
  'H4',
  'H5',
  'H6',
  'LI',
  'BLOCKQUOTE',
  'CODEBLOCK',
]);

export function tailEllipsize(
  container: HTMLDivElement,
  finalHtml: string,
  numberOfLines: number,
  setClampedHtml: (clampedHtml: string) => void
) {
  const NUMBER_OF_LINES = numberOfLines;

  // setup the hidden sandbox
  const sandbox = document.createElement('div');
  const computedStyle = window.getComputedStyle(container);

  sandbox.style.position = 'absolute';
  sandbox.style.visibility = 'hidden';
  sandbox.style.top = '-9999px';

  // copy exact CSS properties that affect text wrapping
  sandbox.style.cssText = container.style.cssText;
  sandbox.style.width = computedStyle.width;
  sandbox.style.boxSizing = computedStyle.boxSizing;
  sandbox.style.fontFamily = computedStyle.fontFamily;
  sandbox.style.fontSize = computedStyle.fontSize;
  sandbox.style.lineHeight = computedStyle.lineHeight;
  sandbox.style.letterSpacing = computedStyle.letterSpacing;
  sandbox.style.padding = computedStyle.padding;

  sandbox.className = ENRICHED_TEXT_CLASSNAME;
  sandbox.innerHTML = finalHtml;
  document.body.appendChild(sandbox);

  const walkerFilter = {
    acceptNode: (n: Node) => {
      if (n.nodeType === Node.TEXT_NODE) return NodeFilter.FILTER_ACCEPT;
      if (n.nodeName === 'IMG' || n.nodeName === 'BR')
        return NodeFilter.FILTER_ACCEPT;

      // let the walker see the empty blocks
      if (n.nodeType === Node.ELEMENT_NODE && BLOCK_TAGS.has(n.nodeName)) {
        const el = n as HTMLElement;
        const textEmpty = !el.textContent?.trim();
        const hasImg = !!el.querySelector('img');
        if (textEmpty && !hasImg) return NodeFilter.FILTER_ACCEPT;
      }

      return NodeFilter.FILTER_SKIP;
    },
  };

  const walker = document.createTreeWalker(
    sandbox,
    NodeFilter.SHOW_ALL,
    walkerFilter
  );
  const range = document.createRange();

  let currentLine = 1;
  let lastBottom: number | null = null;
  // the node that starts the overflow
  let targetNode: Node | null = null;

  // forward scan - we find the first element that overflows to the forbidden line
  let node: Node | null;
  while ((node = walker.nextNode())) {
    if (node.nodeType === Node.TEXT_NODE) {
      const textNode = node as Text;
      const text = textNode.nodeValue || '';

      for (let i = 0; i < text.length; i++) {
        range.setStart(textNode, i);
        range.setEnd(textNode, i + 1);
        const rect = range.getBoundingClientRect();

        if (rect.height === 0) continue;

        if (lastBottom !== null && rect.bottom > lastBottom + 4) {
          currentLine++;
        }

        if (currentLine > NUMBER_OF_LINES) {
          targetNode = textNode;
          break;
        }
        lastBottom = rect.bottom;
      }
    } else if (
      node.nodeName === 'IMG' ||
      node.nodeName === 'BR' ||
      (node.nodeType === Node.ELEMENT_NODE && BLOCK_TAGS.has(node.nodeName))
    ) {
      const el = node as HTMLElement;
      const rect = el.getBoundingClientRect();

      if (rect.height === 0) continue;

      if (lastBottom !== null && rect.bottom > lastBottom + 4) {
        currentLine++;
      }

      if (currentLine > NUMBER_OF_LINES) {
        targetNode = el;
        break;
      }
      lastBottom = rect.bottom;
    }

    if (targetNode) break;
  }

  // we remove content until everything fits within the given number of lines
  if (targetNode) {
    // remove all content on "the right" of the targetNode
    let current: Node | null = targetNode;
    while (current && current !== sandbox) {
      let sibling = current.nextSibling;
      while (sibling) {
        const next = sibling.nextSibling;
        sibling.parentNode?.removeChild(sibling);
        sibling = next;
      }
      current = current.parentNode;
    }

    if (targetNode.nodeName === 'IMG') {
      targetNode.parentNode?.removeChild(targetNode);
    }

    // now we append the ellipsis "...",
    // but now it might overflow again, so we remove the content backwards until it fits
    let isOverflowing = true;
    while (isOverflowing) {
      const backwardWalker = document.createTreeWalker(
        sandbox,
        NodeFilter.SHOW_ALL,
        walkerFilter
      );

      let lastNode: Node | null = null;
      while (backwardWalker.nextNode()) {
        lastNode = backwardWalker.currentNode;
      }

      if (!lastNode) break;

      // we have to handle inline images separately
      if (lastNode.nodeName === 'IMG') {
        // create the ellipsis "..." after an image
        const ellipsisNode = document.createTextNode('...');
        lastNode.parentNode?.insertBefore(ellipsisNode, lastNode.nextSibling);

        range.selectNodeContents(ellipsisNode);
        const rect = range.getBoundingClientRect();

        // check if the image + ellipsis pushed us onto the forbidden line
        if (lastBottom !== null && rect.bottom > lastBottom + 4) {
          // it overflowed
          ellipsisNode.parentNode?.removeChild(ellipsisNode);
          lastNode.parentNode?.removeChild(lastNode);
        } else {
          // it fits
          isOverflowing = false;
        }
      }
      // handle <br> separately
      else if (lastNode.nodeName === 'BR') {
        const ellipsisNode = document.createTextNode('...');

        // Replace the <br> directly with the ellipsis
        lastNode.parentNode?.insertBefore(ellipsisNode, lastNode);
        lastNode.parentNode?.removeChild(lastNode);

        range.selectNodeContents(ellipsisNode);
        const rect = range.getBoundingClientRect();

        if (lastBottom !== null && rect.bottom > lastBottom + 4) {
          // If it still overflows, delete the ellipsis so the loop continues backwards
          ellipsisNode.parentNode?.removeChild(ellipsisNode);
        } else {
          // It fits perfectly!
          isOverflowing = false;
        }
      }
      // handle empty blocks (like an empty <li>)
      else if (
        lastNode.nodeType === Node.ELEMENT_NODE &&
        BLOCK_TAGS.has(lastNode.nodeName)
      ) {
        const ellipsisNode = document.createTextNode('...');
        lastNode.appendChild(ellipsisNode);

        range.selectNodeContents(ellipsisNode);
        const rect = range.getBoundingClientRect();

        if (lastBottom !== null && rect.bottom > lastBottom + 4) {
          lastNode.parentNode?.removeChild(lastNode);
        } else {
          isOverflowing = false;
        }
      }
      // handling normal text nodes
      else {
        const lastTextNode = lastNode as Text;
        let text = lastTextNode.nodeValue || '';

        if (text.endsWith('...')) text = text.slice(0, -3);

        if (text.trim().length === 0) {
          let parent = lastTextNode.parentNode;
          lastTextNode.parentNode?.removeChild(lastTextNode);

          // if text removal resulted in an empty block, we have to remove it
          while (parent && parent !== sandbox) {
            const el = parent as HTMLElement;
            const textEmpty = !el.textContent?.trim();
            const hasImg = !!el.querySelector('img');
            const hasBr = !!el.querySelector('br');

            if (
              parent.childNodes.length === 0 ||
              (textEmpty && !hasImg && !hasBr)
            ) {
              const p = parent.parentNode;
              parent.parentNode?.removeChild(parent);
              parent = p;
            } else {
              break;
            }
          }
          continue;
        }

        // append the ellipsis
        lastTextNode.nodeValue = text + '...';

        range.setStart(lastTextNode, lastTextNode.nodeValue.length - 1);
        range.setEnd(lastTextNode, lastTextNode.nodeValue.length);
        const rect = range.getBoundingClientRect();

        // check if it overflows with the ellipsis
        if (lastBottom !== null && rect.bottom > lastBottom + 4) {
          // it overflows, delete one more character
          lastTextNode.nodeValue = text.slice(0, -1);
        } else {
          // it fits
          isOverflowing = false;
        }
      }
    }

    setClampedHtml(sandbox.innerHTML);
  } else {
    setClampedHtml(finalHtml);
  }

  document.body.removeChild(sandbox);
}
