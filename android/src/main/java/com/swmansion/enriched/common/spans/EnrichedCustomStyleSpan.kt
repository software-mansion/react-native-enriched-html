package com.swmansion.enriched.common.spans

import android.text.TextPaint
import android.text.style.CharacterStyle
import com.swmansion.enriched.common.spans.interfaces.EnrichedInlineSpan
import com.swmansion.enriched.common.withOpacity

open class EnrichedCustomStyleSpan(
  private val foregroundColor: Int?,
  private val backgroundColor: Int?,
) : CharacterStyle(),
  EnrichedInlineSpan {
  fun getForegroundColor(): Int? = foregroundColor

  fun getBackgroundColor(): Int? = backgroundColor

  override fun updateDrawState(textPaint: TextPaint) {
    foregroundColor?.let { textPaint.color = it }
    backgroundColor?.let { textPaint.bgColor = withOpacity(it) }
  }
}
