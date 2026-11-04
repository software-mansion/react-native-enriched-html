package com.swmansion.enriched.common.spans

import android.text.TextPaint
import android.text.style.ClickableSpan
import android.view.View
import com.swmansion.enriched.common.EnrichedStyle
import com.swmansion.enriched.common.MentionStyle
import com.swmansion.enriched.common.spans.interfaces.EnrichedInlineSpan

open class EnrichedMentionSpan(
  private val text: String,
  private val indicator: String,
  private val attributes: Map<String, String>,
  private val enrichedStyle: EnrichedStyle,
) : ClickableSpan(),
  EnrichedInlineSpan {
  override fun onClick(view: View) {
    // Do nothing. Mentions inside the input are not clickable.
    // We are using `ClickableSpan` to allow the text to be styled as a clickable element.
  }

  override fun updateDrawState(textPaint: TextPaint) {
    super.updateDrawState(textPaint)

    val mentionStyle = getMentionStyleForAttributes()
    textPaint.color = mentionStyle.color
    textPaint.bgColor = mentionStyle.backgroundColor
    textPaint.isUnderlineText = mentionStyle.underline
  }

  /**
   * Returns the appropriate MentionStyle for this mention.
   * First checks mentionStyleRules for a match based on attributes.
   * If no rule matches, falls back to indicator-based style.
   */
  private fun getMentionStyleForAttributes(): MentionStyle {
    // Check mentionStyleRules first — first matching rule wins
    if (enrichedStyle.mentionStyleRules.isNotEmpty() && attributes.isNotEmpty()) {
      for (rule in enrichedStyle.mentionStyleRules) {
        val allMatch = rule.match.all { (key, value) ->
          attributes[key] == value
        }
        if (allMatch) {
          return rule.style
        }
      }
    }

    // Fall back to indicator-based lookup
    return enrichedStyle.mentionsStyle[indicator] ?: getDefaultMentionStyle()
  }

  private fun getDefaultMentionStyle(): MentionStyle {
    // Default fallback style matching iOS defaults
    return MentionStyle(
      color = android.graphics.Color.BLUE,
      backgroundColor = android.graphics.Color.YELLOW,
      underline = true,
    )
  }

  fun getAttributes(): Map<String, String> = attributes

  fun getText(): String = text

  fun getIndicator(): String = indicator
}
