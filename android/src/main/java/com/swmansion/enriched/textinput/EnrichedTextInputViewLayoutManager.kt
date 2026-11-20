package com.swmansion.enriched.textinput

import com.facebook.react.bridge.Arguments

class EnrichedTextInputViewLayoutManager(
  private val view: EnrichedTextInputView,
) {
  private var forceHeightRecalculationCounter: Int = 0

  fun invalidateLayout() {
    val stateWrapper = view.stateWrapper ?: return

    val text = view.text
    val paint = view.paint

    val needUpdate = MeasurementStore.store(view.id, text, paint, view.usesLocalePreferredLineHeight())
    if (!needUpdate) return

    forceHeightRecalculationCounter++
    val state = Arguments.createMap()
    state.putInt("forceHeightRecalculationCounter", forceHeightRecalculationCounter)
    view.isWaitingForHeightUpdate = true
    stateWrapper.updateState(state)
  }

  fun releaseMeasurementStore() {
    MeasurementStore.release(view.id)
  }
}
