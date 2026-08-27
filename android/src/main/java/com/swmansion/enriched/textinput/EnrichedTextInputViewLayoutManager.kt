package com.swmansion.enriched.textinput

import com.facebook.react.bridge.Arguments

class EnrichedTextInputViewLayoutManager(
  private val view: EnrichedTextInputView,
) {
  private var forceHeightRecalculationCounter: Int = 0

  fun invalidateLayout() {
    val text = view.text
    val paint = view.paint

    MeasurementStore.store(view.id, text, paint) {
      val stateWrapper = view.stateWrapper ?: return@store false

      forceHeightRecalculationCounter++
      val state = Arguments.createMap()
      state.putInt("forceHeightRecalculationCounter", forceHeightRecalculationCounter)
      stateWrapper.updateState(state)

      true
    }
  }

  fun releaseMeasurementStore() {
    MeasurementStore.release(view.id)
  }
}
