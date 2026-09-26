package com.swmansion.enriched.common.spans

import android.text.TextPaint
import com.swmansion.enriched.common.EnrichedStyle
import com.swmansion.enriched.common.spans.base.EnrichedSpanBase
import com.swmansion.enriched.common.spans.interfaces.EnrichedHeadingSpan

open class EnrichedH5Span(
  override val enrichedStyle: EnrichedStyle,
) : EnrichedSpanBase(enrichedStyle),
  EnrichedHeadingSpan {
  override fun getBaseStyle() = enrichedStyle.baseStyles["h5"]

  override fun updateMeasureState(paint: TextPaint) {
    super.updateMeasureState(paint)
    paint.textSize = enrichedStyle.h5FontSize.toFloat()
  }

  override fun updateDrawState(paint: TextPaint) {
    super.updateDrawState(paint)
    paint.textSize = enrichedStyle.h5FontSize.toFloat()
  }
}
