#import "ColorExtension.h"
#import "CSSNamedColors.generated.h"

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

// Default fallback alpha of 0.4 — opaque colors get this applied so the text
// cursor remains visible through the highlight. If the caller already set a
// custom alpha (anything below 1.0), we respect that value instead.
- (UIColor *)colorWithResolvedAlpha {
  return [self colorWithResolvedAlpha:0.4];
}

- (UIColor *)colorWithResolvedAlpha:(CGFloat)newAlpha {
  CGFloat alpha = 0.0;
  [self getRed:nil green:nil blue:nil alpha:&alpha];
  // alpha == 1.0 means the color was never given a custom transparency, so
  // apply newAlpha. Any other value means the caller explicitly chose it —
  // leave it untouched.
  if (alpha >= 1.0) {
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

// Converts a CSS color string (Hex, RGB, RGBA, or Named) into a UIColor.
+ (UIColor *_Nullable)colorFromCSSString:(NSString *_Nullable)cssString {
  if (cssString.length == 0)
    return nil;

  // Trim whitespace and force lowercase for easier matching
  NSString *str =
      [cssString
          stringByTrimmingCharactersInSet:[NSCharacterSet
                                              whitespaceAndNewlineCharacterSet]]
          .lowercaseString;

  // Handle Hex (#FFF, #FFFFFF, #FFFFFFFF)
  if ([str hasPrefix:@"#"]) {
    str = [str substringFromIndex:1];
    NSUInteger len = str.length;

    unsigned int value = 0;
    NSScanner *scanner = [NSScanner scannerWithString:str];
    if (![scanner scanHexInt:&value])
      return nil;

    CGFloat r, g, b, a = 1.0;

    if (len == 3) {
      r = ((value >> 8) & 0xF) / 15.0;
      g = ((value >> 4) & 0xF) / 15.0;
      b = (value & 0xF) / 15.0;
    } else if (len == 4) {
      r = ((value >> 12) & 0xF) / 15.0;
      g = ((value >> 8) & 0xF) / 15.0;
      b = ((value >> 4) & 0xF) / 15.0;
      a = (value & 0xF) / 15.0;
    } else if (len == 6) {
      r = ((value >> 16) & 0xFF) / 255.0;
      g = ((value >> 8) & 0xFF) / 255.0;
      b = (value & 0xFF) / 255.0;
    } else if (len == 8) {
      r = ((value >> 24) & 0xFF) / 255.0;
      g = ((value >> 16) & 0xFF) / 255.0;
      b = ((value >> 8) & 0xFF) / 255.0;
      a = (value & 0xFF) / 255.0;
    } else {
      return nil; // Invalid hex length
    }

    return [UIColor colorWithRed:r green:g blue:b alpha:a];
  }

  // Handle rgb() and rgba()
  if ([str hasPrefix:@"rgb"]) {
    NSScanner *scanner = [NSScanner scannerWithString:str];

    // Scan up to and including the opening parenthesis
    [scanner scanUpToString:@"(" intoString:NULL];
    if (![scanner scanString:@"(" intoString:NULL])
      return nil;

    float r = 0, g = 0, b = 0, a = 1.0;

    // Scan Red, then require a comma
    if (![scanner scanFloat:&r])
      return nil;
    if (![scanner scanString:@"," intoString:NULL])
      return nil;

    // Scan Green, then require a comma
    if (![scanner scanFloat:&g])
      return nil;
    if (![scanner scanString:@"," intoString:NULL])
      return nil;

    // Scan Blue (comma not required yet, might be alpha or closing parenthesis)
    if (![scanner scanFloat:&b])
      return nil;

    // Check if there is a 4th parameter (Alpha)
    if ([scanner scanString:@"," intoString:NULL]) {
      if (![scanner scanFloat:&a])
        return nil;
    }

    // Require the closing parenthesis to guarantee the string wasn't malformed
    // or cut off
    if (![scanner scanString:@")" intoString:NULL])
      return nil;

    return [UIColor colorWithRed:r / 255.0
                           green:g / 255.0
                            blue:b / 255.0
                           alpha:a];
  }

  // Handle Named Colors
  NSString *hexForName = getNamedHexColors()[str];
  if (hexForName) {
    // We found a match! Pass the 8-digit hex string right back into this very
    // method to reuse the Hex parsing logic.
    return [self colorFromCSSString:hexForName];
  }

  return nil;
}

@end
