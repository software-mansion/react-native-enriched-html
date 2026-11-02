# InlineStyles and ParagraphStyles create spans with type.getDeclaredConstructor(HtmlStyle::class.java)
-keepclassmembers class com.swmansion.enriched.textinput.spans.** {
  <init>(com.swmansion.enriched.textinput.styles.HtmlStyle);
}
