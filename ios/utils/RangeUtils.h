#pragma once
#import "EnrichedPlatform.h"

@interface RangeUtils : NSObject
+ (NSArray *)getSeparateParagraphsRangesIn:(EnrichedBaseTextView *)textView
                                     range:(NSRange)range;
+ (NSArray *)getNonNewlineRangesIn:(EnrichedBaseTextView *)textView
                             range:(NSRange)range;
+ (NSArray *)connectAndDedupeRanges:(NSArray *)ranges;
+ (NSArray *)shiftRanges:(NSArray *)ranges
         withEditedRange:(NSRange)editedRange
          changeInLength:(NSInteger)delta;
@end
