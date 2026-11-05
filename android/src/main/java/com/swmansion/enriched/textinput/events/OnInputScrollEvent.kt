package com.swmansion.enriched.textinput.events

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap
import com.facebook.react.uimanager.events.Event

class OnInputScrollEvent(
  surfaceId: Int,
  viewId: Int,
  private val contentOffsetX: Float,
  private val contentOffsetY: Float,
  private val experimentalSynchronousEvents: Boolean,
) : Event<OnInputScrollEvent>(surfaceId, viewId) {
  override fun getEventName(): String = EVENT_NAME

  override fun getEventData(): WritableMap {
    val eventData = Arguments.createMap()
    val contentOffset = Arguments.createMap()
    contentOffset.putDouble("x", contentOffsetX.toDouble())
    contentOffset.putDouble("y", contentOffsetY.toDouble())
    eventData.putMap("contentOffset", contentOffset)
    return eventData
  }

  override fun experimental_isSynchronous(): Boolean = experimentalSynchronousEvents

  companion object {
    const val EVENT_NAME: String = "onInputScroll"
  }
}
