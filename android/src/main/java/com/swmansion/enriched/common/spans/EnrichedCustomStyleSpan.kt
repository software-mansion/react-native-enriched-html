package com.swmansion.enriched.common.spans

import android.graphics.Color
import android.text.TextPaint
import android.text.style.CharacterStyle
import com.swmansion.enriched.common.spans.interfaces.EnrichedInlineSpan

open class EnrichedCustomStyleSpan(
  private val foregroundColor: Int?,
  private val backgroundColor: Int?,
) : CharacterStyle(),
  EnrichedInlineSpan {
  fun getForegroundColor(): Int? = foregroundColor

  fun getBackgroundColor(): Int? = backgroundColor

  override fun updateDrawState(textPaint: TextPaint) {
    foregroundColor?.let { textPaint.color = withOpacity(it, 80) }
    backgroundColor?.let { textPaint.bgColor = withOpacity(it, 80) }
  }

  private fun withOpacity(
    color: Int,
    alpha: Int,
  ): Int {
    if (Color.alpha(color) != 255) return color
    val a = alpha.coerceIn(0, 255)
    return (color and 0x00FFFFFF) or (a shl 24)
  }
}
