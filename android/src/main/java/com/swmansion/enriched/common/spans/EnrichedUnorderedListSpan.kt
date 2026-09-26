package com.swmansion.enriched.common.spans

import android.graphics.Canvas
import android.graphics.Paint
import android.text.Layout
import android.text.Spanned
import android.text.style.LeadingMarginSpan
import com.swmansion.enriched.common.EnrichedStyle
import com.swmansion.enriched.common.spans.base.EnrichedSpanBase
import com.swmansion.enriched.common.spans.interfaces.EnrichedParagraphSpan

// https://android.googlesource.com/platform/frameworks/base/+/refs/heads/main/core/java/android/text/style/BulletSpan.java
open class EnrichedUnorderedListSpan(
  override val enrichedStyle: EnrichedStyle,
) : EnrichedSpanBase(enrichedStyle),
  LeadingMarginSpan,
  EnrichedParagraphSpan {
  override fun getBaseStyle() = enrichedStyle.baseStyles["ul"]

  override fun getLeadingMargin(p0: Boolean): Int = enrichedStyle.ulBulletSize + enrichedStyle.ulGapWidth + enrichedStyle.ulMarginLeft

  override fun drawLeadingMargin(
    canvas: Canvas,
    paint: Paint,
    x: Int,
    dir: Int,
    top: Int,
    baseline: Int,
    bottom: Int,
    text: CharSequence,
    start: Int,
    end: Int,
    first: Boolean,
    layout: Layout?,
  ) {
    val spannedText = text as Spanned

    if (spannedText.getSpanStart(this) == start) {
      val style = paint.style
      val oldColor = paint.color
      paint.color = enrichedStyle.ulBulletColor
      paint.style = Paint.Style.FILL

      val bulletRadius = enrichedStyle.ulBulletSize / 2f
      val fm = paint.fontMetricsInt
      val yPosition = baseline + (fm.ascent + fm.descent) / 2f
      val xPosition = x + dir * bulletRadius + enrichedStyle.ulMarginLeft

      canvas.drawCircle(xPosition, yPosition, bulletRadius, paint)

      paint.color = oldColor
      paint.style = style
    }
  }
}
