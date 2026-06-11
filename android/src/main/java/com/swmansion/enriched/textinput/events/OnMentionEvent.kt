package com.swmansion.enriched.textinput.events

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap
import com.facebook.react.uimanager.events.Event

class OnMentionEvent(
  surfaceId: Int,
  viewId: Int,
  private val indicator: String,
  private val text: String?,
  private val experimentalSynchronousEvents: Boolean,
) : Event<OnMentionEvent>(surfaceId, viewId) {
  override fun getEventName(): String = EVENT_NAME

  // start/change/end can be emitted as a burst within a single frame
  // (e.g. when switching mentions: end -> start -> change).
  // The default coalescing would merge them in the batch and drop the
  // intermediate ones, so it must be disabled to deliver every event in order.
  override fun canCoalesce(): Boolean = false

  override fun getEventData(): WritableMap? {
    val eventData: WritableMap = Arguments.createMap()
    eventData.putString("indicator", indicator)

    if (text == null) {
      eventData.putNull("text")
    } else {
      eventData.putString("text", text)
    }

    return eventData
  }

  override fun experimental_isSynchronous(): Boolean = experimentalSynchronousEvents

  companion object {
    const val EVENT_NAME: String = "onMention"
  }
}
