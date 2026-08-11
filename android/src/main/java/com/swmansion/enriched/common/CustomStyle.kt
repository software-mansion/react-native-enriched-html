package com.swmansion.enriched.common

data class CustomStyle(
  val foregroundColor: Int? = null,
  val backgroundColor: Int? = null,
  val fontSize: Float? = null,
  val fontFamily: String? = null,
) {
  fun isEmpty(): Boolean =
    foregroundColor == null &&
      backgroundColor == null &&
      fontSize == null &&
      fontFamily == null
}
