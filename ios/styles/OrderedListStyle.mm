#import "EnrichedTextInputView.h"
#import "interfaces/StyleHeaders.h"
#import "utils/RangeUtils.h"
#import "utils/StyleUtils.h"
#import "utils/TextInsertionUtils.h"
#import "utils/TextListsUtils.h"

@implementation OrderedListStyle

+ (StyleType)getType {
  return OrderedList;
}

- (NSString *)getValue {
  return @"EnrichedOrderedList";
}

- (BOOL)isParagraph {
  return YES;
}

- (BOOL)needsZWS {
  return YES;
}

- (void)applyStyling:(NSRange)range {
  // lists are drawn manually
  [self.host.textView.textStorage
      enumerateAttribute:NSParagraphStyleAttributeName
                 inRange:range
                 options:0
              usingBlock:^(id _Nullable value, NSRange range,
                           BOOL *_Nonnull stop) {
                NSMutableParagraphStyle *pStyle =
                    [(NSParagraphStyle *)value mutableCopy];
                NSArray<NSTextList *> *chain =
                    [TextListsUtils listChainInArray:pStyle.textLists];
                CGFloat listHeadIndent =
                    [self cumulativeHeadIndentForChain:chain];
                pStyle.headIndent = listHeadIndent;
                pStyle.firstLineHeadIndent = listHeadIndent;
                [self.host.textView.textStorage
                    addAttribute:NSParagraphStyleAttributeName
                           value:pStyle
                           range:range];
              }];
}

- (BOOL)appliesStylingToTyping {
  return YES;
}

- (void)applyStylingToTypingAttrs:(NSMutableDictionary *)attributes {
  NSMutableParagraphStyle *pStyle =
      [attributes[NSParagraphStyleAttributeName] mutableCopy];
  if (pStyle == nil)
    return;
  NSArray<NSTextList *> *chain =
      [TextListsUtils listChainInArray:pStyle.textLists];
  CGFloat indent = [self cumulativeHeadIndentForChain:chain];
  pStyle.headIndent = indent;
  pStyle.firstLineHeadIndent = indent;
  attributes[NSParagraphStyleAttributeName] = pStyle;
}

@end
