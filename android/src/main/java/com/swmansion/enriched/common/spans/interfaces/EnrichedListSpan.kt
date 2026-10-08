package com.swmansion.enriched.common.spans.interfaces

interface EnrichedListSpan : EnrichedParagraphSpan {
  var ancestorListStyles: List<String>

  val listStyle: String

  val listChain: List<String>
    get() = ancestorListStyles + listStyle

  val depth: Int
    get() = ancestorListStyles.size
}
