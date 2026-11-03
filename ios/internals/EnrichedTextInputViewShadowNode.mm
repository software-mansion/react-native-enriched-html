#import "EnrichedTextInputViewShadowNode.h"
#import "CoreText/CoreText.h"
#import "EnrichedMainThreadMeasure.h"
#import "EnrichedTextInputView.h"
#import <React/RCTShadowView+Layout.h>
#import <react/utils/ManagedObjectWrapper.h>
#import <yoga/Yoga.h>

namespace facebook::react {

extern const char EnrichedTextInputViewComponentName[] =
    "EnrichedTextInputView";

EnrichedTextInputViewShadowNode::EnrichedTextInputViewShadowNode(
    const ShadowNodeFragment &fragment, const ShadowNodeFamily::Shared &family,
    ShadowNodeTraits traits)
    : ConcreteViewShadowNode(fragment, family, traits) {
  localForceHeightRecalculationCounter_ = 0;
}

// mock input is used for the first measure calls that need to be done when the
// real input isn't defined yet
id EnrichedTextInputViewShadowNode::setupMockTextInputView_(
    const Props::Shared &props) {
  // it's rendered far away from the viewport
  const int veryFarAway = 20000;
  const int mockSize = 1000;
  EnrichedTextInputView *mockTextInputView_ = [[EnrichedTextInputView alloc]
      initWithFrame:(CGRectMake(veryFarAway, veryFarAway, mockSize, mockSize))];
  mockTextInputView_->blockEmitting = YES;
  [mockTextInputView_ updateProps:props oldProps:nullptr];
  return mockTextInputView_;
}

EnrichedTextInputViewShadowNode::EnrichedTextInputViewShadowNode(
    const ShadowNode &sourceShadowNode, const ShadowNodeFragment &fragment)
    : ConcreteViewShadowNode(sourceShadowNode, fragment) {
  dirtyLayoutIfNeeded();
}

void EnrichedTextInputViewShadowNode::dirtyLayoutIfNeeded() {
  const auto state = this->getStateData();
  const int receivedCounter = state.getForceHeightRecalculationCounter();

  if (receivedCounter > localForceHeightRecalculationCounter_) {
    localForceHeightRecalculationCounter_ = receivedCounter;
    YGNodeMarkDirty(&yogaNode_);
  }
}

Size EnrichedTextInputViewShadowNode::measureContent(
    const LayoutContext &layoutContext,
    const LayoutConstraints &layoutConstraints) const {
  // Layout usually runs on the JS thread, possibly while holding the shadow
  // tree lock or the JS runtime. The main thread may be waiting for either of
  // them, so we must never block on main from here - it deadlocks. Instead we
  // measure an immutable snapshot of the content that the component view put
  // into the state.
  const CGFloat maxWidth = layoutConstraints.maximumSize.width;
  CGSize estimatedSize;

  NSAttributedString *snapshot = (NSAttributedString *)unwrapManagedObject(
      this->getStateData().getMeasurementSnapshot());

  if (snapshot != nil) {
    estimatedSize = [EnrichedTextInputView measureSnapshot:snapshot
                                                  maxWidth:maxWidth];
  } else if ([NSThread isMainThread]) {
    // not mounted yet - measure the initial props using a mock view
    EnrichedTextInputView *mockTextInputView =
        setupMockTextInputView_(this->getProps());
    estimatedSize = [mockTextInputView measureSize:maxWidth];
  } else {
    // Not mounted yet and off the main thread: the mock view has to be created
    // on main, but we only wait for it for a bounded time. If main doesn't
    // respond, report no height for now.
    const auto props = this->getProps();
    if (!enrichedMeasureOnMainThread(
            ^CGSize {
              EnrichedTextInputView *mockTextInputView =
                  setupMockTextInputView_(props);
              return [mockTextInputView measureSize:maxWidth];
            },
            estimatedSize)) {
      estimatedSize = CGSizeMake(maxWidth, 0);
    }
  }

  return {estimatedSize.width,
          MIN(estimatedSize.height, layoutConstraints.maximumSize.height)};
}

} // namespace facebook::react
