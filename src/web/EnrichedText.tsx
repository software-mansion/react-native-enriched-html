import { memo, useMemo, useRef, type CSSProperties } from 'react';
import type { EnrichedTextProps } from '../types';
import './EnrichedText.css';
import { enrichedTextStyleToCSSProperties } from './styleConversion/enrichedTextStyleToCSSProperties';
import { mergeWithDefaultEnrichedTextHtmlStyle } from './styleConversion/htmlStyleToCSSVariables';
import { enrichedTextHtmlStyleToCSSVariables } from './styleConversion/htmlStyleToCSSVariables';
import { ENRICHED_TEXT_CLASSNAME } from './constants/classNames';
import { enrichedInputThemingToCSSProperties } from './styleConversion/enrichedThemingToCSSProperties';
import { buildMentionRulesCSS } from './styleConversion/buildMentionRulesCSS';
import { sanitizeHtml } from './sanitization/htmlSanitizer';
import { prepareHtmlForWeb } from './normalization/prepareHtmlForWeb';
import { INLINE_IMAGE_CSS_VARIABLES } from './styleConversion/inlineImageCSSVariables';
import { useImageErrorFallback } from './useImageErrorFallback';
import { usePressInteractions } from './usePressInteractions';
import { useStableRef } from './useStableRef';

export const EnrichedText = memo(
  ({
    children,
    htmlStyle,
    style,
    selectionColor,
    onLinkPress,
    onMentionPress,
  }: EnrichedTextProps) => {
    const containerRef = useRef<HTMLDivElement>(null);

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
        ...enrichedTextHtmlStyleToCSSVariables(resolvedHtmlStyle),
        ...INLINE_IMAGE_CSS_VARIABLES,
      }),
      [resolvedHtmlStyle]
    );

    const themingStyle = useMemo(
      () => enrichedInputThemingToCSSProperties({ selectionColor }),
      [selectionColor]
    );

    const mentionRulesCSS = useMemo(
      () => buildMentionRulesCSS(resolvedHtmlStyle, !!onMentionPress),
      [resolvedHtmlStyle, onMentionPress]
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

    const onLinkPressRef = useStableRef(onLinkPress);
    const onMentionPressRef = useStableRef(onMentionPress);

    useImageErrorFallback(containerRef);
    usePressInteractions(containerRef, onLinkPressRef, onMentionPressRef);

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
