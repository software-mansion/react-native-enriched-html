/**
 * Cross-platform HTML normalizer powered by Gumbo.
 * Converts arbitrary external HTML (Google Docs, Word, etc.) into a canonical
 * subset that our enriched parser understands.
 */

#pragma once

#include "IgnoredStyles.h"

#include <cstdint>
#include <string>

/**
 * C++ wrapper around the Gumbo-based HTML normalizer.
 */
class GumboParser {
public:
  /**
   * Normalize an HTML string into the canonical subset.
   *
   * @param html               UTF-8 encoded HTML fragment or full document.
   * @param ignoredStyles   Bitmask of IGNORED_STYLE_* flags left out of the output.
   *                           0 keeps every style.
   * @return                   Canonical HTML string, or empty string on
   *                           failure.
   */
  static std::string normalizeHtml(const std::string &html,
                                   uint32_t ignoredStyles = 0);
};
