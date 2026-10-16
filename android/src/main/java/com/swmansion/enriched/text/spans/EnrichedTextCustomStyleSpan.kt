package com.swmansion.enriched.text.spans

import android.content.res.AssetManager
import com.swmansion.enriched.common.spans.EnrichedCustomStyleSpan
import com.swmansion.enriched.text.EnrichedTextStyle
import com.swmansion.enriched.text.spans.interfaces.EnrichedTextSpan

class EnrichedTextCustomStyleSpan(
  foregroundColor: Int?,
  backgroundColor: Int?,
  fontSize: Float?,
  fontFamily: String?,
  assets: AssetManager,
  allowFontScaling: Boolean,
) : EnrichedCustomStyleSpan(
    foregroundColor,
    backgroundColor,
    fontSize,
    fontFamily,
    assets,
    allowFontScaling,
  ),
  EnrichedTextSpan {
  override val dependsOnHtmlStyle: Boolean = false

  override fun rebuildWithStyle(style: EnrichedTextStyle): EnrichedTextCustomStyleSpan =
    EnrichedTextCustomStyleSpan(
      getForegroundColor(),
      getBackgroundColor(),
      getFontSize(),
      getFontFamily(),
      getAssets(),
      getAllowFontScaling(),
    )
}
