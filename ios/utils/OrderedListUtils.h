#pragma once
#import "StyleHeaders.h"
#import <UIKit/UIKit.h>

@interface OrderedListUtils : NSObject

+ (NSInteger)digitCountOf:(NSInteger)n;

+ (CGFloat)headIndentForItemCount:(NSInteger)itemCount
                           config:(EnrichedConfig *)config;

+ (NSRange)contiguousOrderedListRangeContaining:(NSRange)range
                                       forStyle:(OrderedListStyle *)style
                                      itemCount:(NSInteger *)outCount;

+ (NSString *)markerFormatWithMargin:(CGFloat)margin;

+ (CGFloat)marginFromMarkerFormat:(NSString *)markerFormat;

@end
