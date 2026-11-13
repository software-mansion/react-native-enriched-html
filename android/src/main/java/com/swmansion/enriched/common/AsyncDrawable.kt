package com.swmansion.enriched.common

import android.graphics.Canvas
import android.graphics.Color
import android.graphics.ColorFilter
import android.graphics.PixelFormat
import android.graphics.drawable.Drawable
import androidx.core.graphics.drawable.toDrawable
import com.swmansion.enriched.R

/**
 * A drawable that starts out transparent and swaps in the image at [url] once
 * [EnrichedImageLoader] delivers it, or a "broken image" placeholder when loading fails.
 */
class AsyncDrawable(
  url: String,
  targetWidthPx: Int,
  targetHeightPx: Int,
) : Drawable() {
  private var internalDrawable: Drawable = Color.TRANSPARENT.toDrawable()

  var isLoaded = false
    private set

  var onLoaded: (() -> Unit)? = null

  init {
    internalDrawable.bounds = bounds
    EnrichedImageLoader.load(url, targetWidthPx, targetHeightPx) { onImageLoaded(it) }
  }

  // Invoked on the main thread by the loader.
  private fun onImageLoaded(drawable: Drawable?) {
    internalDrawable = drawable ?: ResourceManager.getDrawableResource(R.drawable.broken_image)
    internalDrawable.bounds = bounds
    isLoaded = true
    onLoaded?.invoke()
  }

  override fun draw(canvas: Canvas) {
    internalDrawable.draw(canvas)
  }

  override fun setAlpha(alpha: Int) {
    internalDrawable.alpha = alpha
  }

  override fun setColorFilter(colorFilter: ColorFilter?) {
    internalDrawable.colorFilter = colorFilter
  }

  @Deprecated("Deprecated in Java")
  override fun getOpacity(): Int = PixelFormat.TRANSLUCENT

  override fun setBounds(
    left: Int,
    top: Int,
    right: Int,
    bottom: Int,
  ) {
    super.setBounds(left, top, right, bottom)
    internalDrawable.setBounds(left, top, right, bottom)
  }
}
