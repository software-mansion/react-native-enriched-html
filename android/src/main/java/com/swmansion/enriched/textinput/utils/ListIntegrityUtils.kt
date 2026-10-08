package com.swmansion.enriched.textinput.utils

import android.text.Spannable
import com.swmansion.enriched.common.EnrichedSpanFlags
import com.swmansion.enriched.common.spans.interfaces.EnrichedListSpan

fun Spannable.getParagraphListSpan(
  start: Int,
  end: Int,
): EnrichedListSpan? = getSpans(start, end, EnrichedListSpan::class.java).firstOrNull()

fun Spannable.setAncestorListStyles(
  span: EnrichedListSpan,
  ancestorListStyles: List<String>,
) {
  val spanStart = getSpanStart(span)
  val spanEnd = getSpanEnd(span)
  val flags = getSpanFlags(span)
  span.ancestorListStyles = ancestorListStyles

  removeSpan(span)
  setSpan(span, spanStart, spanEnd, EnrichedSpanFlags.forSpan(span, flags))
}

private fun Spannable.isListParagraph(
  start: Int,
  end: Int,
): Boolean = getParagraphListSpan(start, end) != null

// Expands the paragraph to the contiguous run of list paragraphs around it.
private fun Spannable.getListCompoundRange(
  paragraphStart: Int,
  paragraphEnd: Int,
): Pair<Int, Int> {
  var compoundStart = paragraphStart
  var compoundEnd = paragraphEnd

  while (compoundStart > 0) {
    val (prevStart, prevEnd) = getParagraphBounds(compoundStart - 1)
    if (!isListParagraph(prevStart, prevEnd)) break
    compoundStart = prevStart
  }

  while (compoundEnd < length) {
    val (nextStart, nextEnd) = getParagraphBounds(compoundEnd + 1)
    if (!isListParagraph(nextStart, nextEnd)) break
    compoundEnd = nextEnd
  }

  return Pair(compoundStart, compoundEnd)
}

// Ranges of the list compounds (contiguous runs of list paragraphs) that
// intersect with the given range.
fun Spannable.getListCompoundRanges(
  start: Int,
  end: Int,
): List<Pair<Int, Int>> {
  var (rangeStart, rangeEnd) = getParagraphBounds(start, end)
  // the lists in the paragraph right after the edit could have
  // been affected, so it has to be checked as well
  if (rangeEnd < length) {
    rangeEnd = getParagraphBounds(rangeEnd + 1).second
  }

  val compoundRanges = mutableListOf<Pair<Int, Int>>()
  var nextParagraphStart = rangeStart
  for (paragraph in substring(rangeStart, rangeEnd).split("\n")) {
    val paragraphStart = nextParagraphStart
    val paragraphEnd = paragraphStart + paragraph.length
    nextParagraphStart = paragraphEnd + 1

    // already covered by the previously found compound
    val lastCompoundEnd = compoundRanges.lastOrNull()?.second
    if (lastCompoundEnd != null && paragraphStart <= lastCompoundEnd) continue
    if (!isListParagraph(paragraphStart, paragraphEnd)) continue

    compoundRanges.add(getListCompoundRange(paragraphStart, paragraphEnd))
  }

  return compoundRanges
}

// Walks the list compound validating the nested list structure. Returns `true`
// if any list span had to be repaired.
fun Spannable.repairListChains(
  compoundStart: Int,
  compoundEnd: Int,
): Boolean {
  // chains of the preceding paragraphs that can still be parents of the
  // following ones, along with their original depths
  val depthsStack = ArrayDeque<Int>()
  val chainsStack = ArrayDeque<List<String>>()
  var repaired = false

  var nextParagraphStart = compoundStart
  for (paragraph in substring(compoundStart, compoundEnd).split("\n")) {
    val paragraphStart = nextParagraphStart
    val paragraphEnd = paragraphStart + paragraph.length
    nextParagraphStart = paragraphEnd + 1

    val span = getParagraphListSpan(paragraphStart, paragraphEnd) ?: continue
    var chain = span.listChain
    val depth = chain.size

    // pop from both stacks if didn't move deeper into nesting
    while (depthsStack.isNotEmpty() && depthsStack.last() >= depth) {
      depthsStack.removeLast()
      chainsStack.removeLast()
    }
    val parentChain = chainsStack.lastOrNull() ?: emptyList()

    if (!chain.hasParentChain(parentChain)) {
      setAncestorListStyles(span, parentChain)
      chain = span.listChain
      repaired = true
    }

    depthsStack.addLast(depth)
    chainsStack.addLast(chain)
  }

  return repaired
}

private fun List<String>.hasParentChain(parentChain: List<String>): Boolean =
  size == parentChain.size + 1 && take(parentChain.size) == parentChain
