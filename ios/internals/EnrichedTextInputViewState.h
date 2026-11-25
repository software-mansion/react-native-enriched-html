#pragma once
#include <memory>

namespace facebook::react {

class EnrichedTextInputViewState {
public:
  EnrichedTextInputViewState()
      : forceHeightRecalculationCounter_(0), measurementSnapshot_(nullptr) {}
  EnrichedTextInputViewState(int counter, std::shared_ptr<void> snapshot) {
    forceHeightRecalculationCounter_ = counter;
    measurementSnapshot_ = snapshot;
  }
  int getForceHeightRecalculationCounter() const;
  std::shared_ptr<void> getMeasurementSnapshot() const;

private:
  int forceHeightRecalculationCounter_{};
  std::shared_ptr<void> measurementSnapshot_{};
};

} // namespace facebook::react
