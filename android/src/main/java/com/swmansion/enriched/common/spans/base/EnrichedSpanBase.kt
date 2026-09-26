package com.swmansion.enriched.common.spans.base

import android.graphics.Typeface
import android.text.TextPaint
import android.text.style.MetricAffectingSpan
import com.swmansion.enriched.common.BaseStyle
import com.swmansion.enriched.common.EnrichedStyle

// shared base for every custom Enriched span
abstract class EnrichedSpanBase(
  open val enrichedStyle: EnrichedStyle,
) : MetricAffectingSpan() {
  open fun getBaseStyle(): BaseStyle? = null

  protected fun applyBoldTypeface(
    paint: TextPaint,
  ) {
    var style = paint.typeface?.style ?: Typeface.NORMAL
    style = style or Typeface.BOLD

    paint.typeface = Typeface.create(paint.typeface, style)
  }

  protected fun applyItalicTypeface(
    paint: TextPaint,
  ) {
    var style = paint.typeface?.style ?: Typeface.NORMAL
    style = style or Typeface.ITALIC

    paint.typeface = Typeface.create(paint.typeface, style)
  }

  override fun updateMeasureState(paint: TextPaint) {
    applyTypefaceStyles(paint)
  }

  override fun updateDrawState(paint: TextPaint) {
    applyTypefaceStyles(paint)

    val config = getBaseStyle() ?: return
    if (config.underline) paint.isUnderlineText = true
    if (config.strikethrough) paint.isStrikeThruText = true
  }

  private fun applyTypefaceStyles(paint: TextPaint) {
    val config = getBaseStyle() ?: return
    if (config.bold) applyBoldTypeface(paint)
    if (config.italic) applyItalicTypeface(paint)
  }
}
