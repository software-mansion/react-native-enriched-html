#pragma once
#import "TextDecorationLineEnum.h"
#import "string"
#import <UIKit/UIKit.h>
#import <folly/dynamic.h>

// holds the mention's background color when it should be drawn with rounded
// corners by the layout manager instead of NSBackgroundColorAttributeName
extern NSString *const MentionRoundedBackgroundAttributeName;

@interface MentionStyleProps : NSObject
@property UIColor *color;
@property UIColor *backgroundColor;
@property TextDecorationLineEnum decorationLine;
@property CGFloat borderRadius;
+ (NSDictionary *)getSinglePropsFromFollyDynamic:(folly::dynamic)folly;
+ (NSDictionary *)getComplexPropsFromFollyDynamic:(folly::dynamic)folly;

// MARK: - Text only props
@property UIColor *pressColor;
@property UIColor *pressBackgroundColor;
@end
