#import "EnrichedTextInputView.h"
#import "ItalicUtils.h"
#import "StyleHeaders.h"

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

- (void)applyStyling:(NSRange)range {
  [ItalicUtils applyItalicInTextStorage:self.host.textView.textStorage
                                inRange:range];
}

// some styles might apply a new font (inline code), so we need to apply
// the italic last, that way knowing if the used font supports italics
// or we need to apply a slant
- (NSInteger)stylingPriority {
  return 1;
}

@end
