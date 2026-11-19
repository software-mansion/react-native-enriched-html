package com.swmansion.enriched.textinput.utils

import android.text.Editable
import android.text.Spannable
import android.text.SpannableStringBuilder
import com.swmansion.enriched.textinput.EnrichedTextInputView
import com.swmansion.enriched.textinput.watchers.EnrichedSpanWatcher

class EnrichedEditableFactory(
  private val view: EnrichedTextInputView,
  private val watcher: EnrichedSpanWatcher,
) : Editable.Factory() {
  override fun newEditable(source: CharSequence): Editable {
    val s = source as? EnrichedEditable ?: EnrichedEditable(view, source)
    s.removeSpan(watcher)
    s.setSpan(watcher, 0, s.length, Spannable.SPAN_INCLUSIVE_INCLUSIVE)
    return s
  }
}

class EnrichedEditable(
  private val view: EnrichedTextInputView,
  source: CharSequence,
) : SpannableStringBuilder(source) {
  // Every edit goes through here, hence the nested events batching.
  override fun replace(
    start: Int,
    end: Int,
    tb: CharSequence,
    tbstart: Int,
    tbend: Int,
  ): SpannableStringBuilder {
    var result: SpannableStringBuilder = this
    view.batchEvents { result = super.replace(start, end, tb, tbstart, tbend) }
    return result
  }
}
