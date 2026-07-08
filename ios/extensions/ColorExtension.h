#import "EnrichedPlatform.h"
#pragma once

@interface UIColor (ColorExtension)
- (BOOL)isEqualToColor:(UIColor *)otherColor;
- (UIColor *)colorWithResolvedAlpha;
- (UIColor *)colorWithResolvedAlpha:(CGFloat)newAlpha;
@end
