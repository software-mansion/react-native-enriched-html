import type { CSSProperties } from 'react';
import type { ColorValue } from 'react-native';
import { toColor } from './toColor';

type EnrichedInputThemingStyle = Partial<
  Pick<CSSProperties, 'caretColor'> & {
    '--et-placeholder-text-color': string;
    '--et-selection-color': string;
  }
>;

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
  const extra: EnrichedInputThemingStyle = {};
  const caret = toColor(cursorColor);
  if (caret) extra.caretColor = caret;

  const placeholderCss = toColor(placeholderTextColor);
  if (placeholderCss) extra['--et-placeholder-text-color'] = placeholderCss;

  const selectionCss = toColor(selectionColor);
  if (selectionCss) extra['--et-selection-color'] = selectionCss;

  return extra;
}
