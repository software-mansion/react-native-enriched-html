#import "EnrichedTextInputView.h"
#import "interfaces/StyleHeaders.h"
#import "utils/RangeUtils.h"
#import "utils/TextInsertionUtils.h"
#import "utils/TextListsUtils.h"

@implementation CheckboxListStyle

+ (StyleType)getType {
  return CheckboxList;
}

- (NSString *)getValue {
  return @"EnrichedCheckbox0";
}

- (NSString *)getMarkerPrefix {
  return @"EnrichedCheckbox";
}

- (BOOL)isParagraph {
  return YES;
}

- (BOOL)needsZWS {
  return YES;
}

- (CGFloat)calculateMinimumLineHeight:(CGFloat)currentLineHeight {
  CGFloat boxSize = [self.host.config checkboxListBoxSize];
  return MAX(currentLineHeight, boxSize);
}

- (void)applyStyling:(NSRange)range {
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
                pStyle.minimumLineHeight =
                    [self calculateMinimumLineHeight:pStyle.minimumLineHeight];
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
  pStyle.minimumLineHeight =
      [self calculateMinimumLineHeight:pStyle.minimumLineHeight];
  attributes[NSParagraphStyleAttributeName] = pStyle;
}

- (void)toggleWithChecked:(BOOL)checked
                    range:(NSRange)range
     withConflictReplaced:(BOOL)conflictReplaced {
  NSRange actualRange = [self actualUsedRange:range];

  // during the toggle, a conflicting style (a different list)
  // might have been removed. If so, we just add a new value to
  // the textLists. Otherwise we follow the base flow
  if (conflictReplaced) {
    [self add:actualRange
             withValue:checked ? @"EnrichedCheckbox1" : @"EnrichedCheckbox0"
           withNesting:YES
            withTyping:YES
        withDirtyRange:YES];
    return;
  }

  BOOL isPresent = [self detect:actualRange];

  if (isPresent) {
    [self remove:actualRange withDirtyRange:YES];
  } else {
    [self addWithChecked:checked
                   range:actualRange
              withTyping:YES
          withDirtyRange:YES];
  }
}

- (void)addWithChecked:(BOOL)checked
                 range:(NSRange)range
            withTyping:(BOOL)withTyping
        withDirtyRange:(BOOL)withDirtyRange {
  NSString *value = checked ? @"EnrichedCheckbox1" : @"EnrichedCheckbox0";
  [self add:range
           withValue:value
          withTyping:withTyping
      withDirtyRange:withDirtyRange];
}

- (void)reapplyFromStylePair:(StylePair *)pair {
  NSRange range = [pair.rangeValue rangeValue];
  NSParagraphStyle *savedPStyle = (NSParagraphStyle *)pair.styleValue;
  NSString *ownFormat =
      [TextListsUtils deepestListMarkerFormatInArray:savedPStyle.textLists];
  BOOL checked = [ownFormat isEqualToString:@"EnrichedCheckbox1"];
  [self addWithChecked:checked range:range withTyping:NO withDirtyRange:NO];
  // restore nested list metadata
  [self restoreListChainFromStylePair:pair range:range];
}

- (void)toggleCheckedAt:(NSUInteger)location
         withDirtyRange:(BOOL)withDirtyRange {
  if (location >= self.host.textView.textStorage.length) {
    return;
  }

  NSParagraphStyle *pStyle =
      [self.host.textView.textStorage attribute:NSParagraphStyleAttributeName
                                        atIndex:location
                                 effectiveRange:NULL];
  NSString *ownFormat =
      [TextListsUtils deepestListMarkerFormatInArray:pStyle.textLists];
  BOOL isCurrentlyChecked = [ownFormat isEqualToString:@"EnrichedCheckbox1"];

  NSRange paragraphRange = [self.host.textView.textStorage.string
      paragraphRangeForRange:NSMakeRange(location, 0)];

  [self addWithChecked:!isCurrentlyChecked
                 range:paragraphRange
            withTyping:NO
        withDirtyRange:withDirtyRange];
}

- (BOOL)getCheckboxStateAt:(NSUInteger)location {
  if (location >= self.host.textView.textStorage.length) {
    return NO;
  }

  NSParagraphStyle *style =
      [self.host.textView.textStorage attribute:NSParagraphStyleAttributeName
                                        atIndex:location
                                 effectiveRange:NULL];

  NSString *ownFormat =
      [TextListsUtils deepestListMarkerFormatInArray:style.textLists];
  return [ownFormat isEqualToString:@"EnrichedCheckbox1"];
}

- (BOOL)handleNewlinesInRange:(NSRange)range replacementText:(NSString *)text {
  if ([self detect:self.host.textView.selectedRange] && text.length > 0 &&
      [[NSCharacterSet newlineCharacterSet]
          characterIsMember:[text characterAtIndex:text.length - 1]]) {
    // do the replacement manually
    [TextInsertionUtils replaceText:text
                                 at:range
               additionalAttributes:nullptr
                               host:self.host
                      withSelection:YES];
    // apply unchecked checkbox attributes to the new paragraph
    [self addWithChecked:NO
                   range:self.host.textView.selectedRange
              withTyping:YES
          withDirtyRange:YES];
    return YES;
  }
  return NO;
}

@end
