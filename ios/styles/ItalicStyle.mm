#import "EnrichedTextInputView.h"
#import "FontExtension.h"
#import "StyleHeaders.h"
#import <CoreText/CoreText.h>

// slant used when a font has no italic face
static const CGFloat kObliquenessFallback = 0.2;

typedef NS_ENUM(NSInteger, ItalicKind) {
  // character must not be slanted at all (whitespace, control characters,
  // text attachments)
  ItalicKindNone,
  // font has a real italic glyph for the character
  ItalicKindFont,
  // no italic glyph available, the slant has to be used
  ItalicKindOblique,
};

// contains all characters except whitespaces, newlines,
// control characters and ZWS
static NSCharacterSet *NonNeutralCharacters(void) {
  static NSCharacterSet *nonNeutral = nil;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    NSMutableCharacterSet *set =
        [[NSCharacterSet whitespaceAndNewlineCharacterSet] mutableCopy];
    [set formUnionWithCharacterSet:[NSCharacterSet controlCharacterSet]];
    [set addCharactersInString:[NSString
                                   stringWithFormat:@"%C", (unichar)0x200B]];
    nonNeutral = [[set invertedSet] copy];
  });
  return nonNeutral;
}

// returns YES when the font renders the given UTF-16 sequence itself
static BOOL FontCoversCharacters(UIFont *font, const unichar *chars,
                                 CFIndex count) {
  if (font == nullptr) {
    return NO;
  }
  CGGlyph glyphs[2] = {0, 0};
  return CTFontGetGlyphsForCharacters((__bridge CTFontRef)font, chars, glyphs,
                                      count);
}

@implementation ItalicStyle : StyleBase

+ (StyleType)getType {
  return Italic;
}

- (NSString *)getKey {
  return @"EnrichedItalic";
}

- (BOOL)isParagraph {
  return NO;
}

// some styles might apply a new font (inline code), so we need to apply
// the italic last, that way we know if the used font supports italics
// or we need to apply a slant
- (NSInteger)stylePriority {
  return 3;
}

- (void)applyStyling:(NSRange)range {
  if (self.host.textView.textStorage == nullptr || range.length == 0 ||
      NSMaxRange(range) > self.host.textView.textStorage.length) {
    return;
  }

  // we process each present font
  [self.host.textView.textStorage
      enumerateAttribute:NSFontAttributeName
                 inRange:range
                 options:0
              usingBlock:^(id _Nullable value, NSRange fontRange,
                           BOOL *_Nonnull stop) {
                UIFont *font = (UIFont *)value;
                if (font == nullptr) {
                  return;
                }
                [self applyItalicForFont:font
                           inTextStorage:self.host.textView.textStorage
                                 inRange:fontRange];
              }];
}

- (void)applyItalicForFont:(UIFont *)font
             inTextStorage:(NSTextStorage *)textStorage
                   inRange:(NSRange)range {
  UIFont *italicFont = [font setItalic];
  BOOL hasItalicFace = [italicFont isItalic];

  NSMutableArray<NSValue *> *clusterRanges = [NSMutableArray array];
  NSMutableArray<NSNumber *> *clusterKinds = [NSMutableArray array];

  // we process each composed character sequence and classify it to a specific
  // ItalicKind
  [textStorage.string
      enumerateSubstringsInRange:range
                         options:NSStringEnumerationByComposedCharacterSequences
                      usingBlock:^(NSString *_Nullable cluster,
                                   NSRange clusterRange, NSRange _,
                                   BOOL *_Nonnull stop) {
                        if (cluster.length == 0) {
                          return;
                        }
                        [clusterRanges
                            addObject:[NSValue valueWithRange:clusterRange]];
                        [clusterKinds
                            addObject:@([self kindForCluster:cluster
                                                        font:font
                                                  italicFont:italicFont
                                               hasItalicFace:hasItalicFace])];
                      }];

  // merge neighbouring clusters of the same kind and apply the style
  NSUInteger index = 0;
  while (index < clusterKinds.count) {
    NSUInteger endIndex = index + 1;
    ItalicKind kind = (ItalicKind)[clusterKinds[index] integerValue];
    while (endIndex < clusterKinds.count &&
           (ItalicKind)[clusterKinds[endIndex] integerValue] == kind) {
      endIndex += 1;
    }

    NSRange startRange = [clusterRanges[index] rangeValue];
    NSRange endRange = [clusterRanges[endIndex - 1] rangeValue];
    NSRange segment = NSMakeRange(startRange.location,
                                  NSMaxRange(endRange) - startRange.location);

    [self applyKind:kind
             toSegment:segment
         inTextStorage:textStorage
        withItalicFont:italicFont];

    index = endIndex;
  }
}

- (ItalicKind)kindForCluster:(NSString *)cluster
                        font:(UIFont *)font
                  italicFont:(UIFont *)italicFont
               hasItalicFace:(BOOL)hasItalicFace {
  if ([cluster rangeOfCharacterFromSet:NonNeutralCharacters()].location ==
      NSNotFound) {
    return ItalicKindNone;
  }

  // we just need to analyze the first unicode character to classify the whole
  // cluster
  unichar chars[2] = {0, 0};
  CFIndex count = 1;
  chars[0] = [cluster characterAtIndex:0];
  if (CFStringIsSurrogateHighCharacter(chars[0]) && cluster.length > 1) {
    chars[1] = [cluster characterAtIndex:1];
    count = 2;
  }

  if (chars[0] == (unichar)NSAttachmentCharacter) {
    return ItalicKindNone;
  }

  BOOL coveredByFont = FontCoversCharacters(font, chars, count);

  // italic style is supported - we use it
  if (coveredByFont && hasItalicFace &&
      FontCoversCharacters(italicFont, chars, count)) {
    return ItalicKindFont;
  }

  // italic is not supported, we use the slant instead
  return ItalicKindOblique;
}

- (void)applyKind:(ItalicKind)kind
         toSegment:(NSRange)segment
     inTextStorage:(NSTextStorage *)textStorage
    withItalicFont:(UIFont *)italicFont {
  switch (kind) {
  case ItalicKindFont:
    [textStorage addAttribute:NSFontAttributeName
                        value:italicFont
                        range:segment];
    [textStorage removeAttribute:NSObliquenessAttributeName range:segment];
    break;
  case ItalicKindOblique:
    [textStorage addAttribute:NSObliquenessAttributeName
                        value:@(kObliquenessFallback)
                        range:segment];
    break;
  case ItalicKindNone:
    [textStorage removeAttribute:NSObliquenessAttributeName range:segment];
    break;
  }
}

@end
