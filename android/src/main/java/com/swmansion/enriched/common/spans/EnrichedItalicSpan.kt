package com.swmansion.enriched.common.spans

import android.text.TextPaint
import com.swmansion.enriched.common.EnrichedStyle
import com.swmansion.enriched.common.spans.base.EnrichedSpanBase
import com.swmansion.enriched.common.spans.interfaces.EnrichedInlineSpan

open class EnrichedItalicSpan(
  enrichedStyle: EnrichedStyle,
) : EnrichedSpanBase(enrichedStyle),
  EnrichedInlineSpan {
  override fun getBaseStyle() = enrichedStyle.baseStyles["italic"]

  override fun updateMeasureState(paint: TextPaint) {
    applyItalicTypeface(paint)
    super.updateMeasureState(paint)
  }
}
