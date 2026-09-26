package com.swmansion.enriched.textinput.spans

import com.swmansion.enriched.common.spans.EnrichedItalicSpan
import com.swmansion.enriched.textinput.spans.interfaces.EnrichedInputSpan
import com.swmansion.enriched.textinput.styles.HtmlStyle

class EnrichedInputItalicSpan(
  htmlStyle: HtmlStyle,
) : EnrichedItalicSpan(htmlStyle),
  EnrichedInputSpan {
  override val dependsOnHtmlStyle: Boolean = true

  override fun rebuildWithStyle(htmlStyle: HtmlStyle): EnrichedInputItalicSpan = EnrichedInputItalicSpan(htmlStyle)
}
