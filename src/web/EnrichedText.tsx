import { useMemo, type CSSProperties } from 'react';
import type { EnrichedTextProps } from '../types';
import './EnrichedText.css';
import { enrichedTextStyleToCSSProperties } from './styleConversion/enrichedTextStyleToCSSProperties';
import { enrichedTextThemingToCSSProperties } from './styleConversion/enrichedTextThemingToCSSProperties';

export const EnrichedText = ({
  children,
  style,
  selectionColor,
}: EnrichedTextProps) => {
  const textStyle: CSSProperties = useMemo(
    () => enrichedTextStyleToCSSProperties(style ?? {}),
    [style]
  );

  const themingStyle = useMemo(
    () => enrichedTextThemingToCSSProperties({ selectionColor }),
    [selectionColor]
  );

  const finalStyle = useMemo(
    () => ({ ...textStyle, ...themingStyle }),
    [textStyle, themingStyle]
  );

  return (
    <>
      <div
        style={finalStyle}
        className="et"
        dangerouslySetInnerHTML={{ __html: children }}
      />
    </>
  );
};
