package com.swmansion.enriched.common

data class BaseStyle(
  val bold: Boolean = false,
  val italic: Boolean = false,
  val underline: Boolean = false,
  val strikethrough: Boolean = false,
) {
  companion object {
    val TYPE_KEYS =
      listOf(
        "bold",
        "italic",
        "underline",
        "strikethrough",
        "h1",
        "h2",
        "h3",
        "h4",
        "h5",
        "h6",
        "blockquote",
        "codeblock",
        "code",
        "a",
        "ol",
        "ul",
        "ulCheckbox",
      )
  }
}
