package com.swmansion.enriched.textinput.utils

import android.text.Spannable
import android.text.SpannableString
import android.text.SpannableStringBuilder
import com.swmansion.enriched.common.EnrichedConstants
import com.swmansion.enriched.common.EnrichedSpanFlags
import com.swmansion.enriched.common.spans.EnrichedImageSpan
import com.swmansion.enriched.common.spans.EnrichedMentionSpan
import com.swmansion.enriched.common.spans.interfaces.EnrichedBlockSpan
import com.swmansion.enriched.common.spans.interfaces.EnrichedParagraphSpan
import com.swmansion.enriched.common.spans.interfaces.EnrichedSpan
import com.swmansion.enriched.textinput.spans.EnrichedSpans
import com.swmansion.enriched.textinput.spans.interfaces.EnrichedInputSpan
import com.swmansion.enriched.textinput.styles.HtmlStyle

fun Spannable.getSafeSpanBoundaries(
  start: Int,
  end: Int,
): Pair<Int, Int> {
  val safeStart = start.coerceAtMost(end).coerceAtLeast(0)
  val safeEnd = end.coerceAtLeast(start).coerceAtMost(this.length)

  return Pair(safeStart, safeEnd)
}

fun Spannable.getParagraphBounds(
  start: Int,
  end: Int,
): Pair<Int, Int> {
  var startPosition = start.coerceAtLeast(0).coerceAtMost(this.length)
  var endPosition = end.coerceAtLeast(0).coerceAtMost(this.length)

  // Find the start of the paragraph
  while (startPosition > 0 && this[startPosition - 1] != '\n') {
    startPosition--
  }

  // Find the end of the paragraph
  while (endPosition < this.length && this[endPosition] != '\n') {
    endPosition++
  }

  if (startPosition >= endPosition) {
    // If the start position is equal or greater than the end position, return the same position
    startPosition = endPosition
  }

  return Pair(startPosition, endPosition)
}

fun Spannable.getParagraphBounds(index: Int): Pair<Int, Int> = this.getParagraphBounds(index, index)

private fun Spannable.hasStyleInRange(
  style: String,
  start: Int,
  end: Int,
): Boolean {
  val type = EnrichedSpans.allSpans[style]?.clazz ?: return false
  return getSpans(start, end, type).isNotEmpty()
}

private fun getStyleForSpan(span: EnrichedSpan): String? =
  EnrichedSpans.allSpans.entries
    .firstOrNull { (_, config) ->
      config.clazz.isInstance(span)
    }?.key

private fun Spannable.removeBlockedIncomingStyles(
  insertStart: Int,
  incomingSpannable: Spannable,
  htmlStyle: HtmlStyle,
): Spannable {
  val incomingSpans = incomingSpannable.getSpans(0, incomingSpannable.length, EnrichedSpan::class.java)

  for (span in incomingSpans) {
    val style = getStyleForSpan(span) ?: continue
    val blockingStyles = EnrichedSpans.getMergingConfigForStyle(style, htmlStyle)?.blockingStyles ?: continue
    if (blockingStyles.isEmpty()) continue

    val spanStart = incomingSpannable.getSpanStart(span)
    val spanEnd = incomingSpannable.getSpanEnd(span)
    if (spanStart == -1 || spanEnd == -1 || spanStart == spanEnd) continue

    val absoluteStart = insertStart + spanStart
    val absoluteEnd = insertStart + spanEnd
    if (blockingStyles.any { hasStyleInRange(it, absoluteStart, absoluteEnd) }) {
      removeSpan(span)
    }
  }

  return this
}

private fun isBlockLevel(span: Any): Boolean = span is EnrichedParagraphSpan || span is EnrichedBlockSpan

/**
 * Clears a conflicting span over [rangeStart, rangeEnd), keeping whatever falls outside it so that
 * untouched text does not lose its styling. A continuous block style spanning several paragraphs
 * therefore only loses the affected ones. Mentions and images carry a single entity and cannot be
 * split, so they are dropped as a whole.
 */
private fun SpannableStringBuilder.clearConflictingSpan(
  span: EnrichedSpan,
  rangeStart: Int,
  rangeEnd: Int,
  htmlStyle: HtmlStyle,
) {
  val spanStart = getSpanStart(span)
  val spanEnd = getSpanEnd(span)
  val flags = getSpanFlags(span)
  removeSpan(span)

  if (span !is EnrichedInputSpan || span is EnrichedMentionSpan || span is EnrichedImageSpan) return

  // Block level styles own whole lines, so their leftovers must not swallow the separating newline
  val isBlock = isBlockLevel(span)
  val leftEnd = if (isBlock && rangeStart > 0 && this[rangeStart - 1] == '\n') rangeStart - 1 else rangeStart
  val rightStart = if (isBlock && rangeEnd < length && this[rangeEnd] == '\n') rangeEnd + 1 else rangeEnd

  if (spanStart < leftEnd) {
    val left = span.rebuildWithStyle(htmlStyle)
    setSpan(left, spanStart, leftEnd, EnrichedSpanFlags.forSpan(left, flags))
  }

  if (rightStart < spanEnd) {
    val right = span.rebuildWithStyle(htmlStyle)
    setSpan(right, rightStart, spanEnd, EnrichedSpanFlags.forSpan(right, flags))
  }
}

/**
 * Drops the document styles that the merged in content conflicts with, mirroring how toggling a
 * style clears its conflicts: block level styles resolve over the whole paragraph, inline ones only
 * over the range they cover. Spans that arrived with [mergedSpannable] are left alone.
 */
private fun SpannableStringBuilder.removeConflictingStyles(
  mergedSpannable: Spannable,
  htmlStyle: HtmlStyle,
) {
  val mergedSpans = mergedSpannable.getSpans(0, mergedSpannable.length, EnrichedSpan::class.java)

  for (span in mergedSpans) {
    val spanStart = getSpanStart(span)
    val spanEnd = getSpanEnd(span)

    if (spanStart == -1 || spanEnd == -1 || spanStart == spanEnd) continue

    val style = getStyleForSpan(span) ?: continue
    val conflictingStyles = EnrichedSpans.getMergingConfigForStyle(style, htmlStyle)?.conflictingStyles ?: continue
    if (conflictingStyles.isEmpty()) continue

    val (rangeStart, rangeEnd) =
      if (isBlockLevel(span)) getParagraphBounds(spanStart, spanEnd) else Pair(spanStart, spanEnd)

    for (conflictingStyle in conflictingStyles) {
      val type = EnrichedSpans.allSpans[conflictingStyle]?.clazz ?: continue

      for (existing in getSpans(rangeStart, rangeEnd, type)) {
        if (existing !is EnrichedSpan || mergedSpans.any { it === existing }) {
          continue
        }
        clearConflictingSpan(existing, rangeStart, rangeEnd, htmlStyle)
      }
    }
  }
}

fun Spannable.mergeSpannables(
  start: Int,
  end: Int,
  string: String,
  htmlStyle: HtmlStyle,
): Spannable = this.mergeSpannables(start, end, SpannableString(string), htmlStyle)

fun Spannable.mergeSpannables(
  start: Int,
  end: Int,
  spannable: Spannable,
  htmlStyle: HtmlStyle,
): Spannable {
  var finalStart = start
  var finalEnd = end
  val builder = SpannableStringBuilder(this)
  val (paragraphStart, paragraphEnd) = this.getParagraphBounds(start, end)

  val incomingHasOwnBlockStyles =
    spannable.getSpans(0, spannable.length, EnrichedBlockSpan::class.java).isNotEmpty() ||
      spannable.getSpans(0, spannable.length, EnrichedParagraphSpan::class.java).isNotEmpty()

  // ZWS anchors are not content, so a line holding nothing else still counts as empty
  val hasContentBefore = (paragraphStart until start).any { this[it] != EnrichedConstants.ZWS }
  val hasContentAfter = (end until paragraphEnd).any { this[it] != EnrichedConstants.ZWS }

  if (incomingHasOwnBlockStyles && !hasContentBefore && !hasContentAfter) {
    finalStart = paragraphStart
    finalEnd = paragraphEnd
  }

  builder.replace(finalStart, finalEnd, spannable)

  if (incomingHasOwnBlockStyles) {
    // Extend each incoming block/paragraph span to cover its own paragraph so the style applies
    // to existing text on the same line, matching toggle semantics
    val insertEnd = finalStart + spannable.length

    val incomingBlockSpans = builder.getSpans(finalStart, insertEnd, EnrichedBlockSpan::class.java)
    val incomingParagraphSpans = builder.getSpans(finalStart, insertEnd, EnrichedParagraphSpan::class.java)
    val incomingSpans = incomingBlockSpans.toList() + incomingParagraphSpans.toList()

    for (span in incomingSpans) {
      val spanStart = builder.getSpanStart(span)
      val spanEnd = builder.getSpanEnd(span)
      if (spanStart == -1) continue

      val (spanParaStart, spanParaEnd) = builder.getParagraphBounds(spanStart, spanEnd)
      if (spanStart <= spanParaStart && spanEnd >= spanParaEnd) continue

      val flags = builder.getSpanFlags(span)
      builder.removeSpan(span)
      builder.setSpan(
        span,
        spanParaStart.coerceAtMost(spanStart),
        spanParaEnd.coerceAtLeast(spanEnd),
        EnrichedSpanFlags.forSpan(span, flags),
      )
    }
  } else {
    // No own styles - extend existing paragraph/block spans to cover the inserted text
    val insertEnd = finalStart + spannable.length

    val affectedParagraphSpans = builder.getSpans(finalStart, finalStart, EnrichedParagraphSpan::class.java)
    val affectedBlockSpans = builder.getSpans(finalStart, finalStart, EnrichedBlockSpan::class.java)
    val affectedSpans = affectedBlockSpans.toList() + affectedParagraphSpans.toList()

    for (span in affectedSpans) {
      val spanStart = builder.getSpanStart(span)
      val spanEnd = builder.getSpanEnd(span)
      if (spanStart == -1 || spanEnd >= insertEnd) continue

      val (_, newParagraphEnd) = builder.getParagraphBounds(spanStart, insertEnd)
      val flags = builder.getSpanFlags(span)
      builder.removeSpan(span)
      builder.setSpan(span, spanStart, newParagraphEnd, EnrichedSpanFlags.forSpan(span, flags))
    }
  }

  // Blocking runs first so styles that never made it in are not treated as conflict winners
  builder.removeBlockedIncomingStyles(finalStart, spannable, htmlStyle)
  builder.removeConflictingStyles(spannable, htmlStyle)

  return builder
}
