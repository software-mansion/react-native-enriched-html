package com.swmansion.enriched.textinput.styles

import android.text.Editable
import android.text.Spannable
import android.text.SpannableStringBuilder
import android.text.Spanned
import com.swmansion.enriched.common.EnrichedConstants
import com.swmansion.enriched.common.EnrichedSpanFlags
import com.swmansion.enriched.common.spans.interfaces.EnrichedListSpan
import com.swmansion.enriched.textinput.EnrichedTextInputView
import com.swmansion.enriched.textinput.spans.EnrichedInputCheckboxListSpan
import com.swmansion.enriched.textinput.spans.EnrichedInputOrderedListSpan
import com.swmansion.enriched.textinput.spans.EnrichedInputUnorderedListSpan
import com.swmansion.enriched.textinput.spans.EnrichedSpans
import com.swmansion.enriched.textinput.utils.getListCompoundRanges
import com.swmansion.enriched.textinput.utils.getParagraphBounds
import com.swmansion.enriched.textinput.utils.getParagraphListSpan
import com.swmansion.enriched.textinput.utils.getSafeSpanBoundaries
import com.swmansion.enriched.textinput.utils.repairListChains
import com.swmansion.enriched.textinput.utils.safelyInsertZWS
import com.swmansion.enriched.textinput.utils.safelyRemoveZWS
import com.swmansion.enriched.textinput.utils.setAncestorListStyles

class ListStyles(
  private val view: EnrichedTextInputView,
) {
  private fun <T> getPreviousParagraphSpan(
    spannable: Spannable,
    s: Int,
    type: Class<T>,
  ): T? {
    if (s <= 0) return null

    val (previousParagraphStart, previousParagraphEnd) = spannable.getParagraphBounds(s - 1)
    val spans = spannable.getSpans(previousParagraphStart, previousParagraphEnd, type)

    if (spans.isNotEmpty()) {
      return spans.last()
    }

    return null
  }

  private fun getParagraphAncestorListStyles(
    spannable: Spannable,
    start: Int,
    end: Int,
  ): List<String>? = spannable.getParagraphListSpan(start, end)?.ancestorListStyles

  private fun getOrderedListIndex(
    spannable: Spannable,
    s: Int,
    depth: Int,
  ): Int {
    var paragraphStart = s

    while (paragraphStart > 0) {
      val (prevStart, prevEnd) = spannable.getParagraphBounds(paragraphStart - 1)
      val prevDepth = getParagraphAncestorListStyles(spannable, prevStart, prevEnd)?.size ?: 0

      if (prevDepth < depth) break

      if (prevDepth == depth) {
        val previousOrderedSpan = spannable.getSpans(prevStart, prevEnd, EnrichedInputOrderedListSpan::class.java).lastOrNull()
        return (previousOrderedSpan?.getListIndex() ?: 0) + 1
      }

      paragraphStart = prevStart
    }

    return 1
  }

  private fun setSpan(
    spannable: Spannable,
    name: String,
    start: Int,
    end: Int,
    isChecked: Boolean? = false,
    ancestorListStyles: List<String> = emptyList(),
  ) {
    val (safeStart, safeEnd) = spannable.getSafeSpanBoundaries(start, end)

    when (name) {
      EnrichedSpans.UNORDERED_LIST -> {
        val span = EnrichedInputUnorderedListSpan(view.htmlStyle, ancestorListStyles)
        spannable.setSpan(span, safeStart, safeEnd, EnrichedSpanFlags.forSpan(span))
      }

      EnrichedSpans.ORDERED_LIST -> {
        val index = getOrderedListIndex(spannable, safeStart, ancestorListStyles.size)
        val span = EnrichedInputOrderedListSpan(index, view.htmlStyle, ancestorListStyles)
        spannable.setSpan(span, safeStart, safeEnd, EnrichedSpanFlags.forSpan(span))
      }

      EnrichedSpans.CHECKBOX_LIST -> {
        val span = EnrichedInputCheckboxListSpan(isChecked ?: false, view.htmlStyle, ancestorListStyles)
        spannable.setSpan(span, safeStart, safeEnd, EnrichedSpanFlags.forSpan(span))

        // Invalidate layout to update checkbox drawing in case checkbox is bigger than line height
        view.layoutManager.invalidateLayout()
      }
    }
  }

  private fun <T> removeSpansForRange(
    spannable: Spannable,
    start: Int,
    end: Int,
    clazz: Class<T>,
  ): Boolean {
    val ssb = spannable as SpannableStringBuilder
    val spans = ssb.getSpans(start, end, clazz)
    if (spans.isEmpty()) return false

    for (span in spans) {
      ssb.removeSpan(span)
    }

    ssb.safelyRemoveZWS(start, end)
    return true
  }

  fun updateOrderedListIndexes(
    text: Spannable,
    position: Int,
  ) {
    val spans = text.getSpans(position + 1, text.length, EnrichedInputOrderedListSpan::class.java)
    val sortedSpans = spans.sortedBy { text.getSpanStart(it) }
    for (span in sortedSpans) {
      val spanStart = text.getSpanStart(span)
      val index = getOrderedListIndex(text, spanStart, span.depth)
      span.setListIndex(index)
    }
  }

  fun validateListIntegrity(
    spannable: Spannable,
    start: Int,
    end: Int,
  ) {
    var repairedFrom: Int? = null

    for ((compoundStart, compoundEnd) in spannable.getListCompoundRanges(start, end)) {
      if (spannable.repairListChains(compoundStart, compoundEnd)) {
        repairedFrom = repairedFrom ?: compoundStart
      }
    }

    if (repairedFrom == null) return

    updateOrderedListIndexes(spannable, (repairedFrom - 1).coerceAtLeast(0))
    view.selection?.validateStyles()
    view.layoutManager.invalidateLayout()
  }

  fun getCurrentAncestorListStyles(
    start: Int,
    end: Int,
  ): List<List<String>> {
    val spannable = view.text as? Spannable ?: return emptyList()
    var paragraphStart = start
    return spannable.substring(start, end).split("\n").map { paragraph ->
      val paragraphEnd = paragraphStart + paragraph.length
      val ancestorListStyles = getParagraphAncestorListStyles(spannable, paragraphStart, paragraphEnd) ?: emptyList()
      paragraphStart = paragraphEnd + 1
      ancestorListStyles
    }
  }

  private fun toggleStyle(
    name: String,
    checkboxState: Boolean?,
    ancestorListStyles: List<List<String>>? = null,
  ) {
    if (view.selection == null) return
    val config = EnrichedSpans.listSpans[name] ?: return
    val spannable = view.text as SpannableStringBuilder
    val (start, end) = view.selection.getParagraphSelection()
    val styleStart = view.spanState?.getStart(name)

    if (styleStart != null) {
      view.spanState.setStart(name, null)
      removeSpansForRange(spannable, start, end, config.clazz)
      validateListIntegrity(spannable, start, end)
      view.selection.validateStyles()

      return
    }

    if (start == end) {
      val wasInserted = spannable.safelyInsertZWS(start)
      val shift = if (wasInserted) 1 else 0

      view.spanState?.setStart(name, start + shift)
      removeSpansForRange(spannable, start, end, config.clazz)
      setSpan(spannable, name, start, end + shift, checkboxState, ancestorListStyles?.getOrNull(0) ?: emptyList())
      validateListIntegrity(spannable, start, end + shift)

      return
    }

    var currentStart = start
    val paragraphs = spannable.substring(start, end).split("\n")
    removeSpansForRange(spannable, start, end, config.clazz)

    for ((index, paragraph) in paragraphs.withIndex()) {
      val wasInserted = spannable.safelyInsertZWS(currentStart)
      val shift = if (wasInserted) 1 else 0
      val currentEnd = currentStart + paragraph.length + shift
      setSpan(spannable, name, currentStart, currentEnd, checkboxState, ancestorListStyles?.getOrNull(index) ?: emptyList())

      // Safely jump exactly 1 character over the '\n' to the next line
      currentStart = currentEnd + 1
    }

    view.spanState?.setStart(name, currentStart)
    validateListIntegrity(spannable, start, (currentStart - 1).coerceAtLeast(start))
  }

  fun toggleStyle(
    name: String,
    ancestorListStyles: List<List<String>>? = null,
  ) {
    toggleStyle(name, false, ancestorListStyles)
  }

  fun toggleCheckboxListStyle(
    checked: Boolean,
    ancestorListStyles: List<List<String>>? = null,
  ) {
    toggleStyle(EnrichedSpans.CHECKBOX_LIST, checked, ancestorListStyles)
  }

  private fun modifyListNesting(increasing: Boolean) {
    val spannable = view.text as? SpannableStringBuilder ?: return
    val (start, end) = view.selection?.getParagraphSelection() ?: return

    var nextParagraphStart = start
    for (paragraph in spannable.substring(start, end).split("\n")) {
      val paragraphStart = nextParagraphStart
      val paragraphEnd = paragraphStart + paragraph.length
      nextParagraphStart = paragraphEnd + 1

      val span = spannable.getParagraphListSpan(paragraphStart, paragraphEnd) ?: continue
      val newAncestorListStyles =
        if (increasing) {
          if (paragraphStart == 0) continue

          // We look at the line before, to inherit the parent list's chain
          val (prevStart, prevEnd) = spannable.getParagraphBounds(paragraphStart - 1)
          val prevChain = spannable.getParagraphListSpan(prevStart, prevEnd)?.listChain ?: continue
          val chainSize = span.depth + 1
          if (prevChain.size < chainSize) continue

          prevChain.take(chainSize)
        } else {
          if (span.ancestorListStyles.isEmpty()) continue
          span.ancestorListStyles.dropLast(1)
        }

      spannable.setAncestorListStyles(span, newAncestorListStyles)
    }

    updateOrderedListIndexes(spannable, (start - 1).coerceAtLeast(0))
    validateListIntegrity(spannable, start, end)
    view.selection?.validateStyles()
    view.layoutManager.invalidateLayout()
  }

  fun indentList() {
    modifyListNesting(increasing = true)
  }

  fun outdentList() {
    modifyListNesting(increasing = false)
  }

  private fun handleAfterTextChanged(
    s: Editable,
    name: String,
    endCursorPosition: Int,
    previousTextLength: Int,
  ) {
    val config = EnrichedSpans.listSpans[name] ?: return
    val cursorPosition = endCursorPosition.coerceAtMost(s.length)
    val (start, end) = s.getParagraphBounds(cursorPosition)

    val isBackspace = previousTextLength > s.length
    val isNewLine = cursorPosition > 0 && s[cursorPosition - 1] == '\n'
    val spans = s.getSpans(start, end, config.clazz)

    // Remove spans if cursor is at the start of the paragraph and spans exist
    if (isBackspace && start == cursorPosition && spans.isNotEmpty()) {
      removeSpansForRange(s, start, end, config.clazz)
      return
    }

    val previousParagraphSpan = getPreviousParagraphSpan(s, start, config.clazz)
    if (!isBackspace && isNewLine && previousParagraphSpan != null) {
      // Check if the span from the previous line "leaked" into this one
      if (spans.isNotEmpty()) {
        val existingSpan = spans[0]
        val spanStart = s.getSpanStart(existingSpan)

        // If the span started before the current paragraph (belongs to the previous item)
        // update it to end at the newline (start - 1)
        if (spanStart < start) {
          val spanFlags = s.getSpanFlags(existingSpan)
          s.setSpan(existingSpan, spanStart, start - 1, spanFlags)
        }
      }

      val wasInserted = (s as SpannableStringBuilder).safelyInsertZWS(cursorPosition)
      val shift = if (wasInserted) 1 else 0
      val ancestorListStyles = (previousParagraphSpan as? EnrichedListSpan)?.ancestorListStyles ?: emptyList()
      setSpan(s, name, start, end + shift, ancestorListStyles = ancestorListStyles)
      // Inform that new span has been added
      view.selection?.validateStyles()
      return
    }

    if (name === EnrichedSpans.CHECKBOX_LIST) {
      if (spans.isNotEmpty()) {
        val previousSpan = spans[0] as EnrichedInputCheckboxListSpan
        val isChecked = previousSpan.isChecked
        val ancestorListStyles = previousSpan.ancestorListStyles

        for (span in spans) {
          s.removeSpan(span)
        }

        setSpan(s, EnrichedSpans.CHECKBOX_LIST, start, end, isChecked, ancestorListStyles)
      }

      return
    }

    if (spans.isNotEmpty()) {
      val ancestorListStyles = (spans[0] as? EnrichedListSpan)?.ancestorListStyles ?: emptyList()
      for (span in spans) {
        s.removeSpan(span)
      }

      setSpan(s, name, start, end, ancestorListStyles = ancestorListStyles)
    }
  }

  fun afterTextChanged(
    s: Editable,
    startCursorPosition: Int,
    endCursorPosition: Int,
    previousTextLength: Int,
  ) {
    view.runAsATransaction {
      handleAfterTextChanged(s, EnrichedSpans.ORDERED_LIST, endCursorPosition, previousTextLength)
      handleAfterTextChanged(s, EnrichedSpans.UNORDERED_LIST, endCursorPosition, previousTextLength)
      handleAfterTextChanged(s, EnrichedSpans.CHECKBOX_LIST, endCursorPosition, previousTextLength)
    }

    validateListIntegrity(s, startCursorPosition, endCursorPosition)
  }

  fun getStyleRange(): Pair<Int, Int> = view.selection?.getParagraphSelection() ?: Pair(0, 0)

  fun removeStyle(
    name: String,
    start: Int,
    end: Int,
  ): Boolean {
    val config = EnrichedSpans.listSpans[name] ?: return false
    val spannable = view.text as Spannable
    return removeSpansForRange(spannable, start, end, config.clazz)
  }
}
