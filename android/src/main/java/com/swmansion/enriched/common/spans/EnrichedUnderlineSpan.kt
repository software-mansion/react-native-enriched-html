package com.swmansion.enriched.common.spans

import android.text.TextPaint
import com.swmansion.enriched.common.EnrichedStyle
import com.swmansion.enriched.common.spans.base.EnrichedSpanBase
import com.swmansion.enriched.common.spans.interfaces.EnrichedInlineSpan

open class EnrichedUnderlineSpan(
  enrichedStyle: EnrichedStyle,
) : EnrichedSpanBase(enrichedStyle),
  EnrichedInlineSpan {
  override fun getBaseStyle() = enrichedStyle.baseStyles["underline"]

  override fun updateDrawState(paint: TextPaint) {
    super.updateDrawState(paint)
    paint.isUnderlineText = true
  }
}
