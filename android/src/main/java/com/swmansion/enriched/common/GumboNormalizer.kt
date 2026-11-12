package com.swmansion.enriched.common

object GumboNormalizer {
  external fun normalizeHtml(
    html: String,
    ignoredStylesMask: Int,
  ): String?
}
