import { memo, useMemo, useRef, type CSSProperties } from 'react';
import type { EnrichedTextProps } from '../types';
import './EnrichedText.css';
import { enrichedTextStyleToCSSProperties } from './styleConversion/enrichedTextStyleToCSSProperties';
import {
  htmlStyleToCSSVariables,
  mergeWithDefaultEnrichedTextHtmlStyle,
} from './styleConversion/htmlStyleToCSSVariables';
import { ENRICHED_TEXT_CLASSNAME } from './constants/classNames';
import { enrichedTextThemingToCSSProperties } from './styleConversion/enrichedThemingToCSSProperties';
import { buildMentionRulesCSS } from './styleConversion/buildMentionRulesCSS';
import { sanitizeHtml } from './sanitization/htmlSanitizer';
import { prepareHtmlForWeb } from './normalization/prepareHtmlForWeb';
import { INLINE_IMAGE_CSS_VARIABLES } from './styleConversion/inlineImageCSSVariables';
import { useImageErrorFallback } from './useImageErrorFallback';
import { usePressInteractions } from './usePressInteractions';

export const EnrichedText = memo(
  ({
    children,
    htmlStyle,
    style,
    selectionColor,
    selectable = false,
    useHtmlNormalizer = false,
  }: EnrichedTextProps) => {
    const containerRef = useRef<HTMLDivElement>(null);

    const sanitizedHtml = useMemo(() => sanitizeHtml(children), [children]);

    const finalHtml = useMemo(
      () => prepareHtmlForWeb(sanitizedHtml, useHtmlNormalizer),
      [sanitizedHtml, useHtmlNormalizer]
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
      () => enrichedTextThemingToCSSProperties({ selectionColor, selectable }),
      [selectionColor, selectable]
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

    usePressInteractions(containerRef);
    useImageErrorFallback(containerRef);

    return (
      <>
        {mentionRulesCSS ? <style>{mentionRulesCSS}</style> : null}
        <div
          ref={containerRef}
          style={finalStyle}
          className={ENRICHED_TEXT_CLASSNAME}
          dangerouslySetInnerHTML={{ __html: finalHtml }}
        />
      </>
    );
  }
);
