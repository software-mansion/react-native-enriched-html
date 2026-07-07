import { headEllipsize } from './headEllipsize';
import {
  createSandbox,
  eatForwardUntilFits,
  fitsWithin,
  getBlockParent,
  removeAndCleanUp,
  scanLines,
  splitTextNode,
  walkerFilter,
  type LineMark,
} from './utils';

// Keep the head and the tail of the content, collapsing the middle into a single
// "..." that lands near the horizontal centre of line N. We render the full HTML
// into a hidden sandbox, compute the container's physical mid-X, then forward-scan
// the lines - on line N we record the first mark that reaches past the centre and
// this is where the ellipsis goes.
// If it fits, we keep it as it is. Otherwise:
//   - A true inline middle only works when the front (line N) and the tail (last
//     line) live in the same block with no <br> between them. If not (different
//     blocks, or a <br> in the way), we bail and delegate to headEllipsize, which
//     handles block-structured truncation.
//   - Otherwise we split the front line at the centre mark, and - when more than
//     one line overflows - also split at the second-to-last line and safely delete
//     every node between the two split points. We insert "..." at the join, then eat
//     forward one unit at a time until the surviving tail fits back onto line N.
export function middleEllipsize(
  container: HTMLDivElement,
  finalHtml: string,
  numberOfLines: number,
  setClampedHtml: (clampedHtml: string) => void
) {
  const { sandbox, computedStyle, lineTolerance } = createSandbox(
    container,
    finalHtml
  );

  // find the exact physical center of the container
  const sandboxRect = sandbox.getBoundingClientRect();
  const pl = parseFloat(computedStyle.paddingLeft) || 0;
  const pr = parseFloat(computedStyle.paddingRight) || 0;
  const innerWidth = sandboxRect.width - pl - pr;
  const midX = sandboxRect.left + pl + innerWidth / 2;

  const range = document.createRange();

  // as we scan, we track the mark closest to the container's horizontal centre
  // on the Nth line (`centre`) and the last mark on that line (`fallback`) -
  // that's where the middle ellipsis will land.
  const marks: { centre: LineMark | null; fallback: LineMark | null } = {
    centre: null,
    fallback: null,
  };
  const { lineStarts, lastLine: originalLastLine } = scanLines(
    sandbox,
    lineTolerance,
    ({ currentLine, node, index, rect }) => {
      if (currentLine === numberOfLines) {
        marks.fallback = { node, index };
        if (!marks.centre && rect.right >= midX) {
          marks.centre = { node, index };
        }
      }
    }
  );

  // fall back to the last mark on the Nth line if nothing reached the centre
  const middleMark: LineMark | null = marks.centre ?? marks.fallback;

  // everything fits in the given N lines
  if (originalLastLine <= numberOfLines) {
    setClampedHtml(finalHtml);
    container.removeChild(sandbox);
    return;
  }

  // a true inline middle only works within a single block with no <br> between
  // the front and the tail - otherwise we delegate to headEllipsize below
  let canDoMiddle = false;
  const frontMark = lineStarts[numberOfLines];
  const tailMark = lineStarts[originalLastLine];

  if (frontMark && tailMark && middleMark) {
    const frontParent = getBlockParent(frontMark.node, sandbox);
    const tailParent = getBlockParent(tailMark.node, sandbox);

    if (frontParent === tailParent) {
      canDoMiddle = true;

      if (
        frontMark.node.nodeName === 'BR' ||
        tailMark.node.nodeName === 'BR' ||
        middleMark.node.nodeName === 'BR'
      ) {
        canDoMiddle = false;
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
            break;
          }
        }
      }
    }
  }

  if (!canDoMiddle) {
    container.removeChild(sandbox);
    return headEllipsize(container, finalHtml, numberOfLines, setClampedHtml);
  }

  // split the front line at the centre mark to carve out where the ellipsis lands
  let frontRightSplit: Node;

  if (middleMark!.node.nodeType === Node.TEXT_NODE) {
    frontRightSplit = splitTextNode(
      middleMark!.node as Text,
      middleMark!.index
    );
  } else {
    // front split landed on an element - inject an invisible text boundary
    frontRightSplit = document.createTextNode('');
    middleMark!.node.parentNode?.insertBefore(
      frontRightSplit,
      middleMark!.node.nextSibling
    );
  }

  let targetNode: Node = frontRightSplit;

  // more than one line overflows - we can safely delete the middle lines
  if (originalLastLine > numberOfLines + 1) {
    const backMark = lineStarts[originalLastLine - 1]!;

    let backRightSplit: Node;

    if (backMark.node.nodeType === Node.TEXT_NODE) {
      // if the front split already carved up the same node, the initially
      // computed back mark is stale and has to be rebased onto the right half of that split
      if (
        middleMark!.node.nodeType === Node.TEXT_NODE &&
        backMark.node === middleMark!.node
      ) {
        backMark.node = frontRightSplit;
        backMark.index -= middleMark!.index;
      }

      backRightSplit = splitTextNode(backMark.node as Text, backMark.index);
    } else {
      backRightSplit = backMark.node;
    }

    // we safely bulk-delete those middle lines
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

    toRm.forEach((n) => removeAndCleanUp(n, sandbox));

    targetNode = backRightSplit;
  }

  const ellipsisNode = document.createTextNode('...');
  targetNode.parentNode?.insertBefore(ellipsisNode, targetNode);

  // everything after the ellipsis has to fit on the front line (the Nth line)
  const checkFits = () => {
    let targetBottom: number;
    if (frontMark!.node.nodeType === Node.TEXT_NODE) {
      const tNode = frontMark!.node as Text;

      // we grab the exact character index that started the Nth line
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

    return fitsWithin(sandbox, ellipsisNode, targetBottom, lineTolerance);
  };

  eatForwardUntilFits(sandbox, ellipsisNode, checkFits);

  setClampedHtml(sandbox.innerHTML);
  container.removeChild(sandbox);
}
