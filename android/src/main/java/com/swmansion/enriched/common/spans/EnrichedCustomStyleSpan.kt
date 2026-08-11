package com.swmansion.enriched.common.spans

import android.content.res.AssetManager
import android.graphics.Color
import android.text.TextPaint
import android.text.style.MetricAffectingSpan
import com.facebook.react.common.ReactConstants
import com.facebook.react.views.text.ReactTypefaceUtils.applyStyles
import com.swmansion.enriched.common.CustomStyle
import com.swmansion.enriched.common.pixelFromSpOrDp
import com.swmansion.enriched.common.spans.interfaces.EnrichedInlineSpan

open class EnrichedCustomStyleSpan(
  private val foregroundColor: Int?,
  private val backgroundColor: Int?,
  private val fontSizeSp: Float?,
  private val fontFamily: String?,
  private val assets: AssetManager,
  private val allowFontScaling: Boolean,
) : MetricAffectingSpan(),
  EnrichedInlineSpan {
  fun getForegroundColor(): Int? = foregroundColor

  fun getBackgroundColor(): Int? = backgroundColor

  fun getFontSize(): Float? = fontSizeSp

  fun getFontFamily(): String? = fontFamily

  fun toCustomStyle(): CustomStyle =
    CustomStyle(
      foregroundColor = foregroundColor,
      backgroundColor = backgroundColor,
      fontSize = fontSizeSp,
      fontFamily = fontFamily,
    )

  protected fun getAssets(): AssetManager = assets

  protected fun getAllowFontScaling(): Boolean = allowFontScaling

  override fun updateMeasureState(textPaint: TextPaint) {
    applyFontState(textPaint)
  }

  override fun updateDrawState(textPaint: TextPaint) {
    foregroundColor?.let { textPaint.color = it }
    backgroundColor?.let { textPaint.bgColor = withOpacity(it, 80) }
    applyFontState(textPaint)
  }

  private fun applyFontState(textPaint: TextPaint) {
    fontFamily?.trim()?.takeIf { it.isNotEmpty() }?.let { family ->
      textPaint.typeface =
        applyStyles(
          textPaint.typeface,
          ReactConstants.UNSET,
          ReactConstants.UNSET,
          family,
          assets,
        )
    }
    fontSizeSp?.takeIf { it > 0f }?.let { size ->
      textPaint.textSize = pixelFromSpOrDp(size, allowFontScaling)
    }
  }

  private fun withOpacity(
    color: Int,
    alpha: Int,
  ): Int {
    if (Color.alpha(color) != 255) return color
    val a = alpha.coerceIn(0, 255)
    return (color and 0x00FFFFFF) or (a shl 24)
  }
}
