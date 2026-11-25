import type { ColorValue } from 'react-native';
import cssNamedColors from '../../utils/cssNamedColors.json';

const CSS_NAMED_COLORS: Record<string, string> = cssNamedColors;

export function normalizeColorToHex(
  value: string | null | undefined
): string | null {
  if (!value) return null;
  let str = value.trim().toLowerCase();

  // Handle Named Colors
  if (CSS_NAMED_COLORS[str] !== undefined) {
    str = CSS_NAMED_COLORS[str]!.toLowerCase();
  }

  // Handle Hex (#FFF, #RGBA, #RRGGBB, #RRGGBBAA)
  if (str.startsWith('#')) {
    const hex = str.substring(1);
    let r,
      g,
      b,
      a = 'ff';

    if (hex.length === 3) {
      r = hex.charAt(0) + hex.charAt(0);
      g = hex.charAt(1) + hex.charAt(1);
      b = hex.charAt(2) + hex.charAt(2);
    } else if (hex.length === 4) {
      r = hex.charAt(0) + hex.charAt(0);
      g = hex.charAt(1) + hex.charAt(1);
      b = hex.charAt(2) + hex.charAt(2);
      a = hex.charAt(3) + hex.charAt(3);
    } else if (hex.length === 6) {
      r = hex.substring(0, 2);
      g = hex.substring(2, 4);
      b = hex.substring(4, 6);
    } else if (hex.length === 8) {
      r = hex.substring(0, 2);
      g = hex.substring(2, 4);
      b = hex.substring(4, 6);
      a = hex.substring(6, 8);
    } else {
      return null;
    }

    // drop alpha if it's 255 (FF)
    if (a === 'ff') {
      return `#${r}${g}${b}`.toUpperCase();
    }
    return `#${r}${g}${b}${a}`.toUpperCase();
  }

  // Handle rgb() and rgba()
  if (str.startsWith('rgb')) {
    const match = str.match(
      /rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)/
    );
    if (match && match[1] && match[2] && match[3]) {
      const r = Math.round(parseFloat(match[1])).toString(16).padStart(2, '0');
      const g = Math.round(parseFloat(match[2])).toString(16).padStart(2, '0');
      const b = Math.round(parseFloat(match[3])).toString(16).padStart(2, '0');

      let a = 'ff';
      if (match[4] !== undefined) {
        a = Math.round(parseFloat(match[4]) * 255)
          .toString(16)
          .padStart(2, '0');
      }

      if (a === 'ff') {
        return `#${r}${g}${b}`.toUpperCase();
      }
      return `#${r}${g}${b}${a}`.toUpperCase();
    }
  }

  return null;
}

export function normalizeColorValue(
  color?: ColorValue | null
): string | null | undefined {
  if (color === undefined) return undefined;
  if (color === null) return null;
  if (typeof color === 'string') return color;

  // If it's an OpaqueColorValue return null
  return null;
}
