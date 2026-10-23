package com.swmansion.enriched.common

interface EnrichedStyle {
  // Headers
  val h1FontSize: Int
  val h1Bold: Boolean
  val h1MarginTop: Int
  val h1MarginBottom: Int
  val h2FontSize: Int
  val h2Bold: Boolean
  val h2MarginTop: Int
  val h2MarginBottom: Int
  val h3FontSize: Int
  val h3Bold: Boolean
  val h3MarginTop: Int
  val h3MarginBottom: Int
  val h4FontSize: Int
  val h4Bold: Boolean
  val h4MarginTop: Int
  val h4MarginBottom: Int
  val h5FontSize: Int
  val h5Bold: Boolean
  val h5MarginTop: Int
  val h5MarginBottom: Int
  val h6FontSize: Int
  val h6Bold: Boolean
  val h6MarginTop: Int
  val h6MarginBottom: Int

  // Blockquote
  val blockquoteColor: Int?
  val blockquoteBorderColor: Int
  val blockquoteStripeWidth: Int
  val blockquoteGapWidth: Int

  // Ordered Lists
  val olGapWidth: Int
  val olMarginLeft: Int
  val olMarginTop: Int
  val olMarginBottom: Int
  val olMarkerFontWeight: Int?
  val olMarkerColor: Int?

  // Unordered Lists
  val ulGapWidth: Int
  val ulMarginLeft: Int
  val ulMarginTop: Int
  val ulMarginBottom: Int
  val ulBulletSize: Int
  val ulBulletColor: Int

  // Checkbox list
  val ulCheckboxBoxSize: Int
  val ulCheckboxGapWidth: Int
  val ulCheckboxMarginLeft: Int
  val ulCheckboxMarginTop: Int
  val ulCheckboxMarginBottom: Int
  val ulCheckboxBoxColor: Int

  // Links
  val aColor: Int
  val aUnderline: Boolean

  // Code Blocks
  val codeBlockColor: Int
  val codeBlockBackgroundColor: Int
  val codeBlockRadius: Float

  // Inline Code
  val inlineCodeColor: Int
  val inlineCodeBackgroundColor: Int

  // Mentions
  val mentionsStyle: Map<String, MentionStyle>
}
