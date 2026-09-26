package com.swmansion.enriched.common.spans

import android.graphics.Typeface
import android.text.TextPaint
import com.swmansion.enriched.common.EnrichedStyle
import com.swmansion.enriched.common.spans.base.EnrichedSpanBase
import com.swmansion.enriched.common.spans.interfaces.EnrichedInlineSpan

open class EnrichedInlineCodeSpan(
  override val enrichedStyle: EnrichedStyle,
) : EnrichedSpanBase(enrichedStyle),
  EnrichedInlineSpan {
  override fun getBaseStyle() = enrichedStyle.baseStyles["code"]

  override fun updateMeasureState(paint: TextPaint) {
    applyMonospace(paint)
    super.updateMeasureState(paint)
  }

  override fun updateDrawState(paint: TextPaint) {
    applyMonospace(paint)
    super.updateDrawState(paint)
    paint.color = enrichedStyle.inlineCodeColor
    paint.bgColor = enrichedStyle.inlineCodeBackgroundColor
  }

  // When switching to a monospace font, we need to remember
  // and apply other current styles, such as bold or italic.
  private fun applyMonospace(textPaint: TextPaint) {
    val currentStyle = textPaint.typeface?.style ?: Typeface.NORMAL
    val typeface = Typeface.create(Typeface.MONOSPACE, currentStyle)

    textPaint.typeface = typeface
  }
}
