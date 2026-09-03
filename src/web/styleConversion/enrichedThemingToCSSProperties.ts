import type { CSSProperties } from 'react';
import type { ColorValue } from 'react-native';
import { toColor } from './toColor';

type EnrichedThemingStyle = Partial<
  Pick<CSSProperties, 'caretColor' | 'userSelect'> & {
    '--et-placeholder-text-color': string;
    '--et-selection-color': string;
  }
>;

function applySelectionColor(
  extra: EnrichedThemingStyle,
  selectionColor: ColorValue | undefined
): EnrichedThemingStyle {
  const selectionCss = toColor(selectionColor);
  if (selectionCss) extra['--et-selection-color'] = selectionCss;
  return extra;
}

export interface EnrichedInputThemingColors {
  cursorColor?: ColorValue;
  placeholderTextColor?: ColorValue;
  selectionColor?: ColorValue;
}

export function enrichedInputThemingToCSSProperties({
  cursorColor,
  placeholderTextColor,
  selectionColor,
}: EnrichedInputThemingColors): CSSProperties {
  const extra: EnrichedThemingStyle = {};
  const caret = toColor(cursorColor);
  if (caret) extra.caretColor = caret;

  const placeholderCss = toColor(placeholderTextColor);
  if (placeholderCss) extra['--et-placeholder-text-color'] = placeholderCss;

  return applySelectionColor(extra, selectionColor);
}

export interface EnrichedTextThemingOptions {
  selectionColor?: ColorValue;
  selectable?: boolean;
}

export function enrichedTextThemingToCSSProperties({
  selectionColor,
  selectable,
}: EnrichedTextThemingOptions): CSSProperties {
  const extra: EnrichedThemingStyle = {};

  if (selectable !== undefined) extra.userSelect = selectable ? 'text' : 'none';

  return applySelectionColor(extra, selectionColor);
}
