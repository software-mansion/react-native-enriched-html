#include "GumboParser.hpp"
#include <fbjni/fbjni.h>
#include <jni.h>
#include <string>

// JNI's UTF functions use modified UTF-8 but Gumbo needs standard UTF-8.
extern "C" JNIEXPORT jstring JNICALL
Java_com_swmansion_enriched_common_GumboNormalizer_normalizeHtml(
    JNIEnv * /*env*/, jclass /*cls*/, jstring htmlJString) {
  std::string html = facebook::jni::wrap_alias(htmlJString)->toStdString();
  std::string result = GumboParser::normalizeHtml(html);
  if (result.empty())
    return nullptr;
  return facebook::jni::make_jstring(result).release();
}
