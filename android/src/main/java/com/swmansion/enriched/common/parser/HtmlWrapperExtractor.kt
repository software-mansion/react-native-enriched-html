package com.swmansion.enriched.common.parser

object HtmlWrapperExtractor {
  private const val HTML_OPEN = "<html>"
  private const val HTML_CLOSE = "</html>"
  private const val BODY_OPEN = "<body>"
  private const val BODY_CLOSE = "</body>"

  /**
   * Strips the <html> tags and, if there is a <body> pair inside, keeps only its content
   * (anything outside of it is dropped).
   */
  fun extract(html: String): String {
    val trimmed = html.trim()
    if (!trimmed.startsWith(HTML_OPEN) || !trimmed.endsWith(HTML_CLOSE)) return html

    val inner = trimmed.substring(HTML_OPEN.length, trimmed.length - HTML_CLOSE.length)
    val bodyStart = inner.indexOf(BODY_OPEN)
    if (bodyStart == -1) return inner

    val contentStart = bodyStart + BODY_OPEN.length
    // only look for the closing tag after the opening one
    val bodyEnd = inner.indexOf(BODY_CLOSE, contentStart)
    if (bodyEnd == -1) return inner

    return inner.substring(contentStart, bodyEnd)
  }
}
