#import "StringExtension.h"

@implementation NSString (StringExtension)

- (std::string)toCppString {
  return std::string([self UTF8String]);
}

+ (NSString *)fromCppString:(std::string)string {
  return [NSString stringWithUTF8String:string.c_str()];
}

+ (NSString *)stringByEscapingHtml:(NSString *)html {
  // Escape character by character so that the output of one replacement is
  // never escaped again (e.g. U+00A0 -> "&nbsp;" must not become
  // "&amp;nbsp;").
  NSMutableString *escaped =
      [[NSMutableString alloc] initWithCapacity:html.length];
  for (NSUInteger i = 0; i < html.length; i++) {
    unichar c = [html characterAtIndex:i];
    switch (c) {
    case '&':
      [escaped appendString:@"&amp;"];
      break;
    case '<':
      [escaped appendString:@"&lt;"];
      break;
    case '>':
      [escaped appendString:@"&gt;"];
      break;
    case 0x00A0:
      // Non-breaking space is emitted as an entity so it stays visible in the
      // HTML and survives whitespace trimming.
      [escaped appendString:@"&nbsp;"];
      break;
    default:
      [escaped appendFormat:@"%C", c];
      break;
    }
  }
  return escaped;
}

// Named character references decoded by the parser. This is not the full
// HTML5 table (2000+ entries); it covers the XML predefined entities and the
// common HTML ones that editors and CMSs emit in practice. Unknown names are
// left as literal text.
static NSDictionary<NSString *, NSString *> *namedHtmlEntities(void) {
  static NSDictionary<NSString *, NSString *> *entities;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    entities = @{
      @"amp" : @"&",
      @"lt" : @"<",
      @"gt" : @">",
      @"quot" : @"\"",
      @"apos" : @"'",
      @"nbsp" : @"\u00A0",
      @"ensp" : @"\u2002",
      @"emsp" : @"\u2003",
      @"thinsp" : @"\u2009",
      @"zwnj" : @"\u200C",
      @"zwj" : @"\u200D",
      @"shy" : @"\u00AD",
      @"ndash" : @"\u2013",
      @"mdash" : @"\u2014",
      @"lsquo" : @"\u2018",
      @"rsquo" : @"\u2019",
      @"sbquo" : @"\u201A",
      @"ldquo" : @"\u201C",
      @"rdquo" : @"\u201D",
      @"bdquo" : @"\u201E",
      @"laquo" : @"\u00AB",
      @"raquo" : @"\u00BB",
      @"hellip" : @"\u2026",
      @"bull" : @"\u2022",
      @"middot" : @"\u00B7",
      @"iexcl" : @"\u00A1",
      @"iquest" : @"\u00BF",
      @"copy" : @"\u00A9",
      @"reg" : @"\u00AE",
      @"trade" : @"\u2122",
      @"sect" : @"\u00A7",
      @"para" : @"\u00B6",
      @"deg" : @"\u00B0",
      @"plusmn" : @"\u00B1",
      @"times" : @"\u00D7",
      @"divide" : @"\u00F7",
      @"euro" : @"\u20AC",
      @"cent" : @"\u00A2",
      @"pound" : @"\u00A3",
      @"yen" : @"\u00A5",
    };
  });
  return entities;
}

+ (NSDictionary *)getEscapedCharactersInfoFrom:(NSString *)text {
  NSMutableDictionary *results = [[NSMutableDictionary alloc] init];

  // Named character references: &name;
  NSDictionary<NSString *, NSString *> *entities = namedHtmlEntities();
  NSRegularExpression *namedEntityRegex =
      [NSRegularExpression regularExpressionWithPattern:@"&([a-zA-Z0-9]+);"
                                                options:0
                                                  error:nil];

  [namedEntityRegex
      enumerateMatchesInString:text
                       options:0
                         range:NSMakeRange(0, text.length)
                    usingBlock:^(NSTextCheckingResult *match,
                                 NSMatchingFlags flags, BOOL *stop) {
                      if (match == nil) {
                        return;
                      }
                      NSString *name =
                          [text substringWithRange:[match rangeAtIndex:1]];
                      NSString *decoded = entities[name];
                      if (decoded == nil) {
                        return;
                      }
                      NSRange fullRange = [match range];
                      results[@(fullRange.location)] =
                          @[ [text substringWithRange:fullRange], decoded ];
                    }];

  // Numeric character references: &#NNNN; (decimal) and &#xHHHH; (hex)
  NSRegularExpression *numericEntityRegex = [NSRegularExpression
      regularExpressionWithPattern:@"&#([xX][0-9a-fA-F]+|[0-9]+);"
                           options:0
                             error:nil];

  [numericEntityRegex
      enumerateMatchesInString:text
                       options:0
                         range:NSMakeRange(0, text.length)
                    usingBlock:^(NSTextCheckingResult *match,
                                 NSMatchingFlags flags, BOOL *stop) {
                      if (match == nil) {
                        return;
                      }
                      NSRange fullRange = [match range];
                      NSString *entityStr = [text substringWithRange:fullRange];
                      NSString *valueStr =
                          [text substringWithRange:[match rangeAtIndex:1]];

                      // Convert the matched string into a raw integer (UTF32
                      // Code Point)
                      UTF32Char codePoint = 0;
                      if ([valueStr hasPrefix:@"x"] ||
                          [valueStr hasPrefix:@"X"]) {
                        // Parse Hexadecimal (base 16)
                        const char *hexStr =
                            [[valueStr substringFromIndex:1] UTF8String];
                        codePoint = (UTF32Char)strtoul(hexStr, NULL, 16);
                      } else {
                        // Parse Decimal (base 10)
                        const char *decStr = [valueStr UTF8String];
                        codePoint = (UTF32Char)strtoul(decStr, NULL, 10);
                      }

                      // Safety check: HTML numeric character references should
                      // map to valid Unicode scalar values (0x0..0x10FFFF),
                      // excluding surrogate code points (0xD800-0xDFFF). Per
                      // HTML5, code point 0 is treated as U+FFFD. Replace
                      // invalid values with U+FFFD (Replacement Character) to
                      // avoid crashes/truncation.
                      if (codePoint == 0 || codePoint > 0x10FFFF ||
                          (codePoint >= 0xD800 && codePoint <= 0xDFFF)) {
                        codePoint = 0xFFFD;
                      }

                      NSString *decoded;
                      if (codePoint <= 0xFFFF) {
                        // STANDARD CHARACTER: Fits perfectly in one 16-bit
                        // unichar.
                        unichar ch = (unichar)codePoint;
                        decoded = [NSString stringWithCharacters:&ch length:1];
                      } else {
                        // LARGE CHARACTER: Too big for 16 bits.
                        // We must split the code point into two 16-bit halves
                        // (a "Surrogate Pair") so NSString can store it
                        // properly in UTF-16.
                        UniChar surrogate[2];

                        // Calculate the "High" surrogate half
                        surrogate[0] =
                            (UniChar)(0xD800 + ((codePoint - 0x10000) >> 10));

                        // Calculate the "Low" surrogate half
                        surrogate[1] =
                            (UniChar)(0xDC00 + ((codePoint - 0x10000) & 0x3FF));

                        // Create the string using both 16-bit pieces
                        decoded = [NSString stringWithCharacters:surrogate
                                                          length:2];
                      }

                      results[@(fullRange.location)] = @[ entityStr, decoded ];
                    }];

  return results;
}

@end

@implementation NSMutableString (StringExtension)

- (std::string)toCppString {
  return std::string([self UTF8String]);
}

+ (NSMutableString *)fromCppString:(std::string)string {
  return [NSMutableString stringWithUTF8String:string.c_str()];
}

@end
