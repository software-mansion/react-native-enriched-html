package com.swmansion.enriched.common

import android.graphics.Color

internal const val DEFAULT_BACKGROUND_OPACITY = 80

internal fun withOpacity(
  color: Int,
  alpha: Int = DEFAULT_BACKGROUND_OPACITY,
): Int {
  if (Color.alpha(color) != 255) return color
  val a = alpha.coerceIn(0, 255)
  return (color and 0x00FFFFFF) or (a shl 24)
}
