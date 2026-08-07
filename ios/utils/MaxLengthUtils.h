#pragma once
#import "EnrichedViewHost.h"
#import <UIKit/UIKit.h>

/**
 * Helpers enforcing the `maxLength` prop.
 *
 * The limit is counted in the editor's plain text, so the zero width spaces
 * that are internally used as style anchors don't take up any of it.
 * Text that doesn't fit gets truncated instead of being rejected and the cut
 * point always snaps outwards to a whole composed character, so emoji,
 * surrogate pairs and combining marks never end up split in half.
 */
@interface MaxLengthUtils : NSObject
/// Length of `text` as seen by the user (zero width spaces excluded).
+ (NSInteger)plainLengthOf:(NSString *_Nonnull)text;
/// How many plain characters may still be inserted by a change replacing
/// `range`. Returns `NSIntegerMax` when no limit is set.
+ (NSInteger)capacityForHost:(id<EnrichedViewHost> _Nullable)host
              replacingRange:(NSRange)range;
/// Capacity of a change replacing the whole content of the editor.
+ (NSInteger)wholeContentCapacityForHost:(id<EnrichedViewHost> _Nullable)host;
/// Index `text` has to be cut at so that at most `capacity` plain characters
/// are kept.
+ (NSUInteger)cutIndexIn:(NSString *_Nonnull)text capacity:(NSInteger)capacity;
/// `text` shortened so that it fits in `capacity`.
+ (NSString *_Nonnull)truncate:(NSString *_Nonnull)text
                    toCapacity:(NSInteger)capacity;
@end
