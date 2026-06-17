#import "CustomStyleData.h"
#import "EnrichedTextInputView.h"
#import "RangeUtils.h"
#import "StyleHeaders.h"

static NSString *const CustomStyleAttributeName = @"EnrichedCustomStyle";

@implementation CustomStyle

+ (StyleType)getType {
  return Custom;
}

- (NSString *)getKey {
  return CustomStyleAttributeName;
}

- (BOOL)isParagraph {
  return NO;
}

- (NSInteger)stylePriority {
  return 1;
}

- (BOOL)styleCondition:(id)value range:(NSRange)range {
  if (![value isKindOfClass:[CustomStyleData class]])
    return NO;
  return ![(CustomStyleData *)value isEmpty];
}

- (void)applyStyling:(NSRange)range {
  if (range.length == 0)
    return;

  NSUInteger storageLength = self.host.textView.textStorage.length;
  if (storageLength == 0)
    return;

  NSRange safeRange = NSMakeRange(
      range.location, MIN(range.length, storageLength - range.location));

  // Enumerate each sub-range that carries its own CustomStyleData so that
  // characters with different data values each get the correct visual attrs.
  [self.host.textView.textStorage
      enumerateAttribute:CustomStyleAttributeName
                 inRange:safeRange
                 options:0
              usingBlock:^(id value, NSRange subRange, BOOL *stop) {
                if (![value isKindOfClass:[CustomStyleData class]])
                  return;
                CustomStyleData *data = (CustomStyleData *)value;
                if (data.isEmpty)
                  return;

                NSMutableDictionary *attrs = [NSMutableDictionary dictionary];
                if (data.foregroundColor != nil) {
                  attrs[NSForegroundColorAttributeName] = data.foregroundColor;
                  attrs[NSUnderlineColorAttributeName] = data.foregroundColor;
                  attrs[NSStrikethroughColorAttributeName] =
                      data.foregroundColor;
                }
                if (data.backgroundColor != nil) {
                  attrs[NSBackgroundColorAttributeName] = data.backgroundColor;
                }
                if (attrs.count == 0)
                  return;

                // Skip newline characters so background color doesn't bleed.
                NSArray *nonNewlineRanges =
                    [RangeUtils getNonNewlineRangesIn:self.host.textView
                                                range:subRange];
                for (NSValue *rangeVal in nonNewlineRanges) {
                  [self.host.textView.textStorage
                      addAttributes:attrs
                              range:[rangeVal rangeValue]];
                }
              }];
}

- (void)reapplyFromStylePair:(StylePair *)pair {
  NSRange range = [pair.rangeValue rangeValue];
  CustomStyleData *data = (CustomStyleData *)pair.styleValue;
  if (data == nil || data.isEmpty)
    return;
  [self.host.textView.textStorage addAttribute:CustomStyleAttributeName
                                         value:data
                                         range:range];
}

- (AttributeEntry *)getEntryIfPresent:(NSRange)range {
  CustomStyleData *data = [self getCustomStyleDataAt:range.location];
  if (data == nil || data.isEmpty)
    return nullptr;

  AttributeEntry *entry = [[AttributeEntry alloc] init];
  entry.key = CustomStyleAttributeName;
  entry.value = data;
  return entry;
}

// MARK: - Public non-standard methods

- (void)setCustomStyleData:(CustomStyleData *)data
                     range:(NSRange)range
                withTyping:(BOOL)withTyping
            withDirtyRange:(BOOL)withDirtyRange {
  if (range.length > 0) {
    if (data == nil || data.isEmpty) {
      [self remove:range withDirtyRange:withDirtyRange];
      return;
    }
    [self.host.textView.textStorage addAttribute:CustomStyleAttributeName
                                           value:data
                                           range:range];
    if (withDirtyRange) {
      [self.host.attributesManager addDirtyRange:range];
    }
  }

  if (withTyping) {
    if (data == nil || data.isEmpty) {
      [self removeTyping];
    } else {
      NSMutableDictionary *newTypingAttrs =
          [self.host.textView.typingAttributes mutableCopy];
      newTypingAttrs[CustomStyleAttributeName] = data;
      self.host.textView.typingAttributes = newTypingAttrs;
    }
  }
}

- (CustomStyleData *_Nullable)getCustomStyleDataAt:(NSUInteger)location {
  NSRange selectedRange = self.host.textView.selectedRange;
  if (self.host.textView.isEditable && selectedRange.length == 0 &&
      selectedRange.location == location) {
    id typingValue =
        self.host.textView.typingAttributes[CustomStyleAttributeName];
    if ([typingValue isKindOfClass:[CustomStyleData class]])
      return (CustomStyleData *)typingValue;
    return nil;
  }

  return [self getStoredCustomStyleDataAt:location];
}

// Reads CustomStyleData directly from textStorage, bypassing typingAttributes.
- (CustomStyleData *_Nullable)getStoredCustomStyleDataAt:(NSUInteger)location {
  NSUInteger length = self.host.textView.textStorage.length;
  if (length == 0)
    return nil;
  NSUInteger searchLocation = (location >= length) ? length - 1 : location;
  id value = [self.host.textView.textStorage attribute:CustomStyleAttributeName
                                               atIndex:searchLocation
                                 longestEffectiveRange:nil
                                               inRange:NSMakeRange(0, length)];
  if (![value isKindOfClass:[CustomStyleData class]])
    return nil;
  return (CustomStyleData *)value;
}

- (void)applyStyleFromDict:(NSDictionary *)dict selectedRange:(NSRange)range {
  BOOL withTyping = range.length == 0;

  if (!withTyping) {
    // Enumerate each existing sub-range and merge the partial update into its
    // own data so per-character differences (e.g. fg color on some chars) are
    // preserved when only one field (e.g. bg color) is being changed.
    NSUInteger storageLength = self.host.textView.textStorage.length;
    if (storageLength == 0)
      return;

    NSRange safeRange = NSMakeRange(
        range.location, MIN(range.length, storageLength - range.location));

    [self.host.textView.textStorage
        enumerateAttribute:CustomStyleAttributeName
                   inRange:safeRange
                   options:0
                usingBlock:^(id value, NSRange subRange, BOOL *stop) {
                  CustomStyleData *existing =
                      [value isKindOfClass:[CustomStyleData class]]
                          ? (CustomStyleData *)value
                          : nil;
                  CustomStyleData *merged =
                      existing != nil ? [existing copy]
                                      : [[CustomStyleData alloc] init];
                  [merged mergeFromDict:dict];
                  [self setCustomStyleData:merged
                                     range:subRange
                                withTyping:NO
                            withDirtyRange:YES];
                }];
  } else {
    // Cursor only: merge into current data and update typing attributes.
    CustomStyleData *existing = [self getCustomStyleDataAt:range.location];
    CustomStyleData *merged =
        existing != nil ? [existing copy] : [[CustomStyleData alloc] init];
    [merged mergeFromDict:dict];
    [self setCustomStyleData:merged
                       range:range
                  withTyping:YES
              withDirtyRange:NO];
    [self.host.attributesManager
        didRemoveTypingAttribute:CustomStyleAttributeName];
  }
}

@end
