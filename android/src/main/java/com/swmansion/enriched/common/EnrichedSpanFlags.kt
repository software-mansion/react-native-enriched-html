package com.swmansion.enriched.common

import android.text.Spannable
import com.swmansion.enriched.common.spans.EnrichedAlignmentSpan
import com.swmansion.enriched.common.spans.interfaces.EnrichedInlineSpan

// Higher priority spans are processed first, so styles with lower priorities are painted on top of previously applied styles.
// For example, inline styles are applied on top of paragraph styles, allowing them to override paragraph-level styling.
// Alignment styles are applied last, ensuring they position the final, fully styled text.
object EnrichedSpanFlags {
  private const val ALIGNMENT_SPAN_PRIORITY = 0
  private const val INLINE_SPAN_PRIORITY = 1
  private const val PARAGRAPH_SPAN_PRIORITY = 2

  @JvmStatic
  @JvmOverloads
  fun forSpan(
    span: Any?,
    baseFlags: Int = Spannable.SPAN_EXCLUSIVE_EXCLUSIVE,
  ): Int {
    val priority =
      when (span) {
        is EnrichedAlignmentSpan -> ALIGNMENT_SPAN_PRIORITY
        is EnrichedInlineSpan -> INLINE_SPAN_PRIORITY
        else -> PARAGRAPH_SPAN_PRIORITY
      }
    return applyPriority(baseFlags, priority)
  }

  private fun applyPriority(
    flags: Int,
    priority: Int,
  ): Int {
    // Cleaning up priority bits
    val cleared = flags and Spannable.SPAN_PRIORITY.inv()
    // Injecting priority bits
    return cleared or ((priority shl Spannable.SPAN_PRIORITY_SHIFT) and Spannable.SPAN_PRIORITY)
  }
}
