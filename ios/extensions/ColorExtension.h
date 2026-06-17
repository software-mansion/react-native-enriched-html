#import <UIKit/UIKit.h>
#pragma once

@interface UIColor (ColorExtension)
- (BOOL)isEqualToColor:(UIColor *)otherColor;
- (UIColor *)colorWithAlphaIfNotTransparent:(CGFloat)newAlpha;
- (NSString *)hexString;
+ (UIColor *_Nullable)colorFromHexString:(NSString *_Nullable)hex;
@end
