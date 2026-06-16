#import <UIKit/UIKit.h>
#pragma once

@interface UIColor (ColorExtension)
- (BOOL)isEqualToColor:(UIColor *)otherColor;
- (UIColor *)colorWithAlphaIfNotTransparent:(CGFloat)newAlpha;
- (NSString *)rgbaString;
/// Parses a CSS rgba() string, e.g. @"rgba(255, 0, 0, 1.00)". Returns nil if
/// the string is not a valid rgba() value.
+ (UIColor *_Nullable)colorFromRgbaString:(NSString *_Nullable)rgba;
@end
