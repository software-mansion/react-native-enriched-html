/* eslint-disable no-bitwise -- the styles are passed to native as a bitmask */
import type { EnrichedStyleName } from '../types';

// Bit position of every style in the mask passed to the HTML normalizer.
// Must stay in sync with cpp/parser/IgnoredStyles.h.
const STYLE_BITS: Record<EnrichedStyleName, number> = {
  bold: 0,
  italic: 1,
  underline: 2,
  strikeThrough: 3,
  inlineCode: 4,
  h1: 5,
  h2: 6,
  h3: 7,
  h4: 8,
  h5: 9,
  h6: 10,
  codeBlock: 11,
  blockQuote: 12,
  orderedList: 13,
  unorderedList: 14,
  checkboxList: 15,
  link: 16,
  image: 17,
  mention: 18,
  alignment: 19,
  customStyle: 20,
};

export const IGNORABLE_STYLES = Object.keys(STYLE_BITS) as EnrichedStyleName[];

/**
 * Converts the `ignoredStyles` prop into the mask of styles the normalizer
 * leaves out. No ignored styles (the default) gives 0.
 */
export function getIgnoredStylesMask(
  ignoredStyles: readonly EnrichedStyleName[]
): number {
  let mask = 0;
  for (const style of ignoredStyles) {
    const bit = STYLE_BITS[style];
    // ignore unknown names coming from untyped code
    if (bit !== undefined) {
      mask |= 1 << bit;
    }
  }
  return mask;
}

export function isStyleIgnored(
  ignoredStylesMask: number,
  style: EnrichedStyleName
): boolean {
  return (ignoredStylesMask & (1 << STYLE_BITS[style])) !== 0;
}
