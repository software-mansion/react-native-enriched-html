package com.swmansion.enriched.text.spans

import com.swmansion.enriched.common.spans.EnrichedCheckboxListSpan
import com.swmansion.enriched.text.EnrichedTextStyle
import com.swmansion.enriched.text.spans.interfaces.EnrichedTextSpan

class EnrichedTextCheckboxListSpan(
  override var isChecked: Boolean,
  enrichedStyle: EnrichedTextStyle,
  ancestorListStyles: List<String> = emptyList(),
) : EnrichedCheckboxListSpan(isChecked, enrichedStyle, ancestorListStyles),
  EnrichedTextSpan {
  override val dependsOnHtmlStyle: Boolean = true

  override fun rebuildWithStyle(style: EnrichedTextStyle): EnrichedTextCheckboxListSpan =
    EnrichedTextCheckboxListSpan(isChecked, style, ancestorListStyles)
}
