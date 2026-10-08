package com.swmansion.enriched.common.spans

import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.Typeface
import android.os.Build
import android.text.Layout
import android.text.TextPaint
import android.text.style.LeadingMarginSpan
import android.text.style.MetricAffectingSpan
import com.swmansion.enriched.common.EnrichedStyle
import com.swmansion.enriched.common.spans.interfaces.EnrichedListSpan
import com.swmansion.enriched.textinput.spans.EnrichedSpans

open class EnrichedOrderedListSpan(
  var index: Int,
  private val enrichedStyle: EnrichedStyle,
  override var ancestorListStyles: List<String> = emptyList(),
) : MetricAffectingSpan(),
  LeadingMarginSpan,
  EnrichedListSpan {
  override val listStyle: String = EnrichedSpans.ORDERED_LIST

  override fun updateMeasureState(p0: TextPaint) {
    // Do nothing, but inform layout that this span affects text metrics
  }

  override fun updateDrawState(p0: TextPaint?) {
    // Do nothing, but inform layout that this span affects text metrics
  }

  private fun singleLevelIndent(): Int = enrichedStyle.olMarginLeft + enrichedStyle.olGapWidth

  override fun getLeadingMargin(first: Boolean): Int = singleLevelIndent() * (depth + 1) // siema zle sie liczy

  override fun drawLeadingMargin(
    canvas: Canvas,
    paint: Paint,
    x: Int,
    dir: Int,
    top: Int,
    baseline: Int,
    bottom: Int,
    t: CharSequence?,
    start: Int,
    end: Int,
    first: Boolean,
    layout: Layout?,
  ) {
    if (first) {
      val text = "$index."
      val width = paint.measureText(text)

      val yPosition = baseline.toFloat()
      val xPosition = (depth * singleLevelIndent() + enrichedStyle.olMarginLeft + x - width / 2) * dir

      val originalColor = paint.color
      val originalTypeface = paint.typeface

      paint.color = enrichedStyle.olMarkerColor ?: originalColor
      paint.typeface = getTypeface(enrichedStyle.olMarkerFontWeight, originalTypeface)
      canvas.drawText(text, xPosition, yPosition, paint)

      paint.color = originalColor
      paint.typeface = originalTypeface
    }
  }

  private fun getTypeface(
    fontWeight: Int?,
    originalTypeface: Typeface,
  ): Typeface =
    if (fontWeight == null) {
      originalTypeface
    } else if (Build.VERSION.SDK_INT >= 28) {
      Typeface.create(originalTypeface, fontWeight, false)
    } else {
      // Fallback for API < 28: only bold/normal supported
      if (fontWeight == Typeface.BOLD) {
        Typeface.create(originalTypeface, Typeface.BOLD)
      } else {
        Typeface.create(originalTypeface, Typeface.NORMAL)
      }
    }
}
