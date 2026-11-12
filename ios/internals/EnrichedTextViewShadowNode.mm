#import "EnrichedTextViewShadowNode.h"
#import "CoreText/CoreText.h"
#import "EnrichedMainThreadMeasure.h"
#import "EnrichedTextView.h"
#import <React/RCTShadowView+Layout.h>
#import <react/utils/ManagedObjectWrapper.h>
#import <yoga/Yoga.h>

namespace facebook::react {

extern const char EnrichedTextViewComponentName[] = "EnrichedTextView";

id EnrichedTextViewShadowNode::setupMockTextView_(const Props::Shared &props) {
  const int veryFarAway = 20000;
  const int mockSize = 1000;
  EnrichedTextView *mockView = [[EnrichedTextView alloc]
      initWithFrame:(CGRectMake(veryFarAway, veryFarAway, mockSize, mockSize))];
  [mockView updateProps:props oldProps:nullptr];
  return mockView;
}

EnrichedTextViewShadowNode::EnrichedTextViewShadowNode(
    const ShadowNode &sourceShadowNode, const ShadowNodeFragment &fragment)
    : ConcreteViewShadowNode(sourceShadowNode, fragment) {
  // A new snapshot means the content may have a different size.
  // React Native currently dirties measurable nodes on
  // every clone anyway, but we don't want to depend on that.
  const auto &sourceState =
      static_cast<const EnrichedTextViewShadowNode &>(sourceShadowNode)
          .getStateData();
  if (getStateData().getMeasurementSnapshot() !=
      sourceState.getMeasurementSnapshot()) {
    YGNodeMarkDirty(&yogaNode_);
  }
}

Size EnrichedTextViewShadowNode::measureContent(
    const LayoutContext &layoutContext,
    const LayoutConstraints &layoutConstraints) const {
  // Never block on the main thread here - layout may run on the JS thread
  // while main waits for the shadow tree lock / JS runtime. Measure the
  // immutable snapshot that the component view put into the state instead.
  const CGFloat maxWidth = layoutConstraints.maximumSize.width;
  const auto &state = this->getStateData();
  CGSize estimatedSize;

  NSAttributedString *snapshot =
      (NSAttributedString *)unwrapManagedObject(state.getMeasurementSnapshot());

  if (snapshot != nil) {
    estimatedSize = [EnrichedTextView
             measureSnapshot:snapshot
                    maxWidth:maxWidth
        maximumNumberOfLines:(NSUInteger)state.getMaximumNumberOfLines()
               lineBreakMode:(NSLineBreakMode)state.getLineBreakMode()];
  } else if ([NSThread isMainThread]) {
    // not mounted yet - measure the initial props using a mock view
    EnrichedTextView *mockView = setupMockTextView_(this->getProps());
    estimatedSize = [mockView measureSize:maxWidth];
  } else {
    // Not mounted yet and off the main thread: the mock view has to be created
    // on main, but we only wait for it for a bounded time. If main doesn't
    // respond, report no height for now.
    const auto props = this->getProps();
    if (!enrichedMeasureOnMainThread(
            ^CGSize {
              EnrichedTextView *mockView = setupMockTextView_(props);
              return [mockView measureSize:maxWidth];
            },
            estimatedSize)) {
      estimatedSize = CGSizeMake(maxWidth, 0);
    }
  }

  return {estimatedSize.width,
          MIN(estimatedSize.height, layoutConstraints.maximumSize.height)};
}

} // namespace facebook::react
