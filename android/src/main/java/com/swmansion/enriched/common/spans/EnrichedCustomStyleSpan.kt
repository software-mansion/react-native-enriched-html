package com.swmansion.enriched.common.spans

import android.content.res.AssetManager
import android.graphics.Typeface
import android.text.TextPaint
import android.text.style.MetricAffectingSpan
import android.util.Log
import com.facebook.react.common.ReactConstants
import com.facebook.react.common.assets.ReactFontManager
import com.facebook.react.views.text.ReactTypefaceUtils.applyStyles
import com.swmansion.enriched.common.CustomStyle
import com.swmansion.enriched.common.pixelFromSpOrDp
import com.swmansion.enriched.common.spans.interfaces.EnrichedInlineSpan
import com.swmansion.enriched.common.withOpacity

open class EnrichedCustomStyleSpan(
  private val foregroundColor: Int?,
  private val backgroundColor: Int?,
  private val fontSizeSp: Float?,
  private val fontFamily: String?,
  private val assets: AssetManager,
  private val allowFontScaling: Boolean,
) : MetricAffectingSpan(),
  EnrichedInlineSpan {
  private val resolvedFontFamily: String? =
    fontFamily?.trim()?.takeIf { it.isNotEmpty() }?.let { family ->
      if (isFontFamilyAvailable(family)) {
        family
      } else {
        Log.w(TAG, "Font family '$family' not found, keeping the current font.")
        null
      }
    }

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
    backgroundColor?.let { textPaint.bgColor = withOpacity(it) }
    applyFontState(textPaint)
  }

  private fun applyFontState(textPaint: TextPaint) {
    resolvedFontFamily?.let { family ->
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

  // ReactFontManager resolves custom fonts in such way, we don't have a way
  // of knowing if Typeface.DEFAULT was returned as a fallback to an unavailable
  // font family, or because we requested a default font family ourselves. We
  // compare desired font to the sans-serif family, which is hardcoded as a default
  // one in the Typeface source code
  private fun isFontFamilyAvailable(family: String): Boolean =
    family == DEFAULT_FAMILY ||
      ReactFontManager.getInstance().getTypeface(family, Typeface.NORMAL, assets) != Typeface.DEFAULT

  companion object {
    private const val TAG = "EnrichedCustomStyleSpan"

    // Mirrors the framework's private Typeface.DEFAULT_FAMILY
    private const val DEFAULT_FAMILY = "sans-serif"
  }
}
