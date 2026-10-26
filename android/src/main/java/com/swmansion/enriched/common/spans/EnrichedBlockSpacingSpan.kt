package com.swmansion.enriched.common.spans

import android.graphics.Paint
import android.text.Spanned
import android.text.style.LineHeightSpan
import android.text.style.UpdateLayout

// Adds vertical space above the first line and below the last line of the paragraph it covers.
// Set by EnrichedBlockSpacing, which works out the collapsed margins between blocks.
class EnrichedBlockSpacingSpan(
  val spacingBefore: Int,
  val spacingAfter: Int,
) : LineHeightSpan,
  UpdateLayout {
  // StaticLayout carries the first line's adjusted ascent over to the next line of a wrapped
  // paragraph, which would repeat the space above every wrapped line. These remember the first
  // line's ascent before and after the spacing, so the next lines can undo it.
  private var firstLineAscent = 0
  private var spacedFirstLineAscent = 0

  override fun chooseHeight(
    text: CharSequence,
    start: Int,
    end: Int,
    spanstartv: Int,
    lineHeight: Int,
    fm: Paint.FontMetricsInt,
  ) {
    val spanned = text as? Spanned ?: return

    if (start == spanned.getSpanStart(this)) {
      firstLineAscent = fm.ascent
      fm.ascent -= spacingBefore
      spacedFirstLineAscent = fm.ascent
      fm.top = minOf(fm.top, fm.ascent)
    } else if (spacingBefore > 0 && fm.ascent == spacedFirstLineAscent) {
      fm.ascent = firstLineAscent
    }

    if (end >= spanned.getSpanEnd(this)) {
      fm.descent += spacingAfter
      fm.bottom = maxOf(fm.bottom, fm.descent)
    }
  }
}
