import {
  createSandbox,
  eatBackwardUntilFits,
  removeAfterTarget,
  scanLines,
} from './utils';

// Truncate the content to `numberOfLines` by hard-cutting the overflow, with no
// ellipsis. We render the full HTML into a hidden sandbox and do a single
// forward line scan to learn where each rendered line begins. If the content
// fits, we keep it as it is. Otherwise we take the first node on the first
// forbidden line (line N+1) as the target, drop everything "to the right" of it
// in the document context, then trim backwards one unit at a time
// (character / img / br / empty block) until what remains fits within line N.
// This works almost the same as tail, only without re-anchoring an ellipsis as we shrink.
export function clip(
  container: HTMLDivElement,
  finalHtml: string,
  numberOfLines: number,
  setClampedHtml: (clampedHtml: string) => void
) {
  const { sandbox, lineTolerance } = createSandbox(container, finalHtml);

  // forward scan - we find the first element that overflows to the forbidden line
  const { lineStarts, lineBottoms, lastLine } = scanLines(
    sandbox,
    lineTolerance
  );

  // the node that starts the overflow
  const targetNode =
    lastLine > numberOfLines ? lineStarts[numberOfLines + 1] : undefined;

  // we remove content until everything fits within the given number of lines
  if (targetNode) {
    // remove all content on "the right" of the targetNode
    removeAfterTarget(targetNode.node, sandbox);

    // remove content backwards until it fits - unlike tail, clip adds no ellipsis
    eatBackwardUntilFits(
      sandbox,
      lineBottoms[numberOfLines] ?? null,
      lineTolerance,
      false
    );

    setClampedHtml(sandbox.innerHTML);
  } else {
    setClampedHtml(finalHtml);
  }

  container.removeChild(sandbox);
}
