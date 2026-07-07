import { useLayoutEffect, type RefObject } from 'react';
import { headEllipsize } from './headEllipsize';
import { clip } from './clip';
import { tailEllipsize } from './tailEllipsize';
import { middleEllipsize } from './middleEllipsize';
import type { EnrichedTextProps } from '../../';

type EllipsizeMode = NonNullable<EnrichedTextProps['ellipsizeMode']>;

interface EllipsizeOptions {
  containerRef: RefObject<HTMLDivElement | null>;
  finalHtml: string;
  ellipsizeMode: EllipsizeMode;
  numberOfLines: number;
  setClampedHtml: (html: string) => void;
}

export function useEllipsizeMode({
  containerRef,
  finalHtml,
  ellipsizeMode,
  numberOfLines,
  setClampedHtml,
}: EllipsizeOptions) {
  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    if (numberOfLines <= 0) {
      setClampedHtml(finalHtml);
      return;
    }

    switch (ellipsizeMode) {
      case 'head':
        headEllipsize(container, finalHtml, numberOfLines, setClampedHtml);
        break;
      case 'middle':
        middleEllipsize(container, finalHtml, numberOfLines, setClampedHtml);
        break;
      case 'tail':
        tailEllipsize(container, finalHtml, numberOfLines, setClampedHtml);
        break;
      case 'clip':
        clip(container, finalHtml, numberOfLines, setClampedHtml);
        break;
    }
  }, [containerRef, finalHtml, ellipsizeMode, numberOfLines, setClampedHtml]);
}
