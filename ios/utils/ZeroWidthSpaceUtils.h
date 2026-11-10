#import "interfaces/EnrichedViewHost.h"
#import <UIKit/UIKit.h>
#pragma once

@interface ZeroWidthSpaceUtils : NSObject
+ (void)handleZeroWidthSpacesInHost:(id<EnrichedViewHost>)host;
+ (void)addSpacesIfNeededInHost:(id<EnrichedViewHost>)host
                        inRange:(NSRange)range;
+ (void)applyKernForZeroWidthSpacesInRange:(NSRange)range
                                      host:(id<EnrichedViewHost>)host;
+ (BOOL)handleBackspaceInRange:(NSRange)range
               replacementText:(NSString *)text
                          host:(id<EnrichedViewHost>)host;
+ (NSString *)stringByRemovingZeroWidthSpaces:(NSString *)text;
+ (NSUInteger)visibleIndexFromActualIndex:(NSUInteger)actualIndex
                                   inText:(NSString *)text;
+ (NSRange)visibleRangeFromActualRange:(NSRange)actualRange
                                inText:(NSString *)text;
+ (NSUInteger)actualIndexFromVisibleIndex:(NSInteger)visibleIndex
                                   inText:(NSString *)text;
+ (NSRange)actualRangeFromVisibleStart:(NSInteger)visibleStart
                                   end:(NSInteger)visibleEnd
                                inText:(NSString *)text;
@end
