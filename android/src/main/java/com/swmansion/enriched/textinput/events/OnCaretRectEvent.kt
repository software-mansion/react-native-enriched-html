package com.swmansion.enriched.textinput.events

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap
import com.facebook.react.uimanager.events.Event

class OnCaretRectEvent(
  surfaceId: Int,
  viewId: Int,
  private val requestId: Int,
  private val x: Double,
  private val y: Double,
  private val width: Double,
  private val height: Double,
  private val valid: Boolean,
  private val experimentalSynchronousEvents: Boolean,
) : Event<OnCaretRectEvent>(surfaceId, viewId) {
  override fun getEventName(): String = EVENT_NAME

  override fun getEventData(): WritableMap {
    val eventData: WritableMap = Arguments.createMap()
    eventData.putInt("requestId", requestId)
    eventData.putDouble("x", x)
    eventData.putDouble("y", y)
    eventData.putDouble("width", width)
    eventData.putDouble("height", height)
    eventData.putBoolean("valid", valid)
    return eventData
  }

  override fun experimental_isSynchronous(): Boolean = experimentalSynchronousEvents

  companion object {
    const val EVENT_NAME: String = "onCaretRect"
  }
}
