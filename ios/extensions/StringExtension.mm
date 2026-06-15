#import "StringExtension.h"

@implementation NSString (StringExtension)

- (std::string)toCppString {
  return std::string([self UTF8String]);
}

+ (NSString *)fromCppString:(std::string)string {
  return [NSString stringWithUTF8String:string.c_str()];
}

+ (NSString *)stringByEscapingHtml:(NSString *)html {
  NSMutableString *escaped = [html mutableCopy];
  NSDictionary *escapeMap = @{
    @"&" : @"&amp;",
    @"<" : @"&lt;",
    @">" : @"&gt;",
  };

  for (NSString *key in escapeMap) {
    [escaped replaceOccurrencesOfString:key
                             withString:escapeMap[key]
                                options:NSLiteralSearch
                                  range:NSMakeRange(0, escaped.length)];
  }
  return escaped;
}

+ (NSDictionary *)getEscapedCharactersInfoFrom:(NSString *)text {
  NSDictionary *unescapeMap = @{
    @"&amp;" : @"&",
    @"&lt;" : @"<",
    @"&gt;" : @">",
  };

  NSMutableDictionary *results = [[NSMutableDictionary alloc] init];

  for (NSString *key in unescapeMap) {
    NSRange searchRange = NSMakeRange(0, text.length);
    NSRange foundRange;

    while (searchRange.location < text.length) {
      foundRange = [text rangeOfString:key options:0 range:searchRange];
      if (foundRange.location == NSNotFound) {
        break;
      }
      results[@(foundRange.location)] = @[ key, unescapeMap[key] ];
      searchRange.location = foundRange.location + foundRange.length;
      searchRange.length = text.length - searchRange.location;
    }
  }

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

                      // Safety check: Valid Unicode scalar values are 0x1..0x10FFFF,
                      // excluding surrogate code points (0xD800-0xDFFF). Replace invalid
                      // values with U+FFFD (Replacement Character) to avoid crashes/truncation.
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
