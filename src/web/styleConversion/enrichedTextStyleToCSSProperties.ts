import type { CSSProperties } from 'react';
import type { TextStyle } from 'react-native';
import { enrichedBaseStyleToCSSProperties } from './enrichedBaseStyleToCSSProperties';
import { toColor } from './toColor';

export function enrichedTextStyleToCSSProperties(
  style: TextStyle
): CSSProperties {
  const css: CSSProperties = {
    ...enrichedBaseStyleToCSSProperties(style, { scrollEnabled: false }),

    // Text-only properties
    // textAlign: RN 'auto' has no CSS equivalent
    textAlign: style.textAlign !== 'auto' ? style.textAlign : undefined,
    textTransform: style.textTransform,
    textDecorationLine: style.textDecorationLine,
    textDecorationStyle: style.textDecorationStyle,
    textDecorationColor: toColor(style.textDecorationColor),
    textShadow: resolveTextShadow(style),
    userSelect: style.userSelect,
    fontVariant: Array.isArray(style.fontVariant)
      ? style.fontVariant.join(' ')
      : undefined,
    // writingDirection: RN 'auto' has no CSS equivalent
    direction:
      style.writingDirection !== 'auto' ? style.writingDirection : undefined,
    // verticalAlign: RN 'auto' has no CSS equivalent
    verticalAlign:
      style.verticalAlign !== 'auto' ? style.verticalAlign : undefined,
  };

  // Clean undefined values
  return Object.fromEntries(
    Object.entries(css).filter(([, v]) => v !== undefined)
  );
}

// RN exposes textShadow* as separate props; CSS uses a single shorthand.
function resolveTextShadow(style: TextStyle): string | undefined {
  const { textShadowColor, textShadowOffset, textShadowRadius } = style;
  if (
    textShadowColor == null &&
    textShadowOffset == null &&
    textShadowRadius == null
  ) {
    return undefined;
  }
  const x = textShadowOffset?.width ?? 0;
  const y = textShadowOffset?.height ?? 0;
  const blur = textShadowRadius ?? 0;
  const color = toColor(textShadowColor);
  const offset = `${x}px ${y}px ${blur}px`;
  return color ? `${offset} ${color}` : offset;
}
