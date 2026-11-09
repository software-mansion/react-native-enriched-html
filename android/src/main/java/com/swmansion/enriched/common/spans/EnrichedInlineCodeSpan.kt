package com.swmansion.enriched.common.spans

import android.graphics.Typeface
import android.text.TextPaint
import android.text.style.MetricAffectingSpan
import com.swmansion.enriched.common.EnrichedStyle
import com.swmansion.enriched.common.spans.interfaces.EnrichedInlineSpan

open class EnrichedInlineCodeSpan(
  private val enrichedStyle: EnrichedStyle,
) : MetricAffectingSpan(),
  EnrichedInlineSpan {
  override fun updateDrawState(textPaint: TextPaint) {
    applyMonospace(textPaint)
    textPaint.color = enrichedStyle.inlineCodeColor
    textPaint.bgColor = enrichedStyle.inlineCodeBackgroundColor
  }

  override fun updateMeasureState(textPaint: TextPaint) {
    applyMonospace(textPaint)
  }

  // When switching to a monospace font, we need to remember
  // and apply other current styles, such as bold or italic.
  private fun applyMonospace(textPaint: TextPaint) {
    val currentStyle = textPaint.typeface?.style ?: Typeface.NORMAL
    val typeface = Typeface.create(Typeface.MONOSPACE, currentStyle)

    textPaint.typeface = typeface
  }
}
