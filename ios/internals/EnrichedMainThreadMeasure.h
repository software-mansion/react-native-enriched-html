#pragma once
#import <CoreGraphics/CoreGraphics.h>
#import <Foundation/Foundation.h>
#include <atomic>

namespace facebook::react {

// How long a layout thread may wait for the main thread (in seconds) to measure
// a component that isn't mounted yet. Past that, we assume main is blocked
// waiting for us.
constexpr double kEnrichedMainThreadMeasureTimeout = 0.1;

/*
 * Runs `measureBlock` on the main thread and waits for its result, but no
 * longer than kEnrichedMainThreadMeasureTimeout - it's designed this way to
 * prevent main thread deadlocks.
 *
 * Returns false if the main thread didn't respond in time. The block still
 * runs later in that case, so it must not capture the shadow node (`this`).
 * While such a timed-out block is pending, calls fail instead of waiting
 * again.
 */
inline bool enrichedMeasureOnMainThread(CGSize (^measureBlock)(void),
                                        CGSize &outSize) {
  static std::atomic<int> pendingBlocks{0};
  if (pendingBlocks.load() > 0) {
    return false;
  }

  __block CGSize result = CGSizeZero;
  dispatch_semaphore_t done = dispatch_semaphore_create(0);
  pendingBlocks++;
  dispatch_async(dispatch_get_main_queue(), ^{
    result = measureBlock();
    pendingBlocks--;
    dispatch_semaphore_signal(done);
  });

  const dispatch_time_t deadline = dispatch_time(
      DISPATCH_TIME_NOW,
      (int64_t)(kEnrichedMainThreadMeasureTimeout * NSEC_PER_SEC));
  if (dispatch_semaphore_wait(done, deadline) != 0) {
    return false;
  }
  outSize = result;
  return true;
}

} // namespace facebook::react
