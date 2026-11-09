import { useLayoutEffect, type RefObject } from 'react';

// Finds the ordered list markers with the largest values,
// exposing the digit count as --et-ol-digits per <ol>.
export function useOrderedListMarkerWidth(
  containerRef: RefObject<HTMLElement | null>,
  finalHtml: string
) {
  useLayoutEffect(() => {
    const root = containerRef.current;
    if (!root) return;

    root.querySelectorAll('ol').forEach((ol) => {
      const startAttr = Number(ol.getAttribute('start'));
      const start = Number.isFinite(startAttr) && startAttr > 0 ? startAttr : 1;
      const maxNumber = start + Math.max(0, ol.children.length - 1);
      ol.style.setProperty('--et-ol-digits', String(String(maxNumber).length));
    });
  }, [containerRef, finalHtml]);
}
