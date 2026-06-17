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

// Returns a CSS hex color string.
// Opaque colors produce 6-digit form (#RRGGBB); semi-transparent produce
// 8-digit form (#RRGGBBAA). Returns @"" if the color cannot be expressed
// in RGB.
- (NSString *)hexString {
  CGFloat red = 0.0;
  CGFloat green = 0.0;
  CGFloat blue = 0.0;
  CGFloat alpha = 0.0;

  if (![self getRed:&red green:&green blue:&blue alpha:&alpha])
    return @"";

  int r = (int)(red * 255.0 + 0.5);
  int g = (int)(green * 255.0 + 0.5);
  int b = (int)(blue * 255.0 + 0.5);
  int a = (int)(alpha * 255.0 + 0.5);

  if (a == 255)
    return [NSString stringWithFormat:@"#%02X%02X%02X", r, g, b];
  return [NSString stringWithFormat:@"#%02X%02X%02X%02X", r, g, b, a];
}

// Parses a CSS hex color string (#RRGGBB or #RRGGBBAA). Returns nil if
// the string is not a valid hex color value.
+ (UIColor *_Nullable)colorFromHexString:(NSString *_Nullable)hex {
  if (hex.length == 0)
    return nil;

  NSString *str = hex;
  if ([str hasPrefix:@"#"])
    str = [str substringFromIndex:1];

  NSUInteger len = str.length;
  if (len != 6 && len != 8)
    return nil;

  unsigned int value = 0;
  NSScanner *scanner = [NSScanner scannerWithString:str];
  if (![scanner scanHexInt:&value])
    return nil;

  CGFloat r, g, b, a;
  if (len == 6) {
    r = ((value >> 16) & 0xFF) / 255.0;
    g = ((value >> 8) & 0xFF) / 255.0;
    b = (value & 0xFF) / 255.0;
    a = 1.0;
  } else {
    r = ((value >> 24) & 0xFF) / 255.0;
    g = ((value >> 16) & 0xFF) / 255.0;
    b = ((value >> 8) & 0xFF) / 255.0;
    a = (value & 0xFF) / 255.0;
  }

  return [UIColor colorWithRed:r green:g blue:b alpha:a];
}

@end
