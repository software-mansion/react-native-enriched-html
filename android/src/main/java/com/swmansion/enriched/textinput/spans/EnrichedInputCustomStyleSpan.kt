package com.swmansion.enriched.textinput.spans

import android.content.res.AssetManager
import com.swmansion.enriched.common.spans.EnrichedCustomStyleSpan
import com.swmansion.enriched.textinput.spans.interfaces.EnrichedInputSpan
import com.swmansion.enriched.textinput.styles.HtmlStyle

class EnrichedInputCustomStyleSpan(
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
  EnrichedInputSpan {
  override val dependsOnHtmlStyle: Boolean = false

  override fun rebuildWithStyle(htmlStyle: HtmlStyle): EnrichedInputCustomStyleSpan =
    EnrichedInputCustomStyleSpan(
      getForegroundColor(),
      getBackgroundColor(),
      getFontSize(),
      getFontFamily(),
      getAssets(),
      getAllowFontScaling(),
    )
}
