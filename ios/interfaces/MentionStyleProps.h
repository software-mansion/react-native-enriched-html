#pragma once
#import "TextDecorationLineEnum.h"
#import "string"
#import <UIKit/UIKit.h>
#import <folly/dynamic.h>

// holds the mention's background color, drawn by the layout manager instead of
// NSBackgroundColorAttributeName so the corners can be rounded
extern NSString *const MentionBackgroundAttributeName;

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
