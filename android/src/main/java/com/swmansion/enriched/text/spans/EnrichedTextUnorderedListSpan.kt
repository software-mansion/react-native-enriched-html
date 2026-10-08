package com.swmansion.enriched.text.spans

import com.swmansion.enriched.common.EnrichedStyle
import com.swmansion.enriched.common.spans.EnrichedUnorderedListSpan
import com.swmansion.enriched.text.EnrichedTextStyle
import com.swmansion.enriched.text.spans.interfaces.EnrichedTextSpan

class EnrichedTextUnorderedListSpan(
  enrichedStyle: EnrichedStyle,
  ancestorListStyles: List<String> = emptyList(),
) : EnrichedUnorderedListSpan(enrichedStyle, ancestorListStyles),
  EnrichedTextSpan {
  override val dependsOnHtmlStyle = true

  override fun rebuildWithStyle(style: EnrichedTextStyle) = EnrichedTextUnorderedListSpan(style, ancestorListStyles)
}
