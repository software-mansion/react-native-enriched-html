import { ENRICHED_TEXT_CLASSNAME } from '../constants/classNames';
import { headEllipsize } from './headEllipsize';

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

export function middleEllipsize(
  container: HTMLDivElement,
  finalHtml: string,
  numberOfLines: number,
  setClampedHtml: (clampedHtml: string) => void
) {
  const NUMBER_OF_LINES = numberOfLines;

  // --- PHASE 1: THE DISCOVERY SCAN ---
  const sandbox = document.createElement('div');
  const computedStyle = window.getComputedStyle(container);

  sandbox.style.position = 'absolute';
  sandbox.style.visibility = 'hidden';
  sandbox.style.top = '-9999px';

  sandbox.style.cssText = container.style.cssText;
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

  // --- GEOMETRIC MATH: Find the exact physical center of the container ---
  const sandboxRect = sandbox.getBoundingClientRect();
  const pl = parseFloat(computedStyle.paddingLeft) || 0;
  const pr = parseFloat(computedStyle.paddingRight) || 0;
  const innerWidth = sandboxRect.width - pl - pr;
  const midX = sandboxRect.left + pl + innerWidth / 2;
  console.log(
    `[DEBUG] Container Inner Width: ${innerWidth}px, Physical Midpoint X: ${midX}px`
  );

  const walkerFilter = {
    acceptNode: (n: Node) => {
      if (n.nodeType === Node.TEXT_NODE) return NodeFilter.FILTER_ACCEPT;
      if (n.nodeName === 'IMG' || n.nodeName === 'BR')
        return NodeFilter.FILTER_ACCEPT;

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

  const getBlockParent = (node: Node | null): Element | null => {
    let current = node?.parentElement;
    while (current && current !== sandbox) {
      if (BLOCK_TAGS.has(current.tagName)) return current;
      current = current.parentElement;
    }
    return sandbox;
  };

  const removeAndCleanUp = (nd: Node) => {
    let parent: ParentNode | null = nd.parentNode;
    if (parent) {
      parent.removeChild(nd);
      while (parent && parent !== sandbox && parent.childNodes.length === 0) {
        const p: ParentNode | null = parent.parentNode;
        p?.removeChild(parent);
        parent = p;
      }
    }
  };

  const walker = document.createTreeWalker(
    sandbox,
    NodeFilter.SHOW_ALL,
    walkerFilter
  );
  const range = document.createRange();

  const lineStarts: Array<{ node: Node; index: number }> = [];
  let currentLine = 0;
  let lastBottom: number | null = null;

  let middleMark: { node: Node; index: number } | null = null;
  let fallbackMiddleMark: { node: Node; index: number } | null = null;

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

        if (lastBottom === null || rect.bottom > lastBottom + 4) {
          currentLine++;
          lineStarts[currentLine] = { node: textNode, index: i };
        }

        if (currentLine === NUMBER_OF_LINES) {
          fallbackMiddleMark = { node: textNode, index: i };
          if (!middleMark && rect.right >= midX) {
            middleMark = { node: textNode, index: i };
            console.log(
              `[DEBUG] Found text MiddleMark at index ${i} ('${text[i]}')`
            );
          }
        }

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

      if (lastBottom === null || rect.bottom > lastBottom + 4) {
        currentLine++;
        lineStarts[currentLine] = { node: el, index: 0 };
      }

      if (currentLine === NUMBER_OF_LINES) {
        fallbackMiddleMark = { node: el, index: 0 };
        if (!middleMark && rect.right >= midX) {
          middleMark = { node: el, index: 0 };
          console.log(`[DEBUG] Found element MiddleMark on node:`, el.nodeName);
        }
      }
      lastBottom = rect.bottom;
    }
  }

  if (!middleMark) {
    middleMark = fallbackMiddleMark;
    console.log(`[DEBUG] MiddleMark fell back to end of line:`, middleMark);
  }

  const originalLastLine = currentLine;
  console.log(
    `[DEBUG] Total lines detected: ${originalLastLine}. Target limit: ${NUMBER_OF_LINES}`
  );

  if (originalLastLine <= NUMBER_OF_LINES) {
    console.log(`[DEBUG] Document perfectly fits! No truncation required.`);
    setClampedHtml(finalHtml);
    container.removeChild(sandbox);
    return;
  }

  // --- PHASE 2: SMART ROUTER ---
  let canDoMiddle = false;
  const frontMark = lineStarts[NUMBER_OF_LINES];
  const tailMark = lineStarts[originalLastLine];

  if (frontMark && tailMark && middleMark) {
    console.log(`[DEBUG] Router checking block parents...`);
    const frontParent = getBlockParent(frontMark.node);
    const tailParent = getBlockParent(tailMark.node);

    if (frontParent === tailParent) {
      canDoMiddle = true;
      console.log(
        `[DEBUG] Front and Tail share the same block parent:`,
        frontParent?.nodeName
      );

      if (
        frontMark.node.nodeName === 'BR' ||
        tailMark.node.nodeName === 'BR' ||
        middleMark.node.nodeName === 'BR'
      ) {
        canDoMiddle = false;
        console.log(`[DEBUG] Router rejected: Direct anchor is a <BR>`);
      } else {
        const brWalker = document.createTreeWalker(
          sandbox,
          NodeFilter.SHOW_ALL,
          walkerFilter
        );
        brWalker.currentNode = frontMark.node;

        while (brWalker.nextNode()) {
          if (brWalker.currentNode === tailMark.node) break;

          if (brWalker.currentNode.nodeName === 'BR') {
            canDoMiddle = false;
            console.log(
              `[DEBUG] Router rejected: Found <BR> in the truncation gap`
            );
            break;
          }
        }
      }
    } else {
      console.log(
        `[DEBUG] Router rejected: Block parent mismatch. Front:`,
        frontParent?.nodeName,
        `Tail:`,
        tailParent?.nodeName
      );
    }
  }

  if (!canDoMiddle) {
    console.log(
      '[DEBUG] Complex DOM or <br> detected. Routing to Head Ellipsize.'
    );
    container.removeChild(sandbox);
    return headEllipsize(container, finalHtml, numberOfLines, setClampedHtml);
  }

  console.log('[DEBUG] Proceeding with TRUE INLINE MIDDLE truncation.');

  // --- PHASE 3: TRUE INLINE MIDDLE (UNIFIED LOGIC) ---
  let frontRightSplit: Node;

  if (middleMark!.node.nodeType === Node.TEXT_NODE) {
    const frontTextNode = middleMark!.node as Text;
    const frontMidIndex = middleMark!.index;

    frontRightSplit = document.createTextNode(
      frontTextNode.nodeValue!.slice(frontMidIndex)
    );
    frontTextNode.nodeValue = frontTextNode.nodeValue!.slice(0, frontMidIndex);
    frontTextNode.parentNode?.insertBefore(
      frontRightSplit,
      frontTextNode.nextSibling
    );
    console.log(`[DEBUG] Split front text node at index ${frontMidIndex}.`);
  } else {
    frontRightSplit = document.createTextNode('');
    middleMark!.node.parentNode?.insertBefore(
      frontRightSplit,
      middleMark!.node.nextSibling
    );
    console.log(
      `[DEBUG] Front split landed on element. Injected invisible boundary.`
    );
  }

  let targetNode: Node = frontRightSplit;

  if (originalLastLine > NUMBER_OF_LINES + 1) {
    console.log(
      `[DEBUG] Triggering bulk deletion. Deleting lines between ${NUMBER_OF_LINES} and ${originalLastLine - 1}`
    );
    const backMark = lineStarts[originalLastLine - 1]!;

    let backRightSplit: Node;

    if (backMark.node.nodeType === Node.TEXT_NODE) {
      if (
        middleMark!.node.nodeType === Node.TEXT_NODE &&
        backMark.node === middleMark!.node
      ) {
        console.log(
          `[DEBUG] Safety patch: Back mark shifted due to same-node split.`
        );
        backMark.node = frontRightSplit;
        backMark.index -= middleMark!.index;
      }

      const backTextNode = backMark.node as Text;
      const backIndex = backMark.index;

      backRightSplit = document.createTextNode(
        backTextNode.nodeValue!.slice(backIndex)
      );
      backTextNode.nodeValue = backTextNode.nodeValue!.slice(0, backIndex);
      backTextNode.parentNode?.insertBefore(
        backRightSplit,
        backTextNode.nextSibling
      );
    } else {
      backRightSplit = backMark.node;
    }

    const rmWalker = document.createTreeWalker(
      sandbox,
      NodeFilter.SHOW_ALL,
      walkerFilter
    );
    let past = false;
    const toRm: Node[] = [];
    while (rmWalker.nextNode()) {
      if (rmWalker.currentNode === frontRightSplit) past = true;
      else if (rmWalker.currentNode === backRightSplit) break;

      if (past) toRm.push(rmWalker.currentNode);
    }

    console.log(`[DEBUG] Bulk deletion vaporizing ${toRm.length} nodes.`);
    toRm.forEach(removeAndCleanUp);

    targetNode = backRightSplit;
  }

  const ellipsisNode = document.createTextNode('...');
  targetNode.parentNode?.insertBefore(ellipsisNode, targetNode);

  // --- THE INNER-EATING LOOP ---
  const checkFits = () => {
    let targetBottom: number;
    if (frontMark!.node.nodeType === Node.TEXT_NODE) {
      const tNode = frontMark!.node as Text;

      // We grab the exact character index that started the Nth line
      // Math.min is a tiny safety net just in case the node was heavily truncated
      const safeIndex = Math.min(
        frontMark!.index,
        Math.max(0, tNode.length - 1)
      );

      range.setStart(tNode, safeIndex);
      range.setEnd(tNode, safeIndex + 1);
      targetBottom = range.getBoundingClientRect().bottom;
    } else {
      targetBottom = (frontMark!.node as HTMLElement).getBoundingClientRect()
        .bottom;
    }

    let lastNode: Node | null = null;
    const w = document.createTreeWalker(
      sandbox,
      NodeFilter.SHOW_ALL,
      walkerFilter
    );
    w.currentNode = ellipsisNode;
    while (w.nextNode()) lastNode = w.currentNode;

    if (!lastNode) return true;

    if (lastNode.nodeType === Node.TEXT_NODE) {
      if ((lastNode as Text).length === 0) return true;
      range.selectNodeContents(lastNode);
      return range.getBoundingClientRect().bottom <= targetBottom + 4;
    } else {
      return (
        (lastNode as HTMLElement).getBoundingClientRect().bottom <=
        targetBottom + 4
      );
    }
  };

  console.log('[DEBUG] INITIAL DOM BEFORE EATING:', sandbox.innerHTML);
  let stepCount = 0;

  while (true) {
    if (checkFits()) {
      console.log(`[DEBUG] FITS! Loop finished after ${stepCount} steps.`);
      break;
    }

    stepCount++;
    const tw = document.createTreeWalker(
      sandbox,
      NodeFilter.SHOW_ALL,
      walkerFilter
    );
    tw.currentNode = ellipsisNode;
    const nextNode = tw.nextNode();

    if (!nextNode) {
      console.log(`[DEBUG] NO NEXT NODE! Aborting loop early.`);
      break;
    }

    if (
      nextNode.nodeName === 'IMG' ||
      nextNode.nodeName === 'BR' ||
      BLOCK_TAGS.has(nextNode.nodeName)
    ) {
      removeAndCleanUp(nextNode);
      console.log(
        `[DEBUG - Step ${stepCount}] Removed Element Node:`,
        nextNode.nodeName
      );
    } else {
      const t = nextNode as Text;
      if (t.length > 1) {
        const deletedChar = t.nodeValue!.slice(0, 1);
        t.nodeValue = t.nodeValue!.slice(1);
        console.log(
          `[DEBUG - Step ${stepCount}] Ate character: "${deletedChar}"`
        );
      } else {
        removeAndCleanUp(t);
        console.log(
          `[DEBUG - Step ${stepCount}] Removed empty/single-char text node.`
        );
      }
    }

    console.log(`[DEBUG - Step ${stepCount}] CURRENT DOM:`, sandbox.innerHTML);
  }

  console.log(`[DEBUG] Final clamped output set!`);
  setClampedHtml(sandbox.innerHTML);
  container.removeChild(sandbox);
}
