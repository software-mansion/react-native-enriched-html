import type { CSSProperties } from 'react';

export const ET_STYLE_CSS_VARS = {
  // The input's base font, used as the custom style font family fallback
  fontFamily: '--et-font-family',
} as const;

export function enrichedStyleToCSSVariables(
  style: Pick<CSSProperties, 'fontFamily'>
): CSSProperties {
  const vars: Record<string, string> = {};
  if (style.fontFamily) vars[ET_STYLE_CSS_VARS.fontFamily] = style.fontFamily;
  return vars as CSSProperties;
}
