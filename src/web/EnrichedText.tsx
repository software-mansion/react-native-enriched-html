import { memo, useMemo, type CSSProperties } from 'react';
import type { EnrichedTextProps } from '../types';
import './EnrichedText.css';
import { enrichedTextStyleToCSSProperties } from './styleConversion/enrichedTextStyleToCSSProperties';
import { htmlStyleToCSSVariables } from './styleConversion/htmlStyleToCSSVariables';
import { ENRICHED_TEXT_CLASSNAME } from './constants/classNames';
import { enrichedInputThemingToCSSProperties } from './styleConversion/enrichedThemingToCSSProperties';
import { buildMentionRulesCSS } from './styleConversion/buildMentionRulesCSS';
import { sanitizeHtml } from './sanitization/htmlSanitizer';
import { prepareHtmlForWeb } from './normalization/prepareHtmlForWeb';
import { INLINE_IMAGE_CSS_VARIABLES } from './styleConversion/inlineImageCSSVariables';

export const EnrichedText = memo(
  ({ children, htmlStyle, style, selectionColor }: EnrichedTextProps) => {
    const sanitizedHtml = useMemo(() => sanitizeHtml(children), [children]);

    const finalHtml = useMemo(
      () => prepareHtmlForWeb(sanitizedHtml),
      [sanitizedHtml]
    );

    const textStyle: CSSProperties = useMemo(
      () => enrichedTextStyleToCSSProperties(style ?? {}),
      [style]
    );

    const cssVars = useMemo(
      () => ({
        ...htmlStyleToCSSVariables(htmlStyle),
        ...INLINE_IMAGE_CSS_VARIABLES,
      }),
      [htmlStyle]
    );

    const themingStyle = useMemo(
      () => enrichedInputThemingToCSSProperties({ selectionColor }),
      [selectionColor]
    );

    const mentionRulesCSS = useMemo(
      () => buildMentionRulesCSS('text', htmlStyle),
      [htmlStyle]
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

    return (
      <>
        <style>{mentionRulesCSS}</style>
        <div
          style={finalStyle}
          className={ENRICHED_TEXT_CLASSNAME}
          dangerouslySetInnerHTML={{ __html: finalHtml }}
        />
      </>
    );
  }
);
