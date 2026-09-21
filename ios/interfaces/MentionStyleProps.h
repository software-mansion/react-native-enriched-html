#pragma once
#import "TextDecorationLineEnum.h"
#import "platform/EnrichedPlatform.h"
#import "string"
#import <folly/dynamic.h>

@interface MentionStyleProps : NSObject
@property UIColor *color;
@property UIColor *backgroundColor;
@property TextDecorationLineEnum decorationLine;
+ (NSDictionary *)getSinglePropsFromFollyDynamic:(folly::dynamic)folly;
+ (NSDictionary *)getComplexPropsFromFollyDynamic:(folly::dynamic)folly;

// MARK: - Text only props
@property UIColor *pressColor;
@property UIColor *pressBackgroundColor;
@end
