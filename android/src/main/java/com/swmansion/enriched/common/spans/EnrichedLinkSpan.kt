package com.swmansion.enriched.common.spans

import android.text.TextPaint
import com.swmansion.enriched.common.EnrichedStyle
import com.swmansion.enriched.common.spans.base.EnrichedSpanBase
import com.swmansion.enriched.common.spans.interfaces.EnrichedInlineSpan

open class EnrichedLinkSpan(
  private val url: String,
  override val enrichedStyle: EnrichedStyle,
  private val isManual: Boolean,
) : EnrichedSpanBase(enrichedStyle),
  EnrichedInlineSpan {
  override fun getBaseStyle() = enrichedStyle.baseStyles["a"]

  override fun updateDrawState(textPaint: TextPaint) {
    super.updateDrawState(textPaint)
    textPaint.color = enrichedStyle.aColor
    textPaint.isUnderlineText = enrichedStyle.aUnderline
  }

  fun getUrl(): String = url

  fun getIsManual(): Boolean = isManual
}
