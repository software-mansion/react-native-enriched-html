#include "EnrichedTextInputViewState.h"

namespace facebook::react {
int EnrichedTextInputViewState::getForceHeightRecalculationCounter() const {
  return forceHeightRecalculationCounter_;
}
std::shared_ptr<void>
EnrichedTextInputViewState::getMeasurementSnapshot() const {
  return measurementSnapshot_;
}
} // namespace facebook::react
