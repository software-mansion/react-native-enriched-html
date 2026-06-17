import type { CSSProperties } from 'react';
import type { ColorValue } from 'react-native';
import { toColor } from './toColor';

type EnrichedTextThemingStyle = Partial<{
  '--et-selection-color': string;
}>;

export interface EnrichedTextThemingColors {
  selectionColor?: ColorValue;
}

export function enrichedTextThemingToCSSProperties({
  selectionColor,
}: EnrichedTextThemingColors): CSSProperties {
  const extra: EnrichedTextThemingStyle = {};

  const selectionCss = toColor(selectionColor);
  if (selectionCss) extra['--et-selection-color'] = selectionCss;

  return extra as CSSProperties;
}
