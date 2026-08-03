package com.swmansion.enriched.common

import android.graphics.Paint
import android.text.Spanned
import com.swmansion.enriched.common.spans.EnrichedOrderedListSpan

// Recomputes the shared marker column width for every ordered-list item.
// Returns true when any item's column width changed, so callers can force a relayout.
fun updateOrderedListColumnMargins(
  sortedSpans: List<EnrichedOrderedListSpan>,
  paint: Paint,
): Boolean {
  var changed = false
  var previousIndex = 0
  var highestIndex = 0
  for (span in sortedSpans.reversed()) {
    val currentIndex = span.index
    if (currentIndex > previousIndex) {
      highestIndex = currentIndex
    }
    if (span.updateColumnMargin(paint, highestIndex)) changed = true

    previousIndex = currentIndex
  }

  return changed
}
