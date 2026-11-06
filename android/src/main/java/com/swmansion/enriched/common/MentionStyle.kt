package com.swmansion.enriched.common

data class MentionStyle(
  val color: Int,
  val backgroundColor: Int,
  val underline: Boolean,
  val pressColor: Int? = null,
  val pressBackgroundColor: Int? = null,
)

/**
 * Attribute-based style override for mentions.
 * When a mention's attributes contain all key-value pairs in `match`,
 * `style` is applied instead of the indicator-based default.
 * First matching rule wins.
 */
data class MentionStyleRule(
  val match: Map<String, String>,
  val style: MentionStyle,
)
