package com.swmansion.enriched.common

// Editor's own HTML is wrapped in <html>...</html> and surrounding whitespace is ignored.
fun isInternalHtml(text: CharSequence): Boolean {
  val trimmed = text.trim()
  return trimmed.startsWith("<html>") && trimmed.endsWith("</html>")
}
