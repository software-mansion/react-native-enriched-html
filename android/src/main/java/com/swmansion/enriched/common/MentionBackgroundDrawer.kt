package com.swmansion.enriched.common

import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.Path
import android.graphics.RectF
import android.text.Layout
import android.text.Spanned
import com.swmansion.enriched.common.spans.EnrichedMentionSpan
import kotlin.math.max
import kotlin.math.min

// Mention backgrounds are drawn by the view instead of the span, because spans only get whole-line
// bounds and cannot round the corners of a single mention.
object MentionBackgroundDrawer {
  private val paint = Paint(Paint.ANTI_ALIAS_FLAG)
  private val path = Path()
  private val rect = RectF()
  private val radii = FloatArray(8)

  // Must be called with the canvas translated to the layout origin, before the text is drawn.
  fun draw(
    canvas: Canvas,
    layout: Layout,
    text: Spanned,
    style: EnrichedStyle,
    backgroundColorFor: (EnrichedMentionSpan, MentionStyle) -> Int = { _, mentionStyle -> mentionStyle.backgroundColor },
  ) {
    val spans = text.getSpans(0, text.length, EnrichedMentionSpan::class.java)
    for (span in spans) {
      val mentionStyle = style.mentionsStyle[span.getIndicator()] ?: continue
      val color = backgroundColorFor(span, mentionStyle)
      if (Color.alpha(color) == 0) continue

      val start = text.getSpanStart(span)
      val end = text.getSpanEnd(span)
      if (start < 0 || end <= start) continue

      paint.color = color
      drawSpanBackground(canvas, layout, start, end, mentionStyle.borderRadius)
    }
  }

  private fun drawSpanBackground(
    canvas: Canvas,
    layout: Layout,
    start: Int,
    end: Int,
    radius: Float,
  ) {
    val firstLine = layout.getLineForOffset(start)
    val lastLine = layout.getLineForOffset(end - 1)

    for (line in firstLine..lastLine) {
      val isFirst = line == firstLine
      val isLast = line == lastLine

      val segmentStart = if (isFirst) layout.getPrimaryHorizontal(start) else layout.getLineLeft(line)
      val segmentEnd =
        if (isLast) {
          //if the end offset is at the start of a new line take the right edge of the line 
          layout.getPrimaryHorizontal(end).takeIf { layout.getLineForOffset(end) == line } ?: layout.getLineRight(line)
        } else {
          layout.getLineRight(line)
        }

      rect.set(
        segmentStart,
        layout.getLineTop(line).toFloat(),
        segmentEnd,
        layout.getLineBottom(line).toFloat(),
      )
      if (rect.width() <= 0f) continue

      // Only round the outer ends of a wrapped mention.
      val leftRadius = if (isFirst) radius else 0f
      val rightRadius = if (isLast) radius else 0f
      // Corner order: top-left, top-right, bottom-right, bottom-left 
      radii[0] = leftRadius
      radii[1] = leftRadius
      radii[2] = rightRadius
      radii[3] = rightRadius
      radii[4] = rightRadius
      radii[5] = rightRadius
      radii[6] = leftRadius
      radii[7] = leftRadius

      path.reset()
      path.addRoundRect(rect, radii, Path.Direction.CW)
      canvas.drawPath(path, paint)
    }
  }
}
