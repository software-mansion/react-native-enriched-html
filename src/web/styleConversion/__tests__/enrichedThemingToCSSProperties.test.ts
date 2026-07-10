import type { CSSProperties } from 'react';
import { enrichedInputThemingToCSSProperties } from '../enrichedThemingToCSSProperties';

describe('enrichedInputThemingToCSSProperties', () => {
  it('returns an empty object when no colors are passed', () => {
    expect(enrichedInputThemingToCSSProperties({})).toEqual({});
  });

  it('maps theme props to caretColor and CSS variables', () => {
    expect(
      enrichedInputThemingToCSSProperties({
        cursorColor: '#111',
        placeholderTextColor: '#222',
        selectionColor: '#333',
      })
    ).toEqual({
      'caretColor': '#111',
      '--et-placeholder-text-color': '#222',
      '--et-selection-color': '#333',
    } as CSSProperties);
  });

  it('maps only one prop if other are not provided', () => {
    expect(
      enrichedInputThemingToCSSProperties({
        selectionColor: '#333',
      })
    ).toEqual({
      '--et-selection-color': '#333',
    } as CSSProperties);
  });
});
