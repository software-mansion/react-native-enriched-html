#pragma once
#include <memory>

namespace facebook::react {

class EnrichedTextViewState {
public:
  EnrichedTextViewState() : measurementSnapshot_(nullptr) {}
  EnrichedTextViewState(std::shared_ptr<void> snapshot,
                        int maximumNumberOfLines, int lineBreakMode) {
    measurementSnapshot_ = snapshot;
    maximumNumberOfLines_ = maximumNumberOfLines;
    lineBreakMode_ = lineBreakMode;
  }
  std::shared_ptr<void> getMeasurementSnapshot() const;
  int getMaximumNumberOfLines() const;
  int getLineBreakMode() const;

private:
  std::shared_ptr<void> measurementSnapshot_{};
  int maximumNumberOfLines_{0};
  int lineBreakMode_{0};
};

} // namespace facebook::react
