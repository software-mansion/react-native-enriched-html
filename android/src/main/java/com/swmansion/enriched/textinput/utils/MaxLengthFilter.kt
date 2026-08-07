package com.swmansion.enriched.textinput.utils

import android.text.InputFilter
import android.text.Spanned
import com.swmansion.enriched.common.EnrichedConstants
import com.swmansion.enriched.textinput.EnrichedTextInputView
import java.text.BreakIterator

/**
 * Helpers enforcing the `maxLength` prop.
 *
 * The limit is counted in the editor's plain text, so the zero width spaces that are internally
 * used as style anchors don't take up any of it.
 */
object MaxLength {
  const val UNLIMITED = -1

  /** Length of [text] as seen by the user (zero width spaces excluded). */
  fun plainLengthOf(
    text: CharSequence,
    start: Int = 0,
    end: Int = text.length,
  ): Int {
    var length = 0
    for (i in start until end) {
      if (text[i] != EnrichedConstants.ZWS) length++
    }
    return length
  }

  /**
   * Index in `[start, end]` at which [text] has to be cut so that at most [capacity] plain
   * characters are kept. The cut point snaps outwards to a whole grapheme cluster, so emoji,
   * surrogate pairs and combining marks never end up split in half.
   */
  fun cutIndexIn(
    text: CharSequence,
    start: Int,
    end: Int,
    capacity: Int,
  ): Int {
    var index = start
    var kept = 0

    while (index < end) {
      if (text[index] != EnrichedConstants.ZWS) {
        // zero width spaces are free, any other character needs the capacity
        if (kept >= capacity) break
        kept++
      }
      index++
    }

    return snapOutwards(text, start, end, index)
  }

  private fun snapOutwards(
    text: CharSequence,
    start: Int,
    end: Int,
    cut: Int,
  ): Int {
    if (cut <= start || cut >= end) return cut

    val iterator = BreakIterator.getCharacterInstance()
    iterator.setText(text.subSequence(start, end).toString())

    val localCut = cut - start
    if (iterator.isBoundary(localCut)) return cut

    val next = iterator.following(localCut)
    return if (next == BreakIterator.DONE) end else start + next
  }
}

/**
 * Applies the `maxLength` limit to every change made to the editor's text - typing, dictation, IME
 * composition, pasting and setting the value imperatively all go through the filters of the
 * underlying `Editable`.
 *
 * Text that doesn't fit is truncated rather than rejected, so a change is dropped entirely only
 * when there's no capacity left at all (e.g. typing a character at the limit).
 */
class MaxLengthFilter(
  private val view: EnrichedTextInputView,
) : InputFilter {
  override fun filter(
    source: CharSequence,
    start: Int,
    end: Int,
    dest: Spanned,
    dstart: Int,
    dend: Int,
  ): CharSequence? {
    val maxLength = view.maxLength
    if (maxLength == MaxLength.UNLIMITED) return null

    val keptLength = MaxLength.plainLengthOf(dest) - MaxLength.plainLengthOf(dest, dstart, dend)
    val capacity = maxLength - keptLength

    if (MaxLength.plainLengthOf(source, start, end) <= capacity) {
      // null keeps the original change
      return null
    }

    val cut = MaxLength.cutIndexIn(source, start, end, capacity)

    // subSequence keeps the spans of the incoming text, so pasted content
    // doesn't lose its formatting when it gets truncated
    return if (cut <= start) "" else source.subSequence(start, cut)
  }
}
