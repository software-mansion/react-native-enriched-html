package com.swmansion.enriched.textinput.spans

import com.swmansion.enriched.common.spans.EnrichedCustomStyleSpan
import com.swmansion.enriched.textinput.spans.interfaces.EnrichedInputSpan
import com.swmansion.enriched.textinput.styles.HtmlStyle

class EnrichedInputCustomStyleSpan(
  foregroundColor: Int?,
  backgroundColor: Int?,
) : EnrichedCustomStyleSpan(foregroundColor, backgroundColor),
  EnrichedInputSpan {
  override val dependsOnHtmlStyle: Boolean = false

  override fun rebuildWithStyle(htmlStyle: HtmlStyle): EnrichedInputCustomStyleSpan =
    EnrichedInputCustomStyleSpan(getForegroundColor(), getBackgroundColor())
}
