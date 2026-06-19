package com.swmansion.enriched.textinput.styles

import android.text.Editable
import android.text.Spannable
import com.swmansion.enriched.common.spans.EnrichedCustomStyleSpan
import com.swmansion.enriched.textinput.EnrichedTextInputView
import com.swmansion.enriched.textinput.spans.EnrichedInputCustomStyleSpan
import org.json.JSONObject

class CustomStyles(
  private val view: EnrichedTextInputView,
) {
  fun setStyle(styleJSON: String) {
    val selection = view.selection ?: return
    val (start, end) = selection.getInlineSelection()

    val json = runCatching { JSONObject(styleJSON) }.getOrNull() ?: return

    val hasFg = json.has("foregroundColor")
    val hasBg = json.has("backgroundColor")

    val fgColor = if (hasFg && !json.isNull("foregroundColor")) json.getInt("foregroundColor") else null
    val bgColor = if (hasBg && !json.isNull("backgroundColor")) json.getInt("backgroundColor") else null

    if (start == end) {
      val currentStyle = view.spanState?.customStyle
      val finalFg = if (hasFg) fgColor else currentStyle?.foregroundColor
      val finalBg = if (hasBg) bgColor else currentStyle?.backgroundColor

      view.spanState?.setCustomStyle(finalFg, finalBg)
    } else {
      val spannable = view.text as Spannable
      applyCustomStyleSpan(spannable, start, end, hasFg, fgColor, hasBg, bgColor)
      view.selection.validateStyles()
    }
  }

  private fun applyCustomStyleSpan(
    spannable: Spannable,
    start: Int,
    end: Int,
    hasFg: Boolean,
    fgColor: Int?,
    hasBg: Boolean,
    bgColor: Int?,
  ) {
    val existingSpans = spannable.getSpans(start, end, EnrichedInputCustomStyleSpan::class.java)
    val boundaries = mutableSetOf(start, end)

    // Snapshot boundaries and spans before any modifications
    val oldSpans =
      existingSpans.mapNotNull { span ->
        val spanStart = spannable.getSpanStart(span)
        val spanEnd = spannable.getSpanEnd(span)
        if (spanStart == -1 || spanEnd == -1) null else Triple(span, spanStart, spanEnd)
      }

    // Remove old spans, restore outer edges, and collect internal boundaries
    for ((span, spanStart, spanEnd) in oldSpans) {
      val spanFg = span.getForegroundColor()
      val spanBg = span.getBackgroundColor()

      spannable.removeSpan(span)

      if (spanStart < start) setCustomSpan(spannable, spanStart, start, spanFg, spanBg)
      if (spanEnd > end) setCustomSpan(spannable, end, spanEnd, spanFg, spanBg)

      if (spanStart in start..end) boundaries.add(spanStart)
      if (spanEnd in start..end) boundaries.add(spanEnd)
    }

    // Build the new merged spans chunk-by-chunk
    val sortedBoundaries = boundaries.sorted()

    for (i in 0 until sortedBoundaries.size - 1) {
      val chunkStart = sortedBoundaries[i]
      val chunkEnd = sortedBoundaries[i + 1]

      // Find the old span that fully covers this specific chunk
      val oldSpan = oldSpans.firstOrNull { it.second <= chunkStart && it.third >= chunkEnd }?.first

      val finalFg = if (hasFg) fgColor else oldSpan?.getForegroundColor()
      val finalBg = if (hasBg) bgColor else oldSpan?.getBackgroundColor()

      setCustomSpan(spannable, chunkStart, chunkEnd, finalFg, finalBg)
    }
  }

  fun afterTextChanged(
    s: Editable,
    startCursorPosition: Int,
    endCursorPosition: Int,
  ) {
    val isInsertion = endCursorPosition > startCursorPosition
    val activeStyle = view.spanState?.customStyle

    if (isInsertion) {
      val activeFg = activeStyle?.foregroundColor
      val activeBg = activeStyle?.backgroundColor

      // Split existing spans if they don't match the current active colors
      splitCustomSpanOnInsertion(s, startCursorPosition, endCursorPosition, activeFg, activeBg)

      setCustomSpan(s, startCursorPosition, endCursorPosition, activeFg, activeBg)
    }

    // Merge any adjacent spans that have the exact same colors
    collapseAdjacentCustomSpans(s, startCursorPosition, endCursorPosition)
  }

  private fun splitCustomSpanOnInsertion(
    spannable: Spannable,
    insertStart: Int,
    insertEnd: Int,
    activeFg: Int?,
    activeBg: Int?,
  ) {
    val spans = spannable.getSpans(insertStart, insertEnd, EnrichedInputCustomStyleSpan::class.java)

    for (span in spans) {
      val spanStart = spannable.getSpanStart(span)
      val spanEnd = spannable.getSpanEnd(span)
      if (spanStart < 0 || spanEnd < 0) continue

      val spanFg = span.getForegroundColor()
      val spanBg = span.getBackgroundColor()

      // If the existing span perfectly matches the active state, leave it
      if (spanFg == activeFg && spanBg == activeBg) continue

      // Colors differ. We must split the old span so it doesn't cover the new text
      spannable.removeSpan(span)

      if (spanStart < insertStart) {
        setCustomSpan(spannable, spanStart, insertStart, spanFg, spanBg)
      }
      if (spanEnd > insertEnd) {
        setCustomSpan(spannable, insertEnd, spanEnd, spanFg, spanBg)
      }
    }
  }

  private fun collapseAdjacentCustomSpans(
    spannable: Spannable,
    start: Int,
    end: Int,
  ) {
    // Look slightly outside the typed area to catch adjacent spans
    val searchStart = (start - 1).coerceAtLeast(0)
    val searchEnd = (end + 1).coerceAtMost(spannable.length)

    val spans = spannable.getSpans(searchStart, searchEnd, EnrichedInputCustomStyleSpan::class.java)
    if (spans.isEmpty()) return

    // Sort spans and extract their boundaries simultaneously
    val sortedSpans =
      spans
        .mapNotNull { span ->
          val spanStart = spannable.getSpanStart(span)
          val spanEnd = spannable.getSpanEnd(span)
          if (spanStart == -1 || spanEnd == -1) null else Triple(span, spanStart, spanEnd)
        }.sortedBy { it.second }

    // Wipe all spans in this region immediately (we safely hold their data in sortedSpans)
    sortedSpans.forEach { spannable.removeSpan(it.first) }

    var (_, currentStart, currentEnd) = sortedSpans[0]
    var currentFg = sortedSpans[0].first.getForegroundColor()
    var currentBg = sortedSpans[0].first.getBackgroundColor()

    // Iterate and merge
    for (i in 1 until sortedSpans.size) {
      val (span, spanStart, spanEnd) = sortedSpans[i]
      val spanFg = span.getForegroundColor()
      val spanBg = span.getBackgroundColor()

      // If spans are touching/overlapping AND their colors match perfectly extend the span
      if (spanStart <= currentEnd && spanFg == currentFg && spanBg == currentBg) {
        currentEnd = maxOf(currentEnd, spanEnd)
      } else {
        // Colors changed or there is a gap. Commit the current merged block.
        setCustomSpan(spannable, currentStart, currentEnd, currentFg, currentBg)

        // Start a new tracking block
        currentStart = spanStart
        currentEnd = spanEnd
        currentFg = spanFg
        currentBg = spanBg
      }
    }

    // Commit the final block
    setCustomSpan(spannable, currentStart, currentEnd, currentFg, currentBg)
  }

  private fun setCustomSpan(
    spannable: Spannable,
    start: Int,
    end: Int,
    fg: Int?,
    bg: Int?,
  ) {
    if (start >= end || (fg == null && bg == null)) return

    spannable.setSpan(
      EnrichedInputCustomStyleSpan(fg, bg),
      start,
      end,
      Spannable.SPAN_EXCLUSIVE_EXCLUSIVE,
    )
  }
}
