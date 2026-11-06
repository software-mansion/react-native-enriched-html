package com.swmansion.enriched.common

import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.Path
import android.graphics.RectF
import android.text.Layout
import android.text.Spanned
import com.swmansion.enriched.common.spans.EnrichedMentionSpan

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
    backgroundColorFor: (EnrichedMentionSpan, MentionStyle) -> Int = { _, mentionStyle ->
      mentionStyle.backgroundColor
    }, // lambda to handle press state bg color for enrichedText
  ) {
    val spans = text.getSpans(0, text.length, EnrichedMentionSpan::class.java)
    for (span in spans) {
      val mentionStyle = style.mentionsStyle[span.getIndicator()] ?: continue
      val color = backgroundColorFor(span, mentionStyle)
      if (Color.alpha(color) == 0) continue

      val start = text.getSpanStart(span)
      val end = text.getSpanEnd(span)

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

      val segmentStart =
        if (isFirst) layout.getPrimaryHorizontal(start) else layout.getLineLeft(line)
      val segmentEnd =
        if (isLast) {
          layout.getPrimaryHorizontal(end)
        } else {
          layout.getLineRight(line)
        }

      rect.set(
        segmentStart,
        layout.getLineTop(line).toFloat(),
        segmentEnd,
        layout.getLineBottom(line).toFloat(),
      )

      // Only round the outer ends of a wrapped mention.
      val leftRadius = if (isFirst) radius else 0f
      val rightRadius = if (isLast) radius else 0f
      // top-left
      radii[0] = leftRadius
      radii[1] = leftRadius
      // top-right
      radii[2] = rightRadius
      radii[3] = rightRadius
      // bottom-right
      radii[4] = rightRadius
      radii[5] = rightRadius
      // bottom-left
      radii[6] = leftRadius
      radii[7] = leftRadius

      path.reset()
      path.addRoundRect(rect, radii, Path.Direction.CW)
      canvas.drawPath(path, paint)
    }
  }
}
