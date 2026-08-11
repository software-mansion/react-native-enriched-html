package com.swmansion.enriched.textinput.styles

import android.text.Editable
import android.text.Spannable
import com.swmansion.enriched.common.CustomStyle
import com.swmansion.enriched.common.EnrichedSpanFlags
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
    val hasFontSize = json.has("fontSize")
    val hasFontFamily = json.has("fontFamily")

    val fgColor = if (hasFg && !json.isNull("foregroundColor")) json.getInt("foregroundColor") else null
    val bgColor = if (hasBg && !json.isNull("backgroundColor")) json.getInt("backgroundColor") else null
    val fontSize =
      if (hasFontSize && !json.isNull("fontSize")) {
        json.getDouble("fontSize").toFloat()
      } else {
        null
      }
    val fontFamily =
      if (hasFontFamily && !json.isNull("fontFamily")) {
        json.getString("fontFamily")
      } else {
        null
      }

    if (start == end) {
      val currentStyle = view.spanState?.customStyle
      val finalFg = if (hasFg) fgColor else currentStyle?.foregroundColor
      val finalBg = if (hasBg) bgColor else currentStyle?.backgroundColor
      val finalFontSize = if (hasFontSize) fontSize else currentStyle?.fontSize
      val finalFontFamily = if (hasFontFamily) fontFamily else currentStyle?.fontFamily

      view.spanState?.setCustomStyle(finalFg, finalBg, finalFontSize, finalFontFamily)
    } else {
      val spannable = view.text as Spannable
      applyCustomStyleSpan(
        spannable,
        start,
        end,
        hasFg,
        fgColor,
        hasBg,
        bgColor,
        hasFontSize,
        fontSize,
        hasFontFamily,
        fontFamily,
      )
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
    hasFontSize: Boolean,
    fontSize: Float?,
    hasFontFamily: Boolean,
    fontFamily: String?,
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
      val style = span.toCustomStyle()

      spannable.removeSpan(span)

      if (spanStart < start) setCustomSpan(spannable, spanStart, start, style)
      if (spanEnd > end) setCustomSpan(spannable, end, spanEnd, style)

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
      val oldStyle = oldSpan?.toCustomStyle() ?: CustomStyle()

      val merged =
        CustomStyle(
          foregroundColor = if (hasFg) fgColor else oldStyle.foregroundColor,
          backgroundColor = if (hasBg) bgColor else oldStyle.backgroundColor,
          fontSize = if (hasFontSize) fontSize else oldStyle.fontSize,
          fontFamily = if (hasFontFamily) fontFamily else oldStyle.fontFamily,
        )

      setCustomSpan(spannable, chunkStart, chunkEnd, merged)
    }
  }

  fun afterTextChanged(
    s: Editable,
    startCursorPosition: Int,
    endCursorPosition: Int,
  ) {
    val isInsertion = endCursorPosition > startCursorPosition

    if (isInsertion) {
      val activeStyle = view.spanState?.customStyle ?: CustomStyle()

      // Split existing spans if they don't match the current active values
      splitCustomSpanOnInsertion(s, startCursorPosition, endCursorPosition, activeStyle)

      setCustomSpan(s, startCursorPosition, endCursorPosition, activeStyle)
    }

    // Merge any adjacent spans that have the exact same style
    collapseAdjacentCustomSpans(s, startCursorPosition, endCursorPosition)
  }

  private fun splitCustomSpanOnInsertion(
    spannable: Spannable,
    insertStart: Int,
    insertEnd: Int,
    activeStyle: CustomStyle,
  ) {
    val spans = spannable.getSpans(insertStart, insertEnd, EnrichedInputCustomStyleSpan::class.java)

    for (span in spans) {
      val spanStart = spannable.getSpanStart(span)
      val spanEnd = spannable.getSpanEnd(span)
      if (spanStart < 0 || spanEnd < 0) continue

      val spanStyle = span.toCustomStyle()

      // If the existing span perfectly matches the active state, leave it
      if (spanStyle == activeStyle) continue

      // Spans differ. We must split the old span so it doesn't cover the new text
      spannable.removeSpan(span)

      if (spanStart < insertStart) {
        setCustomSpan(spannable, spanStart, insertStart, spanStyle)
      }
      if (spanEnd > insertEnd) {
        setCustomSpan(spannable, insertEnd, spanEnd, spanStyle)
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
    var currentStyle = sortedSpans[0].first.toCustomStyle()

    // Iterate and merge
    for (i in 1 until sortedSpans.size) {
      val (span, spanStart, spanEnd) = sortedSpans[i]
      val spanStyle = span.toCustomStyle()

      // If spans are touching/overlapping AND their values match perfectly extend the span
      if (spanStart <= currentEnd && spanStyle == currentStyle) {
        currentEnd = maxOf(currentEnd, spanEnd)
      } else {
        // Values changed or there is a gap. Commit the current merged block.
        setCustomSpan(spannable, currentStart, currentEnd, currentStyle)

        // Start a new tracking block
        currentStart = spanStart
        currentEnd = spanEnd
        currentStyle = spanStyle
      }
    }

    // Commit the final block
    setCustomSpan(spannable, currentStart, currentEnd, currentStyle)
  }

  private fun setCustomSpan(
    spannable: Spannable,
    start: Int,
    end: Int,
    style: CustomStyle,
  ) {
    if (start >= end || style.isEmpty()) return

    val span =
      EnrichedInputCustomStyleSpan(
        style.foregroundColor,
        style.backgroundColor,
        style.fontSize,
        style.fontFamily,
        view.context.assets,
        view.allowFontScaling,
      )
    spannable.setSpan(
      span,
      start,
      end,
      EnrichedSpanFlags.forSpan(span),
    )
  }
}
