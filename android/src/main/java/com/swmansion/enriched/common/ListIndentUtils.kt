package com.swmansion.enriched.common

import com.swmansion.enriched.common.spans.EnrichedCheckboxListSpan
import com.swmansion.enriched.common.spans.EnrichedOrderedListSpan
import com.swmansion.enriched.common.spans.EnrichedUnorderedListSpan
import com.swmansion.enriched.textinput.spans.EnrichedSpans

object ListIndentUtils {
  fun levelIndent(
    listStyle: String,
    enrichedStyle: EnrichedStyle,
  ): Int =
    when (listStyle) {
      EnrichedSpans.UNORDERED_LIST -> EnrichedUnorderedListSpan.levelIndent(enrichedStyle)
      EnrichedSpans.ORDERED_LIST -> EnrichedOrderedListSpan.levelIndent(enrichedStyle)
      EnrichedSpans.CHECKBOX_LIST -> EnrichedCheckboxListSpan.levelIndent(enrichedStyle)
      else -> 0
    }

  fun ancestorsIndent(
    ancestorListStyles: List<String>,
    enrichedStyle: EnrichedStyle,
  ): Int = ancestorListStyles.sumOf { levelIndent(it, enrichedStyle) }
}
