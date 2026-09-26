package com.swmansion.enriched.common.spans

import android.graphics.Canvas
import android.graphics.Paint
import android.text.Layout
import android.text.TextPaint
import android.text.style.LeadingMarginSpan
import com.swmansion.enriched.common.EnrichedStyle
import com.swmansion.enriched.common.spans.base.EnrichedSpanBase
import com.swmansion.enriched.common.spans.interfaces.EnrichedBlockSpan

// https://android.googlesource.com/platform/frameworks/base/+/refs/heads/main/core/java/android/text/style/QuoteSpan.java
open class EnrichedBlockQuoteSpan(
  override val enrichedStyle: EnrichedStyle,
) : EnrichedSpanBase(enrichedStyle),
  LeadingMarginSpan,
  EnrichedBlockSpan {
  override fun getBaseStyle() = enrichedStyle.baseStyles["blockquote"]

  override fun getLeadingMargin(p0: Boolean): Int = enrichedStyle.blockquoteStripeWidth + enrichedStyle.blockquoteGapWidth

  override fun drawLeadingMargin(
    c: Canvas,
    p: Paint,
    x: Int,
    dir: Int,
    top: Int,
    baseline: Int,
    bottom: Int,
    text: CharSequence?,
    start: Int,
    end: Int,
    first: Boolean,
    layout: Layout?,
  ) {
    val style = p.style
    val color = p.color
    p.style = Paint.Style.FILL
    p.color = enrichedStyle.blockquoteBorderColor
    c.drawRect(x.toFloat(), top.toFloat(), x + dir * enrichedStyle.blockquoteStripeWidth.toFloat(), bottom.toFloat(), p)
    p.style = style
    p.color = color
  }

  override fun updateDrawState(paint: TextPaint) {
    super.updateDrawState(paint)
    val color = enrichedStyle.blockquoteColor
    if (color != null) {
      paint.color = color
    }
  }
}
