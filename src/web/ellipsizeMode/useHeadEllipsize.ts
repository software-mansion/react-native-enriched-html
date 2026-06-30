import { useLayoutEffect } from 'react';
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

export function useHeadEllipsize(
  containerRef: React.RefObject<HTMLDivElement | null>,
  finalHtml: string,
  setClampedHtml: (clampedHtml: string) => void
) {
  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const NUMBER_OF_LINES = 2;

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

    // forward scan - we gather data about nodes that start each new line
    const walker = document.createTreeWalker(
      sandbox,
      NodeFilter.SHOW_ALL,
      walkerFilter
    );
    const range = document.createRange();

    const lineStarts: Array<{ node: Node; index: number }> = [];
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

          if (lastBottom === null || rect.bottom > lastBottom + 4) {
            currentLine++;
            lineStarts[currentLine] = { node: textNode, index: i };
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
        lastBottom = rect.bottom;
      }
    }

    const originalLastLine = currentLine;

    // we need to truncate as number of lines overflows the given maximum
    if (originalLastLine > NUMBER_OF_LINES) {
      let targetNode: Node | null = null;
      let overflowStartNode: Node | null = null;

      // if true, it means that there are lines that we can safely delete
      // between the first valid ones that we leave untouched
      // and the last two lines that will become the line with the ellipsis
      if (originalLastLine > NUMBER_OF_LINES + 1) {
        const lastMark = lineStarts[originalLastLine]!;
        // the second last line
        let safeMark = lineStarts[originalLastLine - 1]!;

        // if they are in different blocks, it means we can safely
        // delete also the second to last line
        if (getBlockParent(safeMark.node) !== getBlockParent(lastMark.node)) {
          safeMark = lastMark;
        }

        // we need to perform two splits to safely delete only a part of block's content
        if (safeMark.node.nodeType === Node.TEXT_NODE && safeMark.index > 0) {
          const t = safeMark.node as Text;
          const rightSplit = document.createTextNode(
            t.nodeValue!.slice(safeMark.index)
          );
          t.nodeValue = t.nodeValue!.slice(0, safeMark.index);
          t.parentNode?.insertBefore(rightSplit, t.nextSibling);
          targetNode = rightSplit;
        } else {
          targetNode = safeMark.node;
        }

        const startMark = lineStarts[NUMBER_OF_LINES]!;
        overflowStartNode = startMark.node;
        if (
          overflowStartNode.nodeType === Node.TEXT_NODE &&
          startMark.index > 0
        ) {
          const t = overflowStartNode as Text;
          const leftSplit = document.createTextNode(
            t.nodeValue!.slice(startMark.index)
          );
          t.nodeValue = t.nodeValue!.slice(0, startMark.index);
          t.parentNode?.insertBefore(leftSplit, t.nextSibling);
          overflowStartNode = leftSplit;
        }

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
        toRm.forEach(removeAndCleanUp);
      } else {
        // this branch handles the case where exactly one line overflows,
        // which means we have no lines to safely delete before those two last lines

        const startMark = lineStarts[NUMBER_OF_LINES]!; // the second to last line
        const tailMark = lineStarts[originalLastLine]!;

        // if the second to last line is in a different block than the last one,
        // we can safely delete it
        if (getBlockParent(startMark.node) !== getBlockParent(tailMark.node)) {
          overflowStartNode = startMark.node;

          // we perform the same two splits we needed in the previous 'if' branch
          if (
            overflowStartNode.nodeType === Node.TEXT_NODE &&
            startMark.index > 0
          ) {
            const t = overflowStartNode as Text;
            const leftSplit = document.createTextNode(
              t.nodeValue!.slice(startMark.index)
            );
            t.nodeValue = t.nodeValue!.slice(0, startMark.index);
            t.parentNode?.insertBefore(leftSplit, t.nextSibling);
            overflowStartNode = leftSplit;
          }

          targetNode = tailMark.node;
          if (targetNode.nodeType === Node.TEXT_NODE && tailMark.index > 0) {
            const t = targetNode as Text;
            const rightSplit = document.createTextNode(
              t.nodeValue!.slice(tailMark.index)
            );
            t.nodeValue = t.nodeValue!.slice(0, tailMark.index);
            t.parentNode?.insertBefore(rightSplit, t.nextSibling);
            targetNode = rightSplit;
          }

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
          toRm.forEach(removeAndCleanUp);
        } else {
          // the last two lines are in the same block - needs character by character truncation
          targetNode = startMark.node;

          // the split is also needed here so we can insert a <br> if needed
          if (targetNode.nodeType === Node.TEXT_NODE && startMark.index > 0) {
            const t = targetNode as Text;
            const rightSplit = document.createTextNode(
              t.nodeValue!.slice(startMark.index)
            );
            t.nodeValue = t.nodeValue!.slice(0, startMark.index);
            t.parentNode?.insertBefore(rightSplit, t.nextSibling);
            targetNode = rightSplit;
          }
        }
      }

      const ellipsisNode = document.createTextNode('...');

      if (targetNode) {
        // if we have an empty block, eg. <li></li>, we append the ellipsis inside it
        if (
          targetNode.nodeType === Node.ELEMENT_NODE &&
          BLOCK_TAGS.has(targetNode.nodeName)
        ) {
          targetNode.appendChild(ellipsisNode);
        } else {
          const prevWalker = document.createTreeWalker(
            sandbox,
            NodeFilter.SHOW_ALL,
            walkerFilter
          );
          prevWalker.currentNode = targetNode;
          const prevNode = prevWalker.previousNode();

          // we need a <br> to make sure the ellipsis sits at the start of the line
          if (
            prevNode &&
            prevNode.nodeName !== 'BR' &&
            getBlockParent(prevNode) === getBlockParent(targetNode)
          ) {
            const brNode = document.createElement('br');
            targetNode.parentNode?.insertBefore(brNode, targetNode);
          }

          targetNode.parentNode?.insertBefore(ellipsisNode, targetNode);
        }
      }

      // now we are left with at most two lines that we have to merge into one - the ellipsis line

      // helper to check if everything on those two last lines fit into one
      const checkFits = () => {
        range.selectNodeContents(ellipsisNode);
        const targetBottom = range.getBoundingClientRect().bottom;

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

      // truncating until those two last lines fit
      while (true) {
        if (checkFits()) break;

        const tw = document.createTreeWalker(
          sandbox,
          NodeFilter.SHOW_ALL,
          walkerFilter
        );
        tw.currentNode = ellipsisNode;
        const nextNode = tw.nextNode();

        if (!nextNode) break;

        if (
          nextNode.nodeName === 'IMG' ||
          nextNode.nodeName === 'BR' ||
          BLOCK_TAGS.has(nextNode.nodeName)
        ) {
          removeAndCleanUp(nextNode);
        } else {
          const t = nextNode as Text;
          if (t.length > 1) t.nodeValue = t.nodeValue!.slice(1);
          else removeAndCleanUp(t);
        }
      }

      setClampedHtml(sandbox.innerHTML);
    } else {
      setClampedHtml(finalHtml);
    }

    container.removeChild(sandbox);
  }, [containerRef, finalHtml, setClampedHtml]);
}
