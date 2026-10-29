package com.swmansion.enriched.textinput.events

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap
import com.facebook.react.uimanager.events.Event

class OnInputScrollEvent(
  surfaceId: Int,
  viewId: Int,
  private val contentOffsetX: Int,
  private val contentOffsetY: Int,
  private val experimentalSynchronousEvents: Boolean,
) : Event<OnInputScrollEvent>(surfaceId, viewId) {
  override fun getEventName(): String = EVENT_NAME

  override fun getEventData(): WritableMap {
    val eventData = Arguments.createMap()
    val contentOffset = Arguments.createMap()
    contentOffset.putInt("x", contentOffsetX)
    contentOffset.putInt("y", contentOffsetY)
    eventData.putMap("contentOffset", contentOffset)
    return eventData
  }

  override fun experimental_isSynchronous(): Boolean = experimentalSynchronousEvents

  companion object {
    const val EVENT_NAME: String = "onInputScroll"
  }
}
