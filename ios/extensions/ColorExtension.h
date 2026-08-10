#import <UIKit/UIKit.h>
#pragma once

@interface UIColor (ColorExtension)
- (BOOL)isEqualToColor:(UIColor *)otherColor;
- (UIColor *)colorWithResolvedAlpha;
- (UIColor *)colorWithResolvedAlpha:(CGFloat)newAlpha;
- (NSString *)hexString;

+ (UIColor *_Nullable)colorFromCSSString:(NSString *_Nullable)cssString;
@end
