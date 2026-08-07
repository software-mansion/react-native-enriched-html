import {
  createSandbox,
  eatBackwardUntilFits,
  removeAfterTarget,
  scanLines,
} from './utils';

// Keep the first `numberOfLines` lines and end them with an ellipsis. We render
// the full HTML into a hidden sandbox and do a single forward line scan to learn
// where each rendered line begins. If the content fits, we keep it as it is.
// Otherwise we take the first node on the first forbidden line (line N+1) as the
// target, drop everything "to the right" of it in the document context, then we
// perform binary-search to find where to cut the content, so everything fits within
// line N - re-anchoring the "..." onto the current trailing content each
// iteration. Conceptually similar as clip, but with the trailing ellipsis.
export function tailEllipsize(
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

    // now we append the ellipsis "...", but it might overflow again, so we
    // remove content backwards until it fits
    eatBackwardUntilFits(
      sandbox,
      lineBottoms[numberOfLines] ?? null,
      lineTolerance,
      true
    );

    setClampedHtml(sandbox.innerHTML);
  } else {
    setClampedHtml(finalHtml);
  }

  container.removeChild(sandbox);
}
