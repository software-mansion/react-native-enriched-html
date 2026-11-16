#include "GumboParser.hpp"

// C functions defined in GumboNormalizer.c (compiled as C)
extern "C" {
char *normalize_html(const char *html, size_t len, uint32_t ignored_styles);
void free_normalized_html(char *result);
}

std::string GumboParser::normalizeHtml(const std::string &html,
                                       uint32_t ignoredStyles) {
  char *raw = normalize_html(html.c_str(), html.size(), ignoredStyles);
  if (!raw)
    return {};
  std::string result(raw);
  free_normalized_html(raw);
  return result;
}
