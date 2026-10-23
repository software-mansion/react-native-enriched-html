#import "ColorExtension.h"

static NSDictionary<NSString *, NSString *> *getNamedHexColors(void) {
  static NSDictionary<NSString *, NSString *> *namedColorHexes = nil;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    namedColorHexes = @{
      @"aliceblue" : @"#F0F8FFFF",
      @"antiquewhite" : @"#FAEBD7FF",
      @"aqua" : @"#00FFFFFF",
      @"aquamarine" : @"#7FFFD4FF",
      @"azure" : @"#F0FFFFFF",
      @"beige" : @"#F5F5DCFF",
      @"bisque" : @"#FFE4C4FF",
      @"black" : @"#000000FF",
      @"blanchedalmond" : @"#FFEBCDFF",
      @"blue" : @"#0000FFFF",
      @"blueviolet" : @"#8A2BE2FF",
      @"brown" : @"#A52A2AFF",
      @"burlywood" : @"#DEB887FF",
      @"cadetblue" : @"#5F9EA0FF",
      @"chartreuse" : @"#7FFF00FF",
      @"chocolate" : @"#D2691EFF",
      @"coral" : @"#FF7F50FF",
      @"cornflowerblue" : @"#6495EDFF",
      @"cornsilk" : @"#FFF8DCFF",
      @"crimson" : @"#DC143CFF",
      @"cyan" : @"#00FFFFFF",
      @"darkblue" : @"#00008BFF",
      @"darkcyan" : @"#008B8BFF",
      @"darkgoldenrod" : @"#B8860BFF",
      @"darkgray" : @"#A9A9A9FF",
      @"darkgrey" : @"#A9A9A9FF",
      @"darkgreen" : @"#006400FF",
      @"darkkhaki" : @"#BDB76BFF",
      @"darkmagenta" : @"#8B008BFF",
      @"darkolivegreen" : @"#556B2FFF",
      @"darkorange" : @"#FF8C00FF",
      @"darkorchid" : @"#9932CCFF",
      @"darkred" : @"#8B0000FF",
      @"darksalmon" : @"#E9967AFF",
      @"darkseagreen" : @"#8FBC8FFF",
      @"darkslateblue" : @"#483D8BFF",
      @"darkslategray" : @"#2F4F4FFF",
      @"darkslategrey" : @"#2F4F4FFF",
      @"darkturquoise" : @"#00CED1FF",
      @"darkviolet" : @"#9400D3FF",
      @"deeppink" : @"#FF1493FF",
      @"deepskyblue" : @"#00BFFFFF",
      @"dimgray" : @"#696969FF",
      @"dimgrey" : @"#696969FF",
      @"dodgerblue" : @"#1E90FFFF",
      @"firebrick" : @"#B22222FF",
      @"floralwhite" : @"#FFFAF0FF",
      @"forestgreen" : @"#228B22FF",
      @"fuchsia" : @"#FF00FFFF",
      @"gainsboro" : @"#DCDCDCFF",
      @"ghostwhite" : @"#F8F8FFFF",
      @"gold" : @"#FFD700FF",
      @"goldenrod" : @"#DAA520FF",
      @"gray" : @"#808080FF",
      @"grey" : @"#808080FF",
      @"green" : @"#008000FF",
      @"greenyellow" : @"#ADFF2FFF",
      @"honeydew" : @"#F0FFF0FF",
      @"hotpink" : @"#FF69B4FF",
      @"indianred" : @"#CD5C5CFF",
      @"indigo" : @"#4B0082FF",
      @"ivory" : @"#FFFFF0FF",
      @"khaki" : @"#F0E68CFF",
      @"lavender" : @"#E6E6FAFF",
      @"lavenderblush" : @"#FFF0F5FF",
      @"lawngreen" : @"#7CFC00FF",
      @"lemonchiffon" : @"#FFFACDFF",
      @"lightblue" : @"#ADD8E6FF",
      @"lightcoral" : @"#F08080FF",
      @"lightcyan" : @"#E0FFFFFF",
      @"lightgoldenrodyellow" : @"#FAFAD2FF",
      @"lightgray" : @"#D3D3D3FF",
      @"lightgrey" : @"#D3D3D3FF",
      @"lightgreen" : @"#90EE90FF",
      @"lightpink" : @"#FFB6C1FF",
      @"lightsalmon" : @"#FFA07AFF",
      @"lightseagreen" : @"#20B2AAFF",
      @"lightskyblue" : @"#87CEFAFF",
      @"lightslategray" : @"#778899FF",
      @"lightslategrey" : @"#778899FF",
      @"lightsteelblue" : @"#B0C4DEFF",
      @"lightyellow" : @"#FFFFE0FF",
      @"lime" : @"#00FF00FF",
      @"limegreen" : @"#32CD32FF",
      @"linen" : @"#FAF0E6FF",
      @"magenta" : @"#FF00FFFF",
      @"maroon" : @"#800000FF",
      @"mediumaquamarine" : @"#66CDAAFF",
      @"mediumblue" : @"#0000CDFF",
      @"mediumorchid" : @"#BA55D3FF",
      @"mediumpurple" : @"#9370D8FF",
      @"mediumseagreen" : @"#3CB371FF",
      @"mediumslateblue" : @"#7B68EEFF",
      @"mediumspringgreen" : @"#00FA9AFF",
      @"mediumturquoise" : @"#48D1CCFF",
      @"mediumvioletred" : @"#C71585FF",
      @"midnightblue" : @"#191970FF",
      @"mintcream" : @"#F5FFFAFF",
      @"mistyrose" : @"#FFE4E1FF",
      @"moccasin" : @"#FFE4B5FF",
      @"navajowhite" : @"#FFDEADFF",
      @"navy" : @"#000080FF",
      @"oldlace" : @"#FDF5E6FF",
      @"olive" : @"#808000FF",
      @"olivedrab" : @"#6B8E23FF",
      @"orange" : @"#FFA500FF",
      @"orangered" : @"#FF4500FF",
      @"orchid" : @"#DA70D6FF",
      @"palegoldenrod" : @"#EEE8AAFF",
      @"palegreen" : @"#98FB98FF",
      @"paleturquoise" : @"#AFEEEEFF",
      @"palevioletred" : @"#D87093FF",
      @"papayawhip" : @"#FFEFD5FF",
      @"peachpuff" : @"#FFDAB9FF",
      @"peru" : @"#CD853FFF",
      @"pink" : @"#FFC0CBFF",
      @"plum" : @"#DDA0DDFF",
      @"powderblue" : @"#B0E0E6FF",
      @"purple" : @"#800080FF",
      @"rebeccapurple" : @"#663399FF",
      @"red" : @"#FF0000FF",
      @"rosybrown" : @"#BC8F8FFF",
      @"royalblue" : @"#4169E1FF",
      @"saddlebrown" : @"#8B4513FF",
      @"salmon" : @"#FA8072FF",
      @"sandybrown" : @"#F4A460FF",
      @"seagreen" : @"#2E8B57FF",
      @"seashell" : @"#FFF5EEFF",
      @"sienna" : @"#A0522DFF",
      @"silver" : @"#C0C0C0FF",
      @"skyblue" : @"#87CEEBFF",
      @"slateblue" : @"#6A5ACDFF",
      @"slategray" : @"#708090FF",
      @"slategrey" : @"#708090FF",
      @"snow" : @"#FFFAFAFF",
      @"springgreen" : @"#00FF7FFF",
      @"steelblue" : @"#4682B4FF",
      @"tan" : @"#D2B48CFF",
      @"teal" : @"#008080FF",
      @"thistle" : @"#D8BFD8FF",
      @"tomato" : @"#FF6347FF",
      @"turquoise" : @"#40E0D0FF",
      @"violet" : @"#EE82EEFF",
      @"wheat" : @"#F5DEB3FF",
      @"white" : @"#FFFFFFFF",
      @"whitesmoke" : @"#F5F5F5FF",
      @"yellow" : @"#FFFF00FF",
      @"yellowgreen" : @"#9ACD32FF"
    };
  });
  return namedColorHexes;
}

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
