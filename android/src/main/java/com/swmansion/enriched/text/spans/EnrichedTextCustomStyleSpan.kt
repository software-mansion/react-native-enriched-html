package com.swmansion.enriched.text.spans

import com.swmansion.enriched.common.spans.EnrichedCustomStyleSpan
import com.swmansion.enriched.text.EnrichedTextStyle
import com.swmansion.enriched.text.spans.interfaces.EnrichedTextSpan

class EnrichedTextCustomStyleSpan(
  foregroundColor: Int?,
  backgroundColor: Int?,
) : EnrichedCustomStyleSpan(foregroundColor, backgroundColor),
  EnrichedTextSpan {
  override val dependsOnHtmlStyle: Boolean = false

  override fun rebuildWithStyle(style: EnrichedTextStyle): EnrichedTextCustomStyleSpan =
    EnrichedTextCustomStyleSpan(getForegroundColor(), getBackgroundColor())
}
