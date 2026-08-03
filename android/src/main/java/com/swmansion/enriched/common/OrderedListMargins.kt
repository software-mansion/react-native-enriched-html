package com.swmansion.enriched.common

import android.graphics.Paint
import android.text.Spannable
import android.text.style.ParagraphStyle
import com.swmansion.enriched.common.spans.EnrichedOrderedListSpan
import com.swmansion.enriched.textinput.utils.getSafeSpanBoundaries

// Recomputes the shared marker column width for every ordered-list item.
// Returns true when any item's column width changed, so callers can force a relayout.
fun updateOrderedListColumnMargins(
  text: Spannable,
  paint: Paint,
) {
  val spans = text.getSpans(0, text.length, EnrichedOrderedListSpan::class.java)
  val sortedSpans = spans.sortedBy { text.getSpanStart(it) }

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

  // Ordered list margins got updated, so we need to force a re-layout of that list.
  // Uses the same empty ParagraphStyle trick as EnrichedSpanWatcher.updateNextLineLayout.
  if (changed) {
    forceOrderedListRelayout(text, sortedSpans)
  }
}

private fun forceOrderedListRelayout(
  text: Spannable,
  sortedSpans: List<EnrichedOrderedListSpan>,
) {
  if (sortedSpans.isEmpty()) return

  class EmptySpan : ParagraphStyle

  val start = text.getSpanStart(sortedSpans.first())
  val end = text.getSpanEnd(sortedSpans.last())
  val (safeStart, safeEnd) = text.getSafeSpanBoundaries(start, end)
  text.getSpans(safeStart, safeEnd, EmptySpan::class.java).forEach { text.removeSpan(it) }
  text.setSpan(EmptySpan(), safeStart, safeEnd, Spannable.SPAN_EXCLUSIVE_EXCLUSIVE)
}
