package com.swmansion.enriched.textinput

import android.content.Context
import android.graphics.Paint
import android.graphics.Typeface
import android.graphics.text.LineBreaker
import android.os.Build
import android.text.Spannable
import android.text.SpannableString
import android.text.StaticLayout
import android.text.TextPaint
import android.util.Log
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.uimanager.PixelUtil
import com.facebook.react.views.text.ReactTypefaceUtils.applyStyles
import com.facebook.react.views.text.ReactTypefaceUtils.parseFontStyle
import com.facebook.react.views.text.ReactTypefaceUtils.parseFontWeight
import com.facebook.yoga.YogaMeasureMode
import com.facebook.yoga.YogaMeasureOutput
import com.swmansion.enriched.common.allowFontScalingFromProps
import com.swmansion.enriched.common.parser.EnrichedParser
import com.swmansion.enriched.common.pixelFromSpOrDp
import com.swmansion.enriched.textinput.spans.EnrichedLineHeightSpan
import com.swmansion.enriched.textinput.styles.HtmlStyle
import java.util.concurrent.ConcurrentHashMap
import kotlin.math.ceil

object MeasurementStore {
  data class PaintParams(
    val typeface: Typeface,
    val fontSize: Float,
    val useLocalePreferredLineHeight: Boolean,
  )

  data class MeasurementParams(
    val initialized: Boolean,
    val cachedWidth: Float,
    val cachedSize: Long,
    val spannable: CharSequence?,
    val paintParams: PaintParams,
  )

  private val data = ConcurrentHashMap<Int, MeasurementParams>()

  // In px, as given by Yoga's measure (e.g. from maxHeight)
  private val maxTextHeights = ConcurrentHashMap<Int, Float>()

  fun store(
    id: Int,
    spannable: Spannable?,
    paint: TextPaint,
    useLocalePreferredLineHeight: Boolean,
  ): Boolean {
    val cachedWidth = data[id]?.cachedWidth ?: 0f
    val cachedSize = data[id]?.cachedSize ?: 0L
    val initialized = data[id]?.initialized ?: true

    val size = measure(cachedWidth, spannable, paint, useLocalePreferredLineHeight)
    val paintParams = PaintParams(paint.typeface, paint.textSize, useLocalePreferredLineHeight)

    data[id] = MeasurementParams(initialized, cachedWidth, size, spannable, paintParams)
    return cachedSize != size
  }

  fun release(id: Int) {
    data.remove(id)
    maxTextHeights.remove(id)
  }

  fun getMaxTextHeight(id: Int): Float? = maxTextHeights[id]

  private fun measure(
    maxWidth: Float,
    spannable: CharSequence?,
    paintParams: PaintParams,
  ): Long {
    val paint =
      TextPaint().apply {
        typeface = paintParams.typeface
        textSize = paintParams.fontSize
      }

    return measure(maxWidth, spannable, paint, paintParams.useLocalePreferredLineHeight)
  }

  private fun measure(
    maxWidth: Float,
    spannable: CharSequence?,
    paint: TextPaint,
    useLocalePreferredLineHeight: Boolean,
  ): Long {
    val text = spannable ?: ""
    val textLength = text.length
    val builder =
      StaticLayout.Builder
        .obtain(text, 0, textLength, paint, maxWidth.toInt())
        .setIncludePad(true)
        .setLineSpacing(0f, 1f)

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      builder.setBreakStrategy(LineBreaker.BREAK_STRATEGY_HIGH_QUALITY)
    }

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
      builder.setUseLineSpacingFromFallbacks(true)
    }

    // EditText (targetSdk 35+) keeps empty lines as tall as lines with text, otherwise they're measured shorter than drawn
    if (useLocalePreferredLineHeight && Build.VERSION.SDK_INT >= Build.VERSION_CODES.VANILLA_ICE_CREAM) {
      val minimumFontMetrics = Paint.FontMetrics()
      paint.getFontMetricsForLocale(minimumFontMetrics)
      builder.setMinimumFontMetrics(minimumFontMetrics)
    }

    val staticLayout = builder.build()
    val heightInSP = PixelUtil.toDIPFromPixel(staticLayout.height.toFloat())
    val widthInSP = PixelUtil.toDIPFromPixel(maxWidth)
    return YogaMeasureOutput.make(widthInSP, heightInSP)
  }

  // Returns either: Spannable parsed from HTML defaultValue, or plain text defaultValue, or "I" if no defaultValue
  private fun getInitialText(
    defaultView: EnrichedTextInputView,
    props: ReadableMap?,
  ): CharSequence {
    val defaultValue = props?.getString("defaultValue")

    // If there is no default value, assume text is one line, "I" is a good approximation of height
    if (defaultValue == null) return "I"

    val isHtml = defaultValue.startsWith("<html>") && defaultValue.endsWith("</html>")
    if (!isHtml) return defaultValue

    try {
      val htmlStyle = HtmlStyle(defaultView, props.getMap("htmlStyle"))
      val factory =
        EnrichedTextInputSpannableFactory(
          defaultView.context.assets,
          allowFontScalingFromProps(props),
        )
      val parsed = EnrichedParser.fromHtml(defaultValue, htmlStyle, factory)
      return parsed.trimEnd('\n')
    } catch (e: Exception) {
      Log.w("MeasurementStore", "Error parsing initial HTML text: ${e.message}")
      return defaultValue
    }
  }

  private fun getInitialFontSize(
    defaultView: EnrichedTextInputView,
    props: ReadableMap?,
  ): Float {
    val propsFontSize = props?.getDouble("fontSize")?.toFloat()
    if (propsFontSize == null || propsFontSize <= 0) return defaultView.textSize

    return ceil(pixelFromSpOrDp(propsFontSize, allowFontScalingFromProps(props)))
  }

  // Called when view measurements are not available in the store
  // Most likely first measurement, we can use defaultValue, as no native state is set yet
  private fun initialMeasure(
    context: Context,
    id: Int?,
    width: Float,
    props: ReadableMap?,
  ): Long {
    val defaultView = EnrichedTextInputView(context)
    val allowFontScaling = allowFontScalingFromProps(props)
    // mirrors the real view's state
    defaultView.allowFontScaling = allowFontScaling

    val rawText = getInitialText(defaultView, props)
    val fontSize = getInitialFontSize(defaultView, props)
    val lineHeight = props?.getDouble("lineHeight")?.toFloat() ?: 0f

    val fontFamily = props?.getString("fontFamily")
    val fontStyle = parseFontStyle(props?.getString("fontStyle"))
    val fontWeight = parseFontWeight(props?.getString("fontWeight"))

    val text: CharSequence =
      if (lineHeight > 0f) {
        val spannable = SpannableString(rawText)
        spannable.setSpan(
          EnrichedLineHeightSpan(lineHeight, allowFontScaling),
          0,
          spannable.length,
          Spannable.SPAN_INCLUSIVE_INCLUSIVE,
        )
        spannable
      } else {
        rawText
      }

    val typeface = applyStyles(defaultView.typeface, fontStyle, fontWeight, fontFamily, context.assets)
    val paintParams = PaintParams(typeface, fontSize, defaultView.usesLocalePreferredLineHeight())
    val size = measure(width, text, paintParams)

    if (id != null) {
      data[id] = MeasurementParams(true, width, size, text, paintParams)
    }

    return size
  }

  private fun getMeasureById(
    context: Context,
    id: Int?,
    width: Float,
    props: ReadableMap?,
  ): Long {
    val id = id ?: return initialMeasure(context, id, width, props)
    val value = data[id] ?: return initialMeasure(context, id, width, props)

    // First measure has to be done using initialMeasure
    // That way it's free of any side effects and async initializations
    if (!value.initialized) return initialMeasure(context, id, width, props)

    if (width == value.cachedWidth) {
      return value.cachedSize
    }

    val paint =
      TextPaint().apply {
        typeface = value.paintParams.typeface
        textSize = value.paintParams.fontSize
      }

    val size = measure(width, value.spannable, paint, value.paintParams.useLocalePreferredLineHeight)
    data[id] = MeasurementParams(true, width, size, value.spannable, value.paintParams)
    return size
  }

  fun getMeasureById(
    context: Context,
    id: Int?,
    width: Float,
    height: Float,
    heightMode: YogaMeasureMode?,
    props: ReadableMap?,
  ): Long {
    val size = getMeasureById(context, id, width, props)

    if (id != null) {
      when (heightMode) {
        YogaMeasureMode.AT_MOST -> maxTextHeights[id] = height
        YogaMeasureMode.UNDEFINED -> maxTextHeights[id] = Float.POSITIVE_INFINITY
        else -> maxTextHeights.remove(id)
      }
    }

    if (heightMode !== YogaMeasureMode.AT_MOST) {
      return size
    }

    val calculatedHeight = YogaMeasureOutput.getHeight(size)
    val atMostHeight = PixelUtil.toDIPFromPixel(height)
    val finalHeight = calculatedHeight.coerceAtMost(atMostHeight)
    return YogaMeasureOutput.make(YogaMeasureOutput.getWidth(size), finalHeight)
  }
}
