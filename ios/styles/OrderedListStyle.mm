#import "EnrichedTextInputView.h"
#import "RangeUtils.h"
#import "StyleHeaders.h"
#import "StyleUtils.h"
#import "TextInsertionUtils.h"

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

  // if the widest counter ("N.") width overflows the initially given margin,
  // we expand that margin. Every item in the same contiguous list must share
  // the same column width, so we expand to the full ordered list occurrence and
  // re-indent all of it - even when only a single paragraph is dirty (e.g. an
  // item was just added)
  NSInteger itemCount = 0;
  NSRange listRange = [self contiguousOrderedListRangeContaining:range
                                                       itemCount:&itemCount];

  [self applyIndentForListRange:listRange itemCount:itemCount];
}

// re-styling is normally run only on dirty-ranges, but a dirty-range
// may change an ordered list structure and those lists need to be
// re-styled. E.g. it happens when we remove an ordered list
// element - it affects the adjacent lists, as their ordinals are different
// and the computed margin might be stale
- (void)recalculateListsAroundEditedRange:(NSRange)range {
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
    NSRange listRange =
        [self contiguousOrderedListRangeContaining:NSMakeRange(seed, 0)
                                         itemCount:&itemCount];
    [handled addObject:[NSValue valueWithRange:listRange]];
    [self applyIndentForListRange:listRange itemCount:itemCount];
  }
}

// computes the shared marker-column indent for a list of the given item
// count. The largest marker value equals the item count (numbering starts
// at 1); if its width overflows the configured margin we expand to fit it
- (CGFloat)headIndentForItemCount:(NSInteger)itemCount {
  NSString *widestMarker =
      [NSString stringWithFormat:@"%d.", (int)MAX(itemCount, 1)];
  CGFloat widestMarkerWidth =
      [widestMarker sizeWithAttributes:@{
        NSFontAttributeName : [self.host.config orderedListMarkerFont]
      }]
          .width;

  CGFloat markerColumnWidth =
      MAX([self.host.config orderedListMarginLeft], widestMarkerWidth);
  return markerColumnWidth + [self.host.config orderedListGapWidth];
}

- (void)applyIndentForListRange:(NSRange)listRange
                      itemCount:(NSInteger)itemCount {
  CGFloat listHeadIndent = [self headIndentForItemCount:itemCount];

  [self.host.textView.textStorage
      enumerateAttribute:NSParagraphStyleAttributeName
                 inRange:listRange
                 options:0
              usingBlock:^(id _Nullable value, NSRange range,
                           BOOL *_Nonnull stop) {
                NSParagraphStyle *existing = (NSParagraphStyle *)value;
                // skip re-styling paragraphs that don't require it
                if (existing != nullptr &&
                    existing.headIndent == listHeadIndent &&
                    existing.firstLineHeadIndent == listHeadIndent) {
                  return;
                }
                NSMutableParagraphStyle *pStyle =
                    existing ? [existing mutableCopy]
                             : [[NSMutableParagraphStyle alloc] init];
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
    CGFloat fallbackIndent = [self headIndentForItemCount:1];
    pStyle.headIndent = fallbackIndent;
    pStyle.firstLineHeadIndent = fallbackIndent;
  }

  attributes[NSParagraphStyleAttributeName] = pStyle;
}

// walks paragraphs backward and forward from the given range to find the full
// contiguous run of ordered-list items it belongs to, and counts them
- (NSRange)contiguousOrderedListRangeContaining:(NSRange)range
                                      itemCount:(NSInteger *)outCount {
  NSString *fullText = self.host.textView.textStorage.string;
  NSUInteger length = fullText.length;
  if (length == 0) {
    if (outCount != nullptr) {
      *outCount = 0;
    }
    return NSMakeRange(range.location, 0);
  }

  NSUInteger seedLocation = MIN(range.location, length - 1);
  NSRange initialParagraph =
      [fullText paragraphRangeForRange:NSMakeRange(seedLocation, 0)];
  NSRange firstParagraph = initialParagraph;

  NSInteger precedingCount = 0;

  // seek backward over preceding ordered-list paragraphs, counting items
  while (firstParagraph.location > 0) {
    NSRange previous = [fullText
        paragraphRangeForRange:NSMakeRange(firstParagraph.location - 1, 0)];
    if (![self detect:NSMakeRange(previous.location, 0)]) {
      break;
    }
    firstParagraph = previous;
    precedingCount += 1;
  }

  // seek forward over following ordered-list paragraphs, counting items
  NSInteger followingCount = 0;
  NSRange lastParagraph = initialParagraph;
  NSRange cursor = initialParagraph;
  while (true) {
    lastParagraph = cursor;
    NSUInteger nextLocation = NSMaxRange(cursor);
    if (nextLocation >= length) {
      break;
    }
    NSRange next =
        [fullText paragraphRangeForRange:NSMakeRange(nextLocation, 0)];
    if (![self detect:NSMakeRange(next.location, 0)]) {
      break;
    }
    cursor = next;
    followingCount += 1;
  }

  if (outCount != nullptr) {
    *outCount = precedingCount + followingCount + 1;
  }
  return NSMakeRange(firstParagraph.location,
                     NSMaxRange(lastParagraph) - firstParagraph.location);
}

@end
