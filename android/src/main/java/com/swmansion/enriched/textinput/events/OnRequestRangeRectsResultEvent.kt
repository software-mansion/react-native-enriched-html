package com.swmansion.enriched.textinput.events

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableArray
import com.facebook.react.bridge.WritableMap
import com.facebook.react.uimanager.events.Event

class OnRequestRangeRectsResultEvent(
  surfaceId: Int,
  viewId: Int,
  private val requestId: Int,
  private val rects: List<RangeRect>,
  private val experimentalSynchronousEvents: Boolean,
) : Event<OnRequestRangeRectsResultEvent>(surfaceId, viewId) {
  override fun getEventName(): String = EVENT_NAME

  override fun getEventData(): WritableMap {
    val rectsArray: WritableArray = Arguments.createArray()

    for (rect in rects) {
      val rectMap = Arguments.createMap()
      rectMap.putInt("range", rect.range)
      rectMap.putDouble("x", rect.x)
      rectMap.putDouble("y", rect.y)
      rectMap.putDouble("width", rect.width)
      rectMap.putDouble("height", rect.height)

      rectsArray.pushMap(rectMap)
    }

    val eventData: WritableMap = Arguments.createMap()
    eventData.putInt("requestId", requestId)
    eventData.putArray("rects", rectsArray)

    return eventData
  }

  override fun experimental_isSynchronous(): Boolean = experimentalSynchronousEvents

  companion object {
    const val EVENT_NAME: String = "onRequestRangeRectsResult"

    // `range` is the index of the requested range the rect belongs to
    data class RangeRect(
      val range: Int,
      val x: Double,
      val y: Double,
      val width: Double,
      val height: Double,
    )
  }
}
