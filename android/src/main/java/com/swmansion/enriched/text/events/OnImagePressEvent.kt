package com.swmansion.enriched.text.events

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap
import com.facebook.react.uimanager.events.Event

class OnImagePressEvent(
  surfaceId: Int,
  viewId: Int,
  private val uri: String,
  private val width: Double,
  private val height: Double,
) : Event<OnImagePressEvent>(surfaceId, viewId) {
  override fun getEventName(): String = EVENT_NAME

  override fun getEventData(): WritableMap? {
    val eventData: WritableMap = Arguments.createMap()
    val imageMap = Arguments.createMap()
    imageMap.putString("uri", uri)
    imageMap.putDouble("width", width)
    imageMap.putDouble("height", height)
    eventData.putMap("image", imageMap)
    return eventData
  }

  companion object {
    const val EVENT_NAME: String = "onImagePress"
  }
}
