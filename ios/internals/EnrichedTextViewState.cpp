#include "EnrichedTextViewState.h"

namespace facebook::react {
std::shared_ptr<void> EnrichedTextViewState::getMeasurementSnapshot() const {
  return measurementSnapshot_;
}
int EnrichedTextViewState::getMaximumNumberOfLines() const {
  return maximumNumberOfLines_;
}
int EnrichedTextViewState::getLineBreakMode() const { return lineBreakMode_; }
} // namespace facebook::react
