import {
  BLOCK_TAGS,
  createSandbox,
  eatForwardUntilFits,
  fitsWithin,
  getBlockParent,
  innermostEmptyBlock,
  markLastListOrdinal,
  removeAndCleanUp,
  restoreLastListOrdinal,
  scanLines,
  splitAtMark,
  walkerFilter,
} from './utils';

// Keep the total of `numberOfLines` lines - the first original N-1 lines and
// the last one starting with a leading ellipsis, hiding the truncation between
// that last line and the first N-1 lines. We render the full HTML into a hidden
// sandbox and forward-scan to find where each line begins. If it fits, keep as it is.
// Otherwise:
//   - If more than one line overflows (lastLine > N+1), there are whole middle
//     lines we can delete outright. We split the DOM at the start of line N
//     and at the second-to-last line, then walk between those two points
//     removing every node in that range.
//   - If exactly one line overflows, we proceed further.
//
// When the last two lines live in different blocks we can still safely drop
// that second-to-last line. We then insert the "..." at the start of the surviving tail
// (adding a <br> to make sure it sits at the absolute line start). We then finally
// eat forward one unit at a time until the ellipsis and the content after it fit
// together on that single ellipsis line.
export function headEllipsize(
  container: HTMLDivElement,
  finalHtml: string,
  numberOfLines: number,
  setClampedHtml: (clampedHtml: string) => void
) {
  const { sandbox, lineTolerance } = createSandbox(container, finalHtml);
  const range = document.createRange();

  // forward scan - we gather data about nodes that start each new line
  const { lineStarts, lastLine: originalLastLine } = scanLines(
    sandbox,
    lineTolerance
  );

  // we need to truncate as number of lines overflows the given maximum
  if (originalLastLine > numberOfLines) {
    // remember the ordinal of the <li> that owns the last line before we strip
    // the items above it, so it keeps its original number
    markLastListOrdinal(lineStarts[originalLastLine]!.node, sandbox);

    let targetNode: Node | null = null;
    let overflowStartNode: Node | null = null;

    // if true, it means that there are lines that we can safely delete
    // between the first N-1 valid ones that we leave untouched
    // and the last two lines that will become the line with the ellipsis
    if (originalLastLine > numberOfLines + 1) {
      const lastMark = lineStarts[originalLastLine]!;
      // the second last line
      let safeMark = lineStarts[originalLastLine - 1]!;

      // if they are in different blocks, it means we can safely
      // delete also the second to last line
      if (
        getBlockParent(safeMark.node, sandbox) !==
        getBlockParent(lastMark.node, sandbox)
      ) {
        safeMark = lastMark;
      }

      // we split so we only delete a part of the block's content
      targetNode = splitAtMark(safeMark);

      const startMark = lineStarts[numberOfLines]!;
      overflowStartNode = splitAtMark(startMark);

      // we delete the lines
      const rmWalker = document.createTreeWalker(
        sandbox,
        NodeFilter.SHOW_ALL,
        walkerFilter
      );
      let past = false;
      const toRm: Node[] = [];
      while (rmWalker.nextNode()) {
        if (rmWalker.currentNode === overflowStartNode) past = true;
        else if (rmWalker.currentNode === targetNode) break;

        if (past) toRm.push(rmWalker.currentNode);
      }
      toRm.forEach((n) => removeAndCleanUp(n, sandbox));
    } else {
      // this branch handles the case where exactly one line overflows,
      // which means we have no lines to safely delete before those two last lines

      const startMark = lineStarts[numberOfLines]!; // the second to last line
      const tailMark = lineStarts[originalLastLine]!;

      // if the second to last line is in a different block than the last one,
      // we can safely delete it
      if (
        getBlockParent(startMark.node, sandbox) !==
        getBlockParent(tailMark.node, sandbox)
      ) {
        // we perform the same two splits we needed in the previous branch
        overflowStartNode = splitAtMark(startMark);
        targetNode = splitAtMark(tailMark);

        // delete the line
        const rmWalker = document.createTreeWalker(
          sandbox,
          NodeFilter.SHOW_ALL,
          walkerFilter
        );
        let past = false;
        const toRm: Node[] = [];
        while (rmWalker.nextNode()) {
          if (rmWalker.currentNode === overflowStartNode) past = true;
          else if (rmWalker.currentNode === targetNode) break;

          if (past) toRm.push(rmWalker.currentNode);
        }
        toRm.forEach((n) => removeAndCleanUp(n, sandbox));
      } else {
        // the last two lines are in the same block - needs character by character truncation.
        // The split is also needed here so we can insert a <br> if needed
        targetNode = splitAtMark(startMark);
      }
    }

    // now we append the ellipsis and start the truncation at the targetNode
    const ellipsisNode = document.createTextNode('...');

    if (targetNode) {
      // if we have an empty block, eg. <li></li>, we append the ellipsis inside it
      if (
        targetNode.nodeType === Node.ELEMENT_NODE &&
        BLOCK_TAGS.has(targetNode.nodeName)
      ) {
        innermostEmptyBlock(targetNode as Element).appendChild(ellipsisNode);
      } else {
        const prevWalker = document.createTreeWalker(
          sandbox,
          NodeFilter.SHOW_ALL,
          walkerFilter
        );
        prevWalker.currentNode = targetNode;
        const prevNode = prevWalker.previousNode();

        // if the targetNode isn't starting a paragraph of its own,
        // we need a <br> to make sure the ellipsis sits at the start of the line
        if (
          prevNode &&
          prevNode.nodeName !== 'BR' &&
          getBlockParent(prevNode, sandbox) ===
            getBlockParent(targetNode, sandbox)
        ) {
          const brNode = document.createElement('br');
          targetNode.parentNode?.insertBefore(brNode, targetNode);
        }

        targetNode.parentNode?.insertBefore(ellipsisNode, targetNode);
      }
    }

    // now we are left with at most two lines that we have to merge into one - the ellipsis line

    // everything after the ellipsis has to fit on the ellipsis' own line
    const checkFits = () => {
      range.selectNodeContents(ellipsisNode);
      const targetBottom = range.getBoundingClientRect().bottom;
      return fitsWithin(sandbox, ellipsisNode, targetBottom, lineTolerance);
    };

    // truncating until those two last lines fit
    eatForwardUntilFits(sandbox, ellipsisNode, checkFits);

    // restore the saved ordinal onto the surviving tail <li>
    restoreLastListOrdinal(sandbox);

    setClampedHtml(sandbox.innerHTML);
  } else {
    setClampedHtml(finalHtml);
  }

  container.removeChild(sandbox);
}
