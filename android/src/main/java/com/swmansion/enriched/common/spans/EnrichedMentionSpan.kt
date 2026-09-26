package com.swmansion.enriched.common.spans

import android.text.TextPaint
import com.swmansion.enriched.common.EnrichedStyle
import com.swmansion.enriched.common.spans.base.EnrichedSpanBase
import com.swmansion.enriched.common.spans.interfaces.EnrichedInlineSpan

open class EnrichedMentionSpan(
  private val text: String,
  private val indicator: String,
  private val attributes: Map<String, String>,
  override val enrichedStyle: EnrichedStyle,
) : EnrichedSpanBase(enrichedStyle),
  EnrichedInlineSpan {
  override fun updateDrawState(textPaint: TextPaint) {
    super.updateDrawState(textPaint)

    val mentionsStyle = enrichedStyle.mentionsStyle[indicator] ?: return
    textPaint.color = mentionsStyle.color
    textPaint.bgColor = mentionsStyle.backgroundColor
    textPaint.isUnderlineText = mentionsStyle.underline
  }

  fun getAttributes(): Map<String, String> = attributes

  fun getText(): String = text

  fun getIndicator(): String = indicator
}
