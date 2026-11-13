package com.swmansion.enriched.common

import android.content.res.Resources
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.ImageDecoder
import android.graphics.drawable.AnimatedImageDrawable
import android.graphics.drawable.BitmapDrawable
import android.graphics.drawable.Drawable
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.util.Log
import android.util.LruCache
import androidx.core.graphics.drawable.toDrawable
import com.facebook.common.memory.PooledByteBuffer
import com.facebook.common.memory.PooledByteBufferInputStream
import com.facebook.common.references.CloseableReference
import com.facebook.datasource.BaseDataSubscriber
import com.facebook.datasource.DataSource
import com.facebook.drawee.backends.pipeline.Fresco
import com.facebook.imagepipeline.request.ImageRequest
import java.nio.ByteBuffer
import java.util.concurrent.Executors
import kotlin.math.max
import kotlin.math.min
import kotlin.math.roundToInt

/**
 * Shared loader for the remote images displayed by image spans.
 *
 * Fetching goes through React Native's Fresco image pipeline, which already provides an encoded
 * memory cache, a disk cache and merging of concurrent requests for the same URL (and shares all of
 * that with React Native's own `<Image>`). On top of that, this loader merges concurrent decodes of
 * the same image and keeps decoded static bitmaps in an LRU cache, so every span showing the same
 * image shares a single bitmap.
 */
object EnrichedImageLoader {
  private const val TAG = "EnrichedImageLoader"

  private val mainHandler = Handler(Looper.getMainLooper())

  // Downloads are handled by Fresco; decoding happens on this small shared pool
  // instead of on a new thread per image.
  private val decodeExecutor =
    Executors.newFixedThreadPool(2) { runnable ->
      Thread(runnable, TAG).apply { isDaemon = true }
    }

  // Callbacks waiting for an image that is currently being fetched or decoded, keyed by cache key.
  private val pending = HashMap<String, MutableList<(Drawable?) -> Unit>>()

  private val bitmapCache =
    object : LruCache<String, Bitmap>((Runtime.getRuntime().maxMemory() / 8).toInt()) {
      override fun sizeOf(
        key: String,
        value: Bitmap,
      ): Int = value.allocationByteCount
    }

  /**
   * Loads and decodes [uri], downsampling the image so that it is no larger than needed to cover
   * [targetWidthPx] x [targetHeightPx]. [callback] is always invoked on the main thread and
   * receives null when the image could not be loaded.
   */
  fun load(
    uri: String,
    targetWidthPx: Int,
    targetHeightPx: Int,
    callback: (Drawable?) -> Unit,
  ) {
    val key = "$uri|${targetWidthPx}x$targetHeightPx"

    bitmapCache.get(key)?.let { bitmap ->
      runOnMain { callback(bitmap.toDrawable(Resources.getSystem())) }
      return
    }

    synchronized(pending) {
      val waiters = pending[key]
      if (waiters != null) {
        waiters.add(callback)
        return
      }
      pending[key] = mutableListOf(callback)
    }

    fetch(uri) { bytes -> onFetched(key, targetWidthPx, targetHeightPx, bytes) }
  }

  private fun fetch(
    uri: String,
    onBytes: (ByteArray?) -> Unit,
  ) {
    // fresco should always be initalized by react native so we dont expect this to happen, but we
    // check just in case.
    if (!Fresco.hasBeenInitialized()) {
      Log.e(TAG, "Fresco is not initialised, cannot load: $uri")
      onBytes(null)
      return
    }

    val request = ImageRequest.fromUri(uri)
    if (request == null) {
      onBytes(null)
      return
    }

    Fresco
      .getImagePipeline()
      .fetchEncodedImage(request, null)
      .subscribe(
        object : BaseDataSubscriber<CloseableReference<PooledByteBuffer>>() {
          override fun onNewResultImpl(dataSource: DataSource<CloseableReference<PooledByteBuffer>>) {
            if (!dataSource.isFinished) return

            val reference = dataSource.result
            val bytes =
              try {
                reference?.get()?.let { buffer ->
                  PooledByteBufferInputStream(buffer).use { it.readBytes() }
                }
              } finally {
                CloseableReference.closeSafely(reference)
              }
            onBytes(bytes)
          }

          override fun onFailureImpl(dataSource: DataSource<CloseableReference<PooledByteBuffer>>) {
            Log.e(TAG, "Failed to load: $uri", dataSource.failureCause)
            onBytes(null)
          }

          override fun onCancellation(dataSource: DataSource<CloseableReference<PooledByteBuffer>>) {
            onBytes(null)
          }
        },
        decodeExecutor,
      )
  }

  // Runs on the decode executor, or inline on the caller's thread when the fetch could not start.
  private fun onFetched(
    key: String,
    targetWidthPx: Int,
    targetHeightPx: Int,
    bytes: ByteArray?,
  ) {
    val decoded = bytes?.let { decode(it, targetWidthPx, targetHeightPx) }
    val bitmap = (decoded as? BitmapDrawable)?.bitmap
    if (bitmap != null) {
      bitmapCache.put(key, bitmap)
    }

    val waiters = synchronized(pending) { pending.remove(key) } ?: return
    val drawables =
      when {
        bytes == null || decoded == null -> {
          List(waiters.size) { null }
        }

        // Static images share a single bitmap between every span displaying them.
        bitmap != null -> {
          List(waiters.size) { bitmap.toDrawable(Resources.getSystem()) }
        }

        // Animated drawables carry their own playback state, so each span gets its own
        // instance.
        else -> {
          List(waiters.size) { index ->
            if (index == 0) decoded else decode(bytes, targetWidthPx, targetHeightPx)
          }
        }
      }

    runOnMain { waiters.forEachIndexed { index, callback -> callback(drawables[index]) } }
  }

  private fun decode(
    bytes: ByteArray,
    targetWidthPx: Int,
    targetHeightPx: Int,
  ): Drawable? {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
      try {
        val source = ImageDecoder.createSource(ByteBuffer.wrap(bytes))
        val drawable =
          ImageDecoder.decodeDrawable(source) { decoder, info, _ ->
            // Large images are downsampled to roughly their displayed size, keeping the
            // aspect ratio.
            val scale =
              coverScale(
                info.size.width,
                info.size.height,
                targetWidthPx,
                targetHeightPx,
              )
            if (scale < 1f) {
              decoder.setTargetSize(
                max(1, (info.size.width * scale).roundToInt()),
                max(1, (info.size.height * scale).roundToInt()),
              )
            }
          }

        if (drawable is AnimatedImageDrawable) {
          drawable.repeatCount = AnimatedImageDrawable.REPEAT_INFINITE
          drawable.start()
        }

        return drawable
      } catch (e: Exception) {
        Log.w(TAG, "ImageDecoder failed, falling back to BitmapFactory", e)
      }
    }

    return try {
      BitmapFactory.decodeByteArray(bytes, 0, bytes.size)?.toDrawable(Resources.getSystem())
    } catch (e: Exception) {
      Log.e(TAG, "Failed to decode image", e)
      null
    }
  }

  /** The largest scale (at most 1) at which the image still covers the target area. */
  private fun coverScale(
    imageWidth: Int,
    imageHeight: Int,
    targetWidth: Int,
    targetHeight: Int,
  ): Float {
    if (imageWidth <= 0 || imageHeight <= 0 || targetWidth <= 0 || targetHeight <= 0) {
      return 1f
    }

    return min(1f, max(targetWidth / imageWidth.toFloat(), targetHeight / imageHeight.toFloat()))
  }

  private fun runOnMain(block: () -> Unit) {
    if (Looper.myLooper() == Looper.getMainLooper()) {
      block()
    } else {
      mainHandler.post(block)
    }
  }
}
