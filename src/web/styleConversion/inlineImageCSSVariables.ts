import type { CSSProperties } from 'react';
import { BROKEN_IMAGE_GLYPH_MASK } from '../constants/brokenImageGlyph';

export const INLINE_IMAGE_CSS_VARIABLES = {
  '--et-broken-image-glyph': BROKEN_IMAGE_GLYPH_MASK,
} as CSSProperties;
