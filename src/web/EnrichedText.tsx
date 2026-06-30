import {
  memo,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react';
import type { EnrichedTextProps } from '../types';
import './EnrichedText.css';
import { enrichedTextStyleToCSSProperties } from './styleConversion/enrichedTextStyleToCSSProperties';
import {
  htmlStyleToCSSVariables,
  mergeWithDefaultEnrichedTextHtmlStyle,
} from './styleConversion/htmlStyleToCSSVariables';
import { ENRICHED_TEXT_CLASSNAME } from './constants/classNames';
import { enrichedInputThemingToCSSProperties } from './styleConversion/enrichedThemingToCSSProperties';
import { buildMentionRulesCSS } from './styleConversion/buildMentionRulesCSS';
import { sanitizeHtml } from './sanitization/htmlSanitizer';
import { prepareHtmlForWeb } from './normalization/prepareHtmlForWeb';
import { INLINE_IMAGE_CSS_VARIABLES } from './styleConversion/inlineImageCSSVariables';
import { useImageErrorFallback } from './useImageErrorFallback';
import { usePressInteractions } from './usePressInteractions';
import { headEllipsize } from './ellipsizeMode/headEllipsize';
import { tailEllipsize } from './ellipsizeMode/tailEllipsize';
import { clip } from './ellipsizeMode/clip';

export const EnrichedText = memo(
  ({
    children,
    htmlStyle,
    style,
    selectionColor,
    ellipsizeMode = 'tail',
    numberOfLines = 0,
  }: EnrichedTextProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [clampedHtml, setClampedHtml] = useState<string | null>(null);

    const sanitizedHtml = useMemo(() => sanitizeHtml(children), [children]);
    const finalHtml = useMemo(
      () => prepareHtmlForWeb(sanitizedHtml),
      [sanitizedHtml]
    );

    const resolvedHtmlStyle = useMemo(
      () => mergeWithDefaultEnrichedTextHtmlStyle(htmlStyle),
      [htmlStyle]
    );

    const textStyle: CSSProperties = useMemo(
      () => enrichedTextStyleToCSSProperties(style ?? {}),
      [style]
    );

    const cssVars = useMemo(
      () => ({
        ...htmlStyleToCSSVariables(resolvedHtmlStyle),
        ...INLINE_IMAGE_CSS_VARIABLES,
      }),
      [resolvedHtmlStyle]
    );

    const themingStyle = useMemo(
      () => enrichedInputThemingToCSSProperties({ selectionColor }),
      [selectionColor]
    );

    const mentionRulesCSS = useMemo(
      () => buildMentionRulesCSS(resolvedHtmlStyle),
      [resolvedHtmlStyle]
    );

    const finalStyle = useMemo(
      () =>
        ({
          ...textStyle,
          ...themingStyle,
          ...cssVars,
        }) as CSSProperties,
      [textStyle, themingStyle, cssVars]
    );

    // a single layout effect picks the truncation strategy so the hook is
    // never called conditionally; the strategies themselves are plain functions
    useLayoutEffect(() => {
      const container = containerRef.current;
      if (!container) return;

      // 0 (or less) means no limit - render the full content
      if (numberOfLines <= 0) {
        setClampedHtml(finalHtml);
        return;
      }

      switch (ellipsizeMode) {
        case 'head':
          headEllipsize(container, finalHtml, numberOfLines, setClampedHtml);
          break;
        case 'clip':
          clip(container, finalHtml, numberOfLines, setClampedHtml);
          break;
        // 'middle' is not implemented on web - it falls back to the default 'tail'
        case 'tail':
        default:
          tailEllipsize(container, finalHtml, numberOfLines, setClampedHtml);
          break;
      }
    }, [containerRef, finalHtml, ellipsizeMode, numberOfLines]);

    usePressInteractions(containerRef);
    useImageErrorFallback(containerRef);

    return (
      <>
        {mentionRulesCSS ? <style>{mentionRulesCSS}</style> : null}
        <div
          ref={containerRef}
          style={finalStyle}
          className={ENRICHED_TEXT_CLASSNAME}
          dangerouslySetInnerHTML={{ __html: clampedHtml ?? '' }}
        />
      </>
    );
  }
);
