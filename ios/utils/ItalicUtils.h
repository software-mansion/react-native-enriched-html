#import <UIKit/UIKit.h>
#pragma once

typedef NS_ENUM(NSInteger, ItalicKind) {
  // character must not be slanted at all (whitespace, control characters,
  // text attachments)
  ItalicKindNone,
  // font has a real italic glyph for the character
  ItalicKindFont,
  // no italic glyph available, the slant has to be used
  ItalicKindOblique,
};

// slant used when a font has no italic face
extern const CGFloat kObliquenessFallback;

@interface ItalicUtils : NSObject

+ (void)applyItalicForFont:(UIFont *)font
             inTextStorage:(NSTextStorage *)textStorage
                   inRange:(NSRange)range;

@end
