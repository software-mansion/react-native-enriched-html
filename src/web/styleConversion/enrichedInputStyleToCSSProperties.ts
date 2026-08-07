import type { CSSProperties } from 'react';
import type { EnrichedInputStyle } from '../../types';
import {
  enrichedBaseStyleToCSSProperties,
  type StyleConversionExtraOptions,
} from './enrichedBaseStyleToCSSProperties';

export function enrichedInputStyleToCSSProperties(
  style: EnrichedInputStyle,
  extraOptions?: StyleConversionExtraOptions
): CSSProperties {
  return enrichedBaseStyleToCSSProperties(style, extraOptions);
}
