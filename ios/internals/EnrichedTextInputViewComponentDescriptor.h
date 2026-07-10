#pragma once
#include <ReactNativeEnrichedHtml/EnrichedTextInputViewShadowNode.h>
#include <ReactNativeEnrichedHtml/Props.h>
#include <react/debug/react_native_assert.h>
#include <react/renderer/core/ConcreteComponentDescriptor.h>

namespace facebook::react {
class EnrichedTextInputViewComponentDescriptor final
    : public ConcreteComponentDescriptor<EnrichedTextInputViewShadowNode> {
public:
  using ConcreteComponentDescriptor::ConcreteComponentDescriptor;
  void adopt(ShadowNode &shadowNode) const override {
    react_native_assert(
        dynamic_cast<EnrichedTextInputViewShadowNode *>(&shadowNode));
    ConcreteComponentDescriptor::adopt(shadowNode);
  }
};

} // namespace facebook::react
