package com.swmansion.enriched.common

import android.text.Spannable
import com.swmansion.enriched.common.spans.EnrichedBlockSpacingSpan
import com.swmansion.enriched.common.spans.EnrichedCheckboxListSpan
import com.swmansion.enriched.common.spans.EnrichedH1Span
import com.swmansion.enriched.common.spans.EnrichedH2Span
import com.swmansion.enriched.common.spans.EnrichedH3Span
import com.swmansion.enriched.common.spans.EnrichedH4Span
import com.swmansion.enriched.common.spans.EnrichedH5Span
import com.swmansion.enriched.common.spans.EnrichedH6Span
import com.swmansion.enriched.common.spans.EnrichedOrderedListSpan
import com.swmansion.enriched.common.spans.EnrichedUnorderedListSpan
import com.swmansion.enriched.common.spans.interfaces.EnrichedParagraphSpan

// Applies the heading and list margins from EnrichedStyle as EnrichedBlockSpacingSpans.
// Adjacent margins collapse into the larger one and the first and last blocks get no outer space.
// Only spans change, never the characters, so the HTML, the plain text and selection offsets stay the same.
object EnrichedBlockSpacing {
  private class Paragraph(
    val start: Int,
    val end: Int,
    // Consecutive items of one list form a single block, while every heading paragraph is a block of its own.
    val listClass: Class<*>?,
    val marginTop: Int,
    val marginBottom: Int,
  )

  private data class Spacing(
    val start: Int,
    val end: Int,
    val before: Int,
    val after: Int,
  )

  // Returns true if any spacing span was added or removed.
  fun apply(
    spannable: Spannable,
    style: EnrichedStyle,
  ): Boolean {
    val wanted = if (style.hasBlockMargins()) getSpacings(spannable, style).toMutableSet() else mutableSetOf()
    var changed = false

    for (span in spannable.getSpans(0, spannable.length, EnrichedBlockSpacingSpan::class.java)) {
      val current = Spacing(spannable.getSpanStart(span), spannable.getSpanEnd(span), span.spacingBefore, span.spacingAfter)
      if (!wanted.remove(current)) {
        spannable.removeSpan(span)
        changed = true
      }
    }

    for (spacing in wanted) {
      val span = EnrichedBlockSpacingSpan(spacing.before, spacing.after)
      spannable.setSpan(span, spacing.start, spacing.end, EnrichedSpanFlags.forSpan(span))
      changed = true
    }

    return changed
  }

  private fun getSpacings(
    spannable: Spannable,
    style: EnrichedStyle,
  ): List<Spacing> {
    val paragraphs = getParagraphs(spannable, style)
    val before = IntArray(paragraphs.size)
    val after = IntArray(paragraphs.size)

    for (i in 0 until paragraphs.size - 1) {
      val previous = paragraphs[i]
      val next = paragraphs[i + 1]
      if (previous.listClass != null && previous.listClass == next.listClass) continue

      // The gap goes on the block whose margin it is, so that blockquote and code block decorations
      // don't stretch into it.
      if (next.marginTop >= previous.marginBottom) {
        before[i + 1] = next.marginTop
      } else {
        after[i] = previous.marginBottom
      }
    }

    return paragraphs.indices
      .filter { (before[it] > 0 || after[it] > 0) && paragraphs[it].end > paragraphs[it].start }
      .map { Spacing(paragraphs[it].start, paragraphs[it].end, before[it], after[it]) }
  }

  private class Block(
    // Headings come before lists if a paragraph has both, e.g. while an edit is in progress
    val rank: Int,
    val listClass: Class<*>?,
    val marginTop: Int,
    val marginBottom: Int,
  )

  private fun getParagraphs(
    spannable: Spannable,
    style: EnrichedStyle,
  ): List<Paragraph> {
    val bounds = mutableListOf<Pair<Int, Int>>()
    var start = 0

    // A trailing newline leaves an empty last line, which is laid out as one more paragraph.
    while (start <= spannable.length) {
      val newline = spannable.indexOf('\n', start)
      val end = if (newline == -1) spannable.length else newline
      bounds.add(Pair(start, end))
      if (newline == -1) break
      start = newline + 1
    }

    val blocks = arrayOfNulls<Block>(bounds.size)
    val paragraphStarts = IntArray(bounds.size) { bounds[it].first }

    for (span in spannable.getSpans(0, spannable.length, EnrichedParagraphSpan::class.java)) {
      val block = getBlock(span, style) ?: continue
      val spanStart = spannable.getSpanStart(span)
      val spanEnd = spannable.getSpanEnd(span)

      // A span normally covers one paragraph, but it can cover more while an edit is in progress
      var index = paragraphStarts.binarySearch(spanStart).let { if (it >= 0) it else -it - 2 }.coerceAtLeast(0)
      while (index < bounds.size && bounds[index].first < spanEnd) {
        val current = blocks[index]
        // Empty headings and list items hold a zero-width space, so an empty paragraph stays plain text.
        val overlaps = bounds[index].second > maxOf(bounds[index].first, spanStart)
        if (overlaps && (current == null || block.rank < current.rank)) {
          blocks[index] = block
        }
        index++
      }
    }

    return bounds.mapIndexed { i, (start, end) ->
      val block = blocks[i]
      Paragraph(start, end, block?.listClass, block?.marginTop ?: 0, block?.marginBottom ?: 0)
    }
  }

  private fun getBlock(
    span: EnrichedParagraphSpan,
    style: EnrichedStyle,
  ): Block? =
    when (span) {
      is EnrichedH1Span -> {
        Block(0, null, style.h1MarginTop, style.h1MarginBottom)
      }

      is EnrichedH2Span -> {
        Block(1, null, style.h2MarginTop, style.h2MarginBottom)
      }

      is EnrichedH3Span -> {
        Block(2, null, style.h3MarginTop, style.h3MarginBottom)
      }

      is EnrichedH4Span -> {
        Block(3, null, style.h4MarginTop, style.h4MarginBottom)
      }

      is EnrichedH5Span -> {
        Block(4, null, style.h5MarginTop, style.h5MarginBottom)
      }

      is EnrichedH6Span -> {
        Block(5, null, style.h6MarginTop, style.h6MarginBottom)
      }

      is EnrichedUnorderedListSpan -> {
        Block(6, EnrichedUnorderedListSpan::class.java, style.ulMarginTop, style.ulMarginBottom)
      }

      is EnrichedOrderedListSpan -> {
        Block(7, EnrichedOrderedListSpan::class.java, style.olMarginTop, style.olMarginBottom)
      }

      is EnrichedCheckboxListSpan -> {
        Block(8, EnrichedCheckboxListSpan::class.java, style.ulCheckboxMarginTop, style.ulCheckboxMarginBottom)
      }

      else -> {
        null
      }
    }

  private fun EnrichedStyle.hasBlockMargins(): Boolean =
    intArrayOf(
      h1MarginTop,
      h1MarginBottom,
      h2MarginTop,
      h2MarginBottom,
      h3MarginTop,
      h3MarginBottom,
      h4MarginTop,
      h4MarginBottom,
      h5MarginTop,
      h5MarginBottom,
      h6MarginTop,
      h6MarginBottom,
      ulMarginTop,
      ulMarginBottom,
      olMarginTop,
      olMarginBottom,
      ulCheckboxMarginTop,
      ulCheckboxMarginBottom,
    ).any { it > 0 }
}
