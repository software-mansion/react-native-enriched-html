#import "ColorExtension.h"

@implementation UIColor (ColorExtension)
- (BOOL)isEqualToColor:(UIColor *)otherColor {
  CGColorSpaceRef colorSpaceRGB = CGColorSpaceCreateDeviceRGB();

  UIColor * (^convertColorToRGBSpace)(UIColor *) = ^(UIColor *color) {
    if (CGColorSpaceGetModel(CGColorGetColorSpace(color.CGColor)) ==
        kCGColorSpaceModelMonochrome) {
      const CGFloat *oldComponents = CGColorGetComponents(color.CGColor);
      CGFloat components[4] = {oldComponents[0], oldComponents[0],
                               oldComponents[0], oldComponents[1]};
      CGColorRef colorRef = CGColorCreate(colorSpaceRGB, components);

      UIColor *color = [UIColor colorWithCGColor:colorRef];
      CGColorRelease(colorRef);
      return color;
    } else {
      return color;
    }
  };

  UIColor *selfColor = convertColorToRGBSpace(self);
  otherColor = convertColorToRGBSpace(otherColor);
  CGColorSpaceRelease(colorSpaceRGB);

  return [selfColor isEqual:otherColor];
}

- (UIColor *)colorWithAlphaIfNotTransparent:(CGFloat)newAlpha {
  CGFloat alpha = 0.0;
  [self getRed:nil green:nil blue:nil alpha:&alpha];
  if (alpha > 0.0) {
    return [self colorWithAlphaComponent:newAlpha];
  }
  return self;
}

- (NSString *)rgbaString {
  CGFloat red = 0.0;
  CGFloat green = 0.0;
  CGFloat blue = 0.0;
  CGFloat alpha = 0.0;

  // getRed:green:blue:alpha: returns YES if the color can be converted to RGB.
  // It natively handles monochrome/grayscale colors as well.
  if ([self getRed:&red green:&green blue:&blue alpha:&alpha]) {
    // Convert 0.0-1.0 floats to 0-255 integers for RGB
    int r = (int)(red * 255.0 + 0.5);
    int g = (int)(green * 255.0 + 0.5);
    int b = (int)(blue * 255.0 + 0.5);

    return
        [NSString stringWithFormat:@"rgba(%d, %d, %d, %.2f)", r, g, b, alpha];
  }

  // Fallback for unsupported color
  return @"";
}

+ (UIColor *_Nullable)colorFromRgbaString:(NSString *_Nullable)rgba {
  if (rgba.length == 0)
    return nil;

  static NSRegularExpression *regex;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    regex = [NSRegularExpression
        regularExpressionWithPattern:
            @"rgba\\(\\s*(\\d+)\\s*,\\s*(\\d+)\\s*,\\s*(\\d+)\\s*,"
            @"\\s*([\\d.]+)\\s*\\)"
                             options:NSRegularExpressionCaseInsensitive
                               error:nil];
  });

  NSTextCheckingResult *match =
      [regex firstMatchInString:rgba
                        options:0
                          range:NSMakeRange(0, rgba.length)];
  if (!match || match.numberOfRanges < 5)
    return nil;

  CGFloat r =
      [[rgba substringWithRange:[match rangeAtIndex:1]] integerValue] / 255.0;
  CGFloat g =
      [[rgba substringWithRange:[match rangeAtIndex:2]] integerValue] / 255.0;
  CGFloat b =
      [[rgba substringWithRange:[match rangeAtIndex:3]] integerValue] / 255.0;
  CGFloat a = [[rgba substringWithRange:[match rangeAtIndex:4]] doubleValue];

  return [UIColor colorWithRed:r green:g blue:b alpha:a];
}

@end
