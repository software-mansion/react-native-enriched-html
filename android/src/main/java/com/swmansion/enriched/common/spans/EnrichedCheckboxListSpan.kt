package com.swmansion.enriched.common.spans

import android.graphics.Canvas
import android.graphics.Paint
import android.text.Layout
import android.text.Spanned
import android.text.TextPaint
import android.text.style.LeadingMarginSpan
import android.text.style.LineHeightSpan
import android.text.style.MetricAffectingSpan
import androidx.core.graphics.withTranslation
import com.swmansion.enriched.common.CheckboxDrawable
import com.swmansion.enriched.common.EnrichedStyle
import com.swmansion.enriched.common.spans.interfaces.EnrichedListSpan
import com.swmansion.enriched.textinput.spans.EnrichedSpans
import com.swmansion.enriched.textinput.styles.HtmlStyle

open class EnrichedCheckboxListSpan(
  open var isChecked: Boolean,
  private val enrichedStyle: EnrichedStyle,
  override var ancestorListStyles: List<String> = emptyList(),
) : MetricAffectingSpan(),
  LineHeightSpan,
  LeadingMarginSpan,
  EnrichedListSpan {
  override val listStyle: String = EnrichedSpans.CHECKBOX_LIST

  private val checkboxDrawable =
    CheckboxDrawable(enrichedStyle.ulCheckboxBoxSize, enrichedStyle.ulCheckboxBoxColor, isChecked).apply {
      setBounds(0, 0, enrichedStyle.ulCheckboxBoxSize, enrichedStyle.ulCheckboxBoxSize)
    }

  override fun updateMeasureState(tp: TextPaint) {
    // Do nothing, but inform layout that this span affects text metrics
  }

  override fun updateDrawState(tp: TextPaint) {
    // Do nothing, but inform layout that this span affects text metrics
  }

  // Include checkbox size in text measurements to avoid clipping
  override fun chooseHeight(
    text: CharSequence,
    start: Int,
    end: Int,
    spanstartv: Int,
    v: Int,
    fm: Paint.FontMetricsInt,
  ) {
    val checkboxSize = enrichedStyle.ulCheckboxBoxSize
    val currentLineHeight = fm.descent - fm.ascent

    if (checkboxSize > currentLineHeight) {
      val extraSpace = checkboxSize - currentLineHeight
      val halfExtra = extraSpace / 2

      fm.ascent -= halfExtra
      fm.descent += (extraSpace - halfExtra)

      fm.top -= halfExtra
      fm.bottom += (extraSpace - halfExtra)
    }
  }

  private fun singleLevelIndent(): Int =
    enrichedStyle.ulCheckboxBoxSize + enrichedStyle.ulCheckboxMarginLeft + enrichedStyle.ulCheckboxGapWidth

  override fun getLeadingMargin(first: Boolean): Int = singleLevelIndent() * (depth + 1)

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
      checkboxDrawable.update(isChecked)

      val fm = paint.fontMetricsInt
      val textCenter = baseline + (fm.ascent + fm.descent) / 2f
      val drawableTop = textCenter - (enrichedStyle.ulCheckboxBoxSize / 2f)

      canvas.withTranslation(x.toFloat() + enrichedStyle.ulCheckboxMarginLeft + depth * singleLevelIndent(), drawableTop) {
        checkboxDrawable.draw(this)
      }
    }
  }
}
