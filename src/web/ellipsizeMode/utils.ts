import { ENRICHED_TEXT_CLASSNAME } from '../constants/classNames';

export const BLOCK_TAGS = new Set([
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

const LINE_TOLERANCE_RATIO = 0.25;
const DEFAULT_LINE_TOLERANCE = 4;

// A node paired with the character offset at which a line starts within it.
export type LineMark = { node: Node; index: number };

function getLineTolerance(computedStyle: CSSStyleDeclaration): number {
  const lineHeight = parseFloat(computedStyle.lineHeight);
  if (Number.isFinite(lineHeight) && lineHeight > 0) {
    return lineHeight * LINE_TOLERANCE_RATIO;
  }

  const fontSize = parseFloat(computedStyle.fontSize);
  if (Number.isFinite(fontSize) && fontSize > 0) {
    return fontSize * 1.2 * LINE_TOLERANCE_RATIO;
  }

  return DEFAULT_LINE_TOLERANCE;
}

// Creates a hidden sandbox div that mirrors the container's text-wrapping
// styles, so line breaks can be measured without touching the visible DOM.
// The sandbox is appended to the container and returned to the caller, which
// is responsible for removing it once done.
export function createSandbox(
  container: HTMLDivElement,
  finalHtml: string
): {
  sandbox: HTMLDivElement;
  computedStyle: CSSStyleDeclaration;
  lineTolerance: number;
} {
  const sandbox = document.createElement('div');
  const computedStyle = window.getComputedStyle(container);

  sandbox.style.cssText = container.style.cssText;

  sandbox.style.position = 'absolute';
  sandbox.style.visibility = 'hidden';
  sandbox.style.top = '-9999px';
  sandbox.style.pointerEvents = 'none';

  // copy exact CSS properties that affect text wrapping
  sandbox.style.width = computedStyle.width;
  sandbox.style.boxSizing = computedStyle.boxSizing;
  sandbox.style.fontFamily = computedStyle.fontFamily;
  sandbox.style.fontSize = computedStyle.fontSize;
  sandbox.style.lineHeight = computedStyle.lineHeight;
  sandbox.style.letterSpacing = computedStyle.letterSpacing;
  sandbox.style.padding = computedStyle.padding;
  sandbox.style.wordBreak = computedStyle.wordBreak;
  sandbox.style.overflowWrap = computedStyle.overflowWrap;

  sandbox.className = ENRICHED_TEXT_CLASSNAME;
  sandbox.innerHTML = finalHtml;

  container.appendChild(sandbox);

  return {
    sandbox,
    computedStyle,
    lineTolerance: getLineTolerance(computedStyle),
  };
}

// Filter shared by the TreeWalkers across the ellipsize algorithms. Accepts
// text nodes, inline images and <br>, plus genuinely empty block elements.
export const walkerFilter: NodeFilter = {
  acceptNode: (n: Node) => {
    if (n.nodeType === Node.TEXT_NODE) return NodeFilter.FILTER_ACCEPT;
    if (n.nodeName === 'IMG' || n.nodeName === 'BR')
      return NodeFilter.FILTER_ACCEPT;

    // let the walker see the empty blocks
    if (n.nodeType === Node.ELEMENT_NODE && BLOCK_TAGS.has(n.nodeName)) {
      const el = n as HTMLElement;
      const textEmpty = !el.textContent?.trim();
      const hasImg = !!el.querySelector('img');
      const hasBr = !!el.querySelector('br');
      if (textEmpty && !hasImg && !hasBr) return NodeFilter.FILTER_ACCEPT;
    }

    return NodeFilter.FILTER_SKIP;
  },
};

// Walks up from `node` to the nearest enclosing block element, stopping at the
// sandbox root.
export function getBlockParent(
  node: Node | null,
  sandbox: HTMLElement
): Element | null {
  let current = node?.parentElement;
  while (current && current !== sandbox) {
    if (BLOCK_TAGS.has(current.tagName)) return current;
    current = current.parentElement;
  }
  return sandbox;
}

// Removes a node and then prunes any now-empty ancestor blocks up to the
// sandbox.
export function removeAndCleanUp(nd: Node, sandbox: HTMLElement) {
  let parent: ParentNode | null = nd.parentNode;
  if (parent) {
    parent.removeChild(nd);
    while (parent && parent !== sandbox && parent.childNodes.length === 0) {
      const p: ParentNode | null = parent.parentNode;
      p?.removeChild(parent);
      parent = p;
    }
  }
}

// Splits a text node at `index`: the left half stays in place and the right
// half is inserted as a new sibling immediately after it. Returns the new node.
export function splitTextNode(textNode: Text, index: number): Text {
  const rightSplit = document.createTextNode(textNode.nodeValue!.slice(index));
  textNode.nodeValue = textNode.nodeValue!.slice(0, index);
  textNode.parentNode?.insertBefore(rightSplit, textNode.nextSibling);
  return rightSplit;
}

// Returns the node that begins a line mark's content, splitting the underlying
// text node when the mark falls mid-node. Non-text nodes (and marks at index 0)
// are returned untouched.
export function splitAtMark(mark: LineMark): Node {
  if (mark.node.nodeType === Node.TEXT_NODE && mark.index > 0) {
    return splitTextNode(mark.node as Text, mark.index);
  }
  return mark.node;
}

// Removes a blank (whitespace-only) text node and prunes any ancestor blocks
// left empty by the removal, up to the sandbox.
export function removeBlankTextAndPrune(textNode: Text, sandbox: HTMLElement) {
  let parent = textNode.parentNode;
  textNode.parentNode?.removeChild(textNode);

  while (parent && parent !== sandbox) {
    const el = parent as HTMLElement;
    const textEmpty = !el.textContent?.trim();
    const hasImg = !!el.querySelector('img');
    const hasBr = !!el.querySelector('br');

    if (parent.childNodes.length === 0 || (textEmpty && !hasImg && !hasBr)) {
      const p = parent.parentNode;
      parent.parentNode?.removeChild(parent);
      parent = p;
    } else {
      break;
    }
  }
}

// Walks forward from `fromNode` to the last node the filter can see and reports
// whether that node's bottom sits on (or above) `targetBottom`.
//  Used to check whether the trailing content fits on the ellipsis line.
export function fitsWithin(
  sandbox: HTMLElement,
  fromNode: Node,
  targetBottom: number,
  tolerance: number
): boolean {
  const range = document.createRange();
  const walker = document.createTreeWalker(
    sandbox,
    NodeFilter.SHOW_ALL,
    walkerFilter
  );
  walker.currentNode = fromNode;

  let lastNode: Node | null = null;
  while (walker.nextNode()) lastNode = walker.currentNode;

  if (!lastNode) return true;

  if (lastNode.nodeType === Node.TEXT_NODE) {
    if ((lastNode as Text).length === 0) return true;
    range.selectNodeContents(lastNode);
    return range.getBoundingClientRect().bottom <= targetBottom + tolerance;
  }

  return (
    (lastNode as HTMLElement).getBoundingClientRect().bottom <=
    targetBottom + tolerance
  );
}

// Result of the forward line scan: `lineStarts[k]` is the mark where line `k`
// begins, `lineBottoms[k]` is the bottom of line `k`'s last rect, and
// `lastLine` is the number of the final line.
export type LineScan = {
  lineStarts: LineMark[];
  lineBottoms: number[];
  lastLine: number;
};

// Walks the sandbox front-to-back and records where each rendered line begins.
// This is the single forward scan shared by every ellipsize mode. `onMeasure`
// (used by middle to locate the mid-point) is called for every measured rect.
export function scanLines(
  sandbox: HTMLElement,
  lineTolerance: number,
  onMeasure?: (info: {
    currentLine: number;
    node: Node;
    index: number;
    rect: DOMRect;
  }) => void
): LineScan {
  const walker = document.createTreeWalker(
    sandbox,
    NodeFilter.SHOW_ALL,
    walkerFilter
  );
  const range = document.createRange();

  const lineStarts: LineMark[] = [];
  const lineBottoms: number[] = [];
  let currentLine = 0;
  let lastBottom: number | null = null;

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

        if (lastBottom === null || rect.bottom > lastBottom + lineTolerance) {
          currentLine++;
          lineStarts[currentLine] = { node: textNode, index: i };
        }
        lineBottoms[currentLine] = rect.bottom;

        onMeasure?.({ currentLine, node: textNode, index: i, rect });

        lastBottom = rect.bottom;
      }
    } else if (
      node.nodeName === 'IMG' ||
      node.nodeName === 'BR' ||
      BLOCK_TAGS.has(node.nodeName)
    ) {
      const el = node as HTMLElement;
      const rect = el.getBoundingClientRect();

      if (rect.height === 0 && node.nodeName !== 'BR') continue;

      if (lastBottom === null || rect.bottom > lastBottom + lineTolerance) {
        currentLine++;
        lineStarts[currentLine] = { node: el, index: 0 };
      }
      lineBottoms[currentLine] = rect.bottom;

      onMeasure?.({ currentLine, node: el, index: 0, rect });

      lastBottom = rect.bottom;
    }
  }

  return { lineStarts, lineBottoms, lastLine: currentLine };
}

// Removes everything positioned after `targetNode` in document order: all of
// its following siblings and, walking up to the sandbox, the following siblings
// of each ancestor. If the target itself is an inline image it is removed too
// (it has no trailing characters to trim, so it can't host the truncation).
export function removeAfterTarget(targetNode: Node, sandbox: HTMLElement) {
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
}

// Walks to the last node the filter can see.
function lastRenderedNode(sandbox: HTMLElement): Node | null {
  const walker = document.createTreeWalker(
    sandbox,
    NodeFilter.SHOW_ALL,
    walkerFilter
  );
  let last: Node | null = null;
  while (walker.nextNode()) last = walker.currentNode;
  return last;
}

// Repeatedly removes the trailing node in the sandbox - trimming one character
// at a time from text, or dropping a whole img / br / empty block - until the
// remaining content no longer overflows past `lastBottom` (the bottom of the
// last kept line). When `withEllipsis` is set, an "..." is (re)anchored onto the
// trailing content as it shrinks. Otherwise content is simply clipped.
// Shared by the tail and clip modes.
export function eatBackwardUntilFits(
  sandbox: HTMLElement,
  lastBottom: number | null,
  lineTolerance: number,
  withEllipsis: boolean
) {
  const range = document.createRange();
  const overflows = (bottom: number) =>
    lastBottom !== null && bottom > lastBottom + lineTolerance;
  const contentsBottom = (node: Node) => {
    range.selectNodeContents(node);
    return range.getBoundingClientRect().bottom;
  };

  let isOverflowing = true;
  while (isOverflowing) {
    const lastNode = lastRenderedNode(sandbox);
    if (!lastNode) break;

    // handling text nodes: trim one character at a time (re-appending "..." each iteration)
    if (lastNode.nodeType === Node.TEXT_NODE) {
      const textNode = lastNode as Text;
      let text = textNode.nodeValue || '';
      if (withEllipsis && text.endsWith('...')) text = text.slice(0, -3);

      // drop whitespace-only nodes
      if (text.trim().length === 0) {
        removeBlankTextAndPrune(textNode, sandbox);
        continue;
      }

      if (withEllipsis) {
        // append the ellipsis and measure its last character
        textNode.nodeValue = text + '...';
        range.setStart(textNode, textNode.nodeValue.length - 1);
        range.setEnd(textNode, textNode.nodeValue.length);
      } else {
        range.setStart(textNode, 0);
        range.setEnd(textNode, text.length);
      }

      if (overflows(range.getBoundingClientRect().bottom)) {
        // drop one more character
        textNode.nodeValue = text.slice(0, -1);
      } else {
        isOverflowing = false;
      }
      continue;
    }

    // now we handle non-text nodes

    // clip mode: drop the whole trailing unit (img / br / empty block)
    if (!withEllipsis) {
      // measure by the element's own box
      const bottom = (lastNode as HTMLElement).getBoundingClientRect().bottom;

      if (overflows(bottom)) lastNode.parentNode?.removeChild(lastNode);
      else isOverflowing = false;
      continue;
    }

    // tail mode: re-anchor the ellipsis onto the trailing unit
    const ellipsisNode = document.createTextNode('...');

    if (lastNode.nodeName === 'IMG') {
      // place the ellipsis right after the image
      lastNode.parentNode?.insertBefore(ellipsisNode, lastNode.nextSibling);
      if (overflows(contentsBottom(ellipsisNode))) {
        ellipsisNode.parentNode?.removeChild(ellipsisNode);
        lastNode.parentNode?.removeChild(lastNode);
      } else {
        isOverflowing = false;
      }
    } else if (lastNode.nodeName === 'BR') {
      // replace the <br> with the ellipsis
      lastNode.parentNode?.insertBefore(ellipsisNode, lastNode);
      lastNode.parentNode?.removeChild(lastNode);
      if (overflows(contentsBottom(ellipsisNode))) {
        ellipsisNode.parentNode?.removeChild(ellipsisNode);
      } else {
        isOverflowing = false;
      }
    } else {
      // empty block (e.g. <li></li>) - append the ellipsis inside it
      lastNode.appendChild(ellipsisNode);
      if (overflows(contentsBottom(ellipsisNode))) {
        lastNode.parentNode?.removeChild(lastNode);
      } else {
        isOverflowing = false;
      }
    }
  }
}

// Repeatedly removes content immediately after the ellipsis - a single
// character, or a whole img / br / empty block - until `checkFits` reports the
// trailing content fits on the ellipsis line.
// Shared by the head and middle modes.
export function eatForwardUntilFits(
  sandbox: HTMLElement,
  ellipsisNode: Node,
  checkFits: () => boolean
) {
  while (!checkFits()) {
    const walker = document.createTreeWalker(
      sandbox,
      NodeFilter.SHOW_ALL,
      walkerFilter
    );
    walker.currentNode = ellipsisNode;
    const nextNode = walker.nextNode();

    if (!nextNode) break;

    if (
      nextNode.nodeName === 'IMG' ||
      nextNode.nodeName === 'BR' ||
      BLOCK_TAGS.has(nextNode.nodeName)
    ) {
      removeAndCleanUp(nextNode, sandbox);
    } else {
      const t = nextNode as Text;
      if (t.length > 1) t.nodeValue = t.nodeValue!.slice(1);
      else removeAndCleanUp(t, sandbox);
    }
  }
}
