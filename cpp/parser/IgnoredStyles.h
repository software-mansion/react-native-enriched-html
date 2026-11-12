/**
 * Bit flags for the styles that the `ignoredStyles` prop can leave out when
 * external HTML is normalized.
 *
 * The bit order must stay in sync with `STYLE_BITS` in
 * src/utils/ignoredStyles.ts, which builds the mask passed to native.
 */

#pragma once

#include <stdint.h>

#define IGNORED_STYLE_BOLD ((uint32_t)1 << 0)
#define IGNORED_STYLE_ITALIC ((uint32_t)1 << 1)
#define IGNORED_STYLE_UNDERLINE ((uint32_t)1 << 2)
#define IGNORED_STYLE_STRIKETHROUGH ((uint32_t)1 << 3)
#define IGNORED_STYLE_INLINE_CODE ((uint32_t)1 << 4)
#define IGNORED_STYLE_H1 ((uint32_t)1 << 5)
#define IGNORED_STYLE_H2 ((uint32_t)1 << 6)
#define IGNORED_STYLE_H3 ((uint32_t)1 << 7)
#define IGNORED_STYLE_H4 ((uint32_t)1 << 8)
#define IGNORED_STYLE_H5 ((uint32_t)1 << 9)
#define IGNORED_STYLE_H6 ((uint32_t)1 << 10)
#define IGNORED_STYLE_CODE_BLOCK ((uint32_t)1 << 11)
#define IGNORED_STYLE_BLOCK_QUOTE ((uint32_t)1 << 12)
#define IGNORED_STYLE_ORDERED_LIST ((uint32_t)1 << 13)
#define IGNORED_STYLE_UNORDERED_LIST ((uint32_t)1 << 14)
#define IGNORED_STYLE_CHECKBOX_LIST ((uint32_t)1 << 15)
#define IGNORED_STYLE_LINK ((uint32_t)1 << 16)
#define IGNORED_STYLE_IMAGE ((uint32_t)1 << 17)
#define IGNORED_STYLE_MENTION ((uint32_t)1 << 18)
#define IGNORED_STYLE_ALIGNMENT ((uint32_t)1 << 19)
#define IGNORED_STYLE_CUSTOM_STYLE ((uint32_t)1 << 20)

#define IGNORED_STYLE_HEADINGS                                                 \
  (IGNORED_STYLE_H1 | IGNORED_STYLE_H2 | IGNORED_STYLE_H3 | IGNORED_STYLE_H4 | \
   IGNORED_STYLE_H5 | IGNORED_STYLE_H6)
