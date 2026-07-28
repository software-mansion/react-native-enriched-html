#import "EnrichedTextInputView.h"
#import "RangeUtils.h"
#import "StyleHeaders.h"
#import "StyleUtils.h"
#import "TextInsertionUtils.h"

@implementation OrderedListStyle {
  CGFloat _appliedHeadIndent;
}

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

- (CGFloat)applyHeadIndent:(NSInteger)itemCount {
  // the largest marker value equals the item count (numbering starts at 1).
  NSString *widestMarker =
      [NSString stringWithFormat:@"%d.", MAX(itemCount, 1)];
  CGFloat widestMarkerWidth =
      [widestMarker sizeWithAttributes:@{
        NSFontAttributeName : [self.host.config orderedListMarkerFont]
      }]
          .width;

  CGFloat markerColumnWidth =
      MAX([self.host.config orderedListMarginLeft], widestMarkerWidth);
  CGFloat listHeadIndent =
      markerColumnWidth + [self.host.config orderedListGapWidth];

  _appliedHeadIndent = [self.host.config orderedListMarginLeft] +
         [self.host.config orderedListGapWidth];
}

- (void)applyStyling:(NSRange)range {
  // lists are drawn manually

  // if the widest counter ("N.") width overflows the initially given margin,
  // we expand that margin. Every item in the same contiguous list must share
  // the same column width, so we expand to the full ordered list occurrence and
  // re-indent all of it - even when only a single paragraph is dirty (e.g. an
  // item was just added).
  NSInteger itemCount = 0;
  NSRange listRange = [self contiguousOrderedListRangeContaining:range
                                                       itemCount:&itemCount];

  [self.host.textView.textStorage
      enumerateAttribute:NSParagraphStyleAttributeName
                 inRange:listRange
                 options:0
              usingBlock:^(id _Nullable value, NSRange range,
                           BOOL *_Nonnull stop) {
                NSMutableParagraphStyle *pStyle =
                    [(NSParagraphStyle *)value mutableCopy];
                pStyle.headIndent = _appliedHeadIndent;
                pStyle.firstLineHeadIndent = _appliedHeadIndent;
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
  pStyle.headIndent = _appliedHeadIndent;
  pStyle.firstLineHeadIndent = _appliedHeadIndent;
  attributes[NSParagraphStyleAttributeName] = pStyle;
}

// walks paragraphs backward and forward from the given range to find the full
// contiguous run of ordered-list items it belongs to, and counts them.
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

  // seek backward over preceding ordered-list paragraphs, counting items.
  while (firstParagraph.location > 0) {
    NSRange previous = [fullText
        paragraphRangeForRange:NSMakeRange(firstParagraph.location - 1, 0)];
    if (![self detect:NSMakeRange(previous.location, 0)]) {
      break;
    }
    firstParagraph = previous;
    precedingCount += 1;
  }

  // seek forward over following ordered-list paragraphs, counting items.
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
