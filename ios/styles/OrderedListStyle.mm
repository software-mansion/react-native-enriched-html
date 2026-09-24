#import "EnrichedTextInputView.h"
#import "OrderedListUtils.h"
#import "RangeUtils.h"
#import "StyleHeaders.h"
#import "StyleUtils.h"
#import "TextInsertionUtils.h"
#import "TextListsUtils.h"

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

- (NSString *)getMarkerPrefix {
  return @"EnrichedOrderedList";
}

- (BOOL)styleCondition:(id)value range:(NSRange)range {
  NSParagraphStyle *pStyle = (NSParagraphStyle *)value;
  if (pStyle == nil)
    return NO;
  return [TextListsUtils textLists:pStyle.textLists
                    containsPrefix:[self getMarkerPrefix]];
}

- (void)applyStyling:(NSRange)range {
  // lists are drawn manually

  // the margin is precomputed by recalculateListsAroundEditedRange: and
  // stored in the "EnrichedOrderedList:<margin>" marker, so here we just
  // read it back and apply it
  [self.host.textView.textStorage
      enumerateAttribute:NSParagraphStyleAttributeName
                 inRange:range
                 options:0
              usingBlock:^(id _Nullable value, NSRange range,
                           BOOL *_Nonnull stop) {
                NSParagraphStyle *existing = (NSParagraphStyle *)value;
                NSTextList *marker = [TextListsUtils
                    firstTextListWithPrefix:[self getMarkerPrefix]
                                    inArray:existing.textLists];
                if (marker == nullptr) {
                  return;
                }
                CGFloat listHeadIndent = [OrderedListUtils
                    marginFromMarkerFormat:marker.markerFormat];

                // skip re-styling paragraphs that don't require it
                if (existing.headIndent == listHeadIndent &&
                    existing.firstLineHeadIndent == listHeadIndent) {
                  return;
                }
                NSMutableParagraphStyle *pStyle = [existing mutableCopy];
                pStyle.headIndent = listHeadIndent;
                pStyle.firstLineHeadIndent = listHeadIndent;
                [self.host.textView.textStorage
                    addAttribute:NSParagraphStyleAttributeName
                           value:pStyle
                           range:range];
              }];
}

// re-styling is normally run only on dirty-ranges, but a dirty-range
// may change an ordered list structure and those lists' margins need to be
// re-computed. E.g. it happens when we remove an ordered list
// element - it affects the adjacent lists, as their ordinals are different
// and the computed margin might be stale
- (NSArray<NSValue *> *)recalculateListsAroundEditedRange:(NSRange)range {
  NSUInteger length = self.host.textView.textStorage.string.length;
  NSUInteger start = range.location;
  NSUInteger end = NSMaxRange(range);

  // look for ordered lists in adjacent locations
  NSMutableArray<NSNumber *> *seeds = [NSMutableArray array];
  if (start > 0) {
    [seeds addObject:@(start - 1)];
  }
  [seeds addObject:@(start)];
  [seeds addObject:@(end)];

  // dedupe so each surviving contiguous list is recomputed at most once
  NSMutableArray<NSValue *> *handled = [NSMutableArray array];

  for (NSNumber *seedNum in seeds) {
    NSUInteger seed = seedNum.unsignedIntegerValue;
    if (seed >= length) {
      continue;
    }
    if (![self detect:NSMakeRange(seed, 0)]) {
      continue;
    }

    BOOL alreadyHandled = NO;
    for (NSValue *handledRange in handled) {
      if (NSLocationInRange(seed, [handledRange rangeValue])) {
        alreadyHandled = YES;
        break;
      }
    }
    if (alreadyHandled) {
      continue;
    }

    NSInteger itemCount = 0;
    NSRange listRange = [OrderedListUtils
        contiguousOrderedListRangeContaining:NSMakeRange(seed, 0)
                                    forStyle:self
                                   itemCount:&itemCount];
    [handled addObject:[NSValue valueWithRange:listRange]];
    [self updateMarginMarkerForListRange:listRange itemCount:itemCount];
  }

  return handled;
}

- (void)updateMarginMarkerForListRange:(NSRange)listRange
                             itemCount:(NSInteger)itemCount {
  CGFloat margin = [OrderedListUtils headIndentForItemCount:itemCount
                                                     config:self.host.config];
  NSString *markerFormat = [OrderedListUtils markerFormatWithMargin:margin];

  [self.host.textView.textStorage
      enumerateAttribute:NSParagraphStyleAttributeName
                 inRange:listRange
                 options:0
              usingBlock:^(id _Nullable value, NSRange range,
                           BOOL *_Nonnull stop) {
                NSParagraphStyle *existing = (NSParagraphStyle *)value;

                // skip re-styling paragraphs that don't require it
                NSTextList *existingMarker = [TextListsUtils
                    firstTextListWithPrefix:[self getMarkerPrefix]
                                    inArray:existing.textLists];
                if ([existingMarker.markerFormat
                        isEqualToString:markerFormat]) {
                  return;
                }

                NSMutableParagraphStyle *pStyle =
                    existing ? [existing mutableCopy]
                             : [[NSMutableParagraphStyle alloc] init];
                pStyle.textLists =
                    [TextListsUtils textListsByAdding:markerFormat
                                  withExclusivePrefix:[self getMarkerPrefix]
                                              toArray:pStyle.textLists];
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

  NSUInteger location = self.host.textView.selectedRange.location;
  NSUInteger length = self.host.textView.textStorage.length;

  NSParagraphStyle *existingStyle = nil;
  if (length > 0) {
    // applying styling to typing attributes always happen after applying
    // the styles, so we can lookup the existing style for the indent
    NSUInteger lookupLocation = MIN(location, length - 1);
    existingStyle =
        [self.host.textView.textStorage attribute:NSParagraphStyleAttributeName
                                          atIndex:lookupLocation
                                   effectiveRange:NULL];
  }

  if (existingStyle) {
    pStyle.headIndent = existingStyle.headIndent;
    pStyle.firstLineHeadIndent = existingStyle.firstLineHeadIndent;
  } else {
    CGFloat fallbackIndent =
        [OrderedListUtils headIndentForItemCount:1 config:self.host.config];
    pStyle.headIndent = fallbackIndent;
    pStyle.firstLineHeadIndent = fallbackIndent;
  }

  attributes[NSParagraphStyleAttributeName] = pStyle;
}

@end
