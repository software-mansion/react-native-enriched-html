package com.swmansion.enriched.text.spans

import android.graphics.drawable.Drawable
import android.os.Handler
import android.os.Looper
import android.view.View
import com.facebook.react.bridge.ReactContext
import com.facebook.react.uimanager.UIManagerHelper
import com.swmansion.enriched.R
import com.swmansion.enriched.common.AsyncDrawable
import com.swmansion.enriched.common.ResourceManager
import com.swmansion.enriched.common.spans.EnrichedImageSpan
import com.swmansion.enriched.text.EnrichedTextStyle
import com.swmansion.enriched.text.events.OnImagePressEvent
import com.swmansion.enriched.text.spans.interfaces.EnrichedTextClickableSpan
import com.swmansion.enriched.text.spans.interfaces.EnrichedTextSpan

class EnrichedTextImageSpan(
  drawable: Drawable,
  source: String,
  width: Int,
  height: Int,
) : EnrichedImageSpan(drawable, source, width, height),
  EnrichedTextSpan,
  EnrichedTextClickableSpan {
  override val dependsOnHtmlStyle = false
  override var isPressed = false

  override fun rebuildWithStyle(style: EnrichedTextStyle) = this

  override fun onClick(view: View) {
    val context = view.context as? ReactContext ?: return
    val surfaceId = UIManagerHelper.getSurfaceId(context)
    val dispatcher = UIManagerHelper.getEventDispatcherForReactTag(context, view.id)
    dispatcher?.dispatchEvent(
      OnImagePressEvent(
        surfaceId,
        view.id,
        source ?: "",
        getWidth().toDouble(),
        getHeight().toDouble(),
      ),
    )
  }

// We use a callback to trigger a layout rebuild because ForceRedrawSpan/SpanWatcher
// (used in EnrichedImageSpan) doesn’t work in EnrichedTextView with SpannedString.
  fun observeAsyncDrawableLoaded(onLoaded: () -> Unit) {
    val d = drawable

    if (d !is AsyncDrawable) {
      return
    }

    d.onLoaded = {
      Handler(Looper.getMainLooper()).post { onLoaded() }
    }

    if (d.isLoaded) {
      d.onLoaded?.invoke()
    }
  }

  companion object {
    fun createEnrichedImageSpan(
      src: String,
      width: Int,
      height: Int,
    ): EnrichedImageSpan {
      var imgDrawable = prepareDrawableForImage(src, width, height)

      if (imgDrawable == null) {
        imgDrawable = ResourceManager.getDrawableResource(R.drawable.broken_image)
      }

      return EnrichedTextImageSpan(imgDrawable, src, width, height)
    }
  }
}
