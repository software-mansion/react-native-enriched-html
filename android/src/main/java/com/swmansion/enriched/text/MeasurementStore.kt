package com.swmansion.enriched.text

import android.content.Context
import android.graphics.Typeface
import android.graphics.text.LineBreaker
import android.os.Build
import android.text.Spannable
import android.text.SpannableString
import android.text.StaticLayout
import android.text.TextPaint
import android.text.TextUtils
import android.util.Log
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.uimanager.PixelUtil
import com.facebook.react.views.text.ReactTypefaceUtils.applyStyles
import com.facebook.react.views.text.ReactTypefaceUtils.parseFontStyle
import com.facebook.react.views.text.ReactTypefaceUtils.parseFontWeight
import com.facebook.yoga.YogaMeasureMode
import com.facebook.yoga.YogaMeasureOutput
import com.swmansion.enriched.common.EnrichedConstants
import com.swmansion.enriched.common.GumboNormalizer
import com.swmansion.enriched.common.allowFontScalingFromProps
import com.swmansion.enriched.common.parser.EnrichedParser
import com.swmansion.enriched.common.pixelFromSpOrDp
import com.swmansion.enriched.textinput.spans.EnrichedLineHeightSpan
import kotlin.math.ceil

object MeasurementStore {
  private fun measure(
    maxWidth: Float,
    spannable: CharSequence?,
    typeface: Typeface,
    fontSize: Float,
    numberOfLines: Int,
    ellipsizeMode: String?,
  ): Long {
    val text = spannable ?: ""
    val textLength = text.length
    val paint =
      TextPaint().apply {
        this.typeface = typeface
        textSize = fontSize
      }

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

    if (numberOfLines > 0) {
      val ellipsize =
        when (ellipsizeMode) {
          "head" -> TextUtils.TruncateAt.START
          "middle" -> TextUtils.TruncateAt.MIDDLE
          "tail" -> TextUtils.TruncateAt.END
          "clip" -> null
          else -> null
        }

      builder.setMaxLines(numberOfLines).setEllipsize(ellipsize)
    }

    val staticLayout = builder.build()

    // Workaround for Android issue where maxLines >= 2 and ellipsize != TruncateAt.END
    // In such scenario, StaticLayout always returns lineCount = maxLines even if text fits in less lines
    val actualLineCount =
      if (numberOfLines > 0) {
        staticLayout.lineCount.coerceAtMost(numberOfLines)
      } else {
        staticLayout.lineCount
      }

    // For one line text, use exact line width
    // For multi line, use all available width
    val finalWidth =
      if (staticLayout.lineCount <= 1) {
        staticLayout.getLineWidth(0)
      } else {
        staticLayout.width.toFloat()
      }

    val finalHeight =
      if (actualLineCount > 0) {
        staticLayout.getLineBottom(actualLineCount - 1).toFloat()
      } else {
        0f
      }

    val heightInSP = PixelUtil.toDIPFromPixel(finalHeight)
    val widthInSP = PixelUtil.toDIPFromPixel(finalWidth)
    return YogaMeasureOutput.make(widthInSP, heightInSP)
  }

  private fun getInitialText(
    context: Context,
    fontSize: Int,
    props: ReadableMap?,
  ): CharSequence {
    val text = props?.getString("text") ?: ""
    val isInternalHtml = text.startsWith("<html>") && text.endsWith("</html>")
    val useHtmlNormalizer = useHtmlNormalizerFromProps(props)

    if (!isInternalHtml && !useHtmlNormalizer) {
      return text
    }

    try {
      val textToParse = if (isInternalHtml) text else GumboNormalizer.normalizeHtml(text)
      val style = props?.getMap("htmlStyle") ?: return text
      val allowFontScaling = allowFontScalingFromProps(props)
      val enrichedStyle = EnrichedTextStyle.fromReadableMap(context as ReactContext, fontSize, style, allowFontScaling)

      val factory = EnrichedTextSpanFactory()
      val parsed = EnrichedParser.fromHtml(textToParse, enrichedStyle, factory)
      return parsed.trimEnd('\n')
    } catch (e: Exception) {
      Log.w("MeasurementStore", "Error parsing initial HTML text: ${e.message}")
      return text
    }
  }

  private fun useHtmlNormalizerFromProps(props: ReadableMap?): Boolean {
    if (props == null || !props.hasKey("useHtmlNormalizer") || props.isNull("useHtmlNormalizer")) {
      return false
    }
    return props.getBoolean("useHtmlNormalizer")
  }

  private fun lineHeightFromProps(props: ReadableMap?): Float {
    if (props == null || !props.hasKey("lineHeight") || props.isNull("lineHeight")) {
      return 0f
    }
    return props.getDouble("lineHeight").toFloat()
  }

  private fun getInitialFontSize(props: ReadableMap?): Float {
    val propsFontSize = props?.getDouble("fontSize")?.toFloat() ?: EnrichedConstants.TEXT_DEFAULT_FONT_SIZE
    val fontSize =
      when {
        propsFontSize > 0f -> propsFontSize
        else -> EnrichedConstants.TEXT_DEFAULT_FONT_SIZE
      }

    return ceil(pixelFromSpOrDp(fontSize, allowFontScalingFromProps(props)))
  }

  private fun getMeasureById(
    context: Context,
    width: Float,
    props: ReadableMap?,
  ): Long {
    val fontSize = getInitialFontSize(props)
    val rawText = getInitialText(context, fontSize.toInt(), props)
    val lineHeight = lineHeightFromProps(props)
    val allowFontScaling = allowFontScalingFromProps(props)

    val measuredText: CharSequence =
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

    val fontFamily = props?.getString("fontFamily")
    val numberOfLines = props?.getInt("numberOfLines") ?: 0
    val ellipsizeMode = props?.getString("ellipsizeMode")
    val fontStyle = parseFontStyle(props?.getString("fontStyle"))
    val fontWeight = parseFontWeight(props?.getString("fontWeight"))
    val typeface = applyStyles(null, fontStyle, fontWeight, fontFamily, context.assets)
    val size = measure(width, measuredText, typeface, fontSize, numberOfLines, ellipsizeMode)

    return size
  }

  fun getMeasureById(
    context: Context,
    width: Float,
    height: Float,
    heightMode: YogaMeasureMode?,
    props: ReadableMap?,
  ): Long {
    val size = getMeasureById(context, width, props)
    if (heightMode !== YogaMeasureMode.AT_MOST) return size

    val calculatedHeight = YogaMeasureOutput.getHeight(size)
    val atMostHeight = PixelUtil.toDIPFromPixel(height)
    val finalHeight = calculatedHeight.coerceAtMost(atMostHeight)
    return YogaMeasureOutput.make(YogaMeasureOutput.getWidth(size), finalHeight)
  }
}
