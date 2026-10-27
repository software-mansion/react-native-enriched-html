import type { EditorView } from '@tiptap/pm/view';
import type { TextRange, TextRect } from '../../types';
import { nativePosToTiptapPos } from '../nativeMappers/positionMapping';
import { ENRICHED_TEXT_INPUT_CLASSNAME } from '../constants/classNames';

function toTextRect(
  rect: { left: number; top: number; width: number; height: number },
  origin: DOMRect
): TextRect {
  return {
    x: rect.left - origin.left,
    y: rect.top - origin.top,
    width: rect.width,
    height: rect.height,
  };
}

function caretRect(view: EditorView, pos: number, origin: DOMRect): TextRect[] {
  const { left, top, bottom } = view.coordsAtPos(pos);
  if (bottom <= top) return [];
  return [toTextRect({ left, top, width: 0, height: bottom - top }, origin)];
}

function rangeRects(
  view: EditorView,
  from: number,
  to: number,
  origin: DOMRect
): TextRect[] {
  const rects: TextRect[] = [];
  const domRange = view.dom.ownerDocument.createRange();

  // Measure text nodes one at a time, so that the boxes of elements fully
  // inside the range (paragraphs, marks) are not reported on top of the text
  view.state.doc.nodesBetween(from, to, (node, pos) => {
    if (node.isText) {
      const start = view.domAtPos(Math.max(from, pos), 1);
      const end = view.domAtPos(Math.min(to, pos + node.nodeSize), -1);
      domRange.setStart(start.node, start.offset);
      domRange.setEnd(end.node, end.offset);
      for (const rect of Array.from(domRange.getClientRects())) {
        if (rect.width > 0 && rect.height > 0) {
          rects.push(toTextRect(rect, origin));
        }
      }
      return false;
    }
    if (node.isInline && node.isAtom) {
      // Inline images
      const rect = (
        view.nodeDOM(pos) as Element | null
      )?.getBoundingClientRect?.();
      if (rect && rect.width > 0 && rect.height > 0) {
        rects.push(toTextRect(rect, origin));
      }
      return false;
    }
    return true;
  });

  return rects;
}

/**
 * Measures where the given native-indexed ranges are drawn, relative to the
 * input's top-left corner.
 */
export function measureRanges(
  view: EditorView,
  ranges: ReadonlyArray<TextRange>
): TextRect[][] {
  const doc = view.state.doc;
  const origin = (
    view.dom.closest(`.${ENRICHED_TEXT_INPUT_CLASSNAME}`) ?? view.dom
  ).getBoundingClientRect();

  return ranges.map(({ start, end }) => {
    const nativeStart = Math.max(0, Math.min(start, end));
    const nativeEnd = Math.max(0, Math.max(start, end));
    const from = nativePosToTiptapPos(doc, nativeStart);
    if (nativeStart === nativeEnd) {
      return caretRect(view, from, origin);
    }
    return rangeRects(view, from, nativePosToTiptapPos(doc, nativeEnd), origin);
  });
}
