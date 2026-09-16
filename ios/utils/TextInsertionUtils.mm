#import "TextInsertionUtils.h"
#import <React/UIView+React.h>

@implementation TextInsertionUtils
+ (void)insertText:(NSString *)text
                      at:(NSInteger)index
    additionalAttributes:
        (NSDictionary<NSAttributedStringKey, id> *)additionalAttrs
                    host:(id<EnrichedViewHost>)host
           withSelection:(BOOL)withSelection {
  if (host == nullptr) {
    return;
  }

  EnrichedBaseTextView *textView = host.textView;

  NSMutableDictionary<NSAttributedStringKey, id> *copiedAttrs =
      [textView.typingAttributes mutableCopy];
  if (additionalAttrs != nullptr) {
    [copiedAttrs addEntriesFromDictionary:additionalAttrs];
  }

  NSAttributedString *newAttrStr =
      [[NSAttributedString alloc] initWithString:text attributes:copiedAttrs];

#if TARGET_OS_OSX
  NSDictionary<NSAttributedStringKey, id> *preEditTypingAttrs =
      [textView.typingAttributes copy];
#endif

  [textView.textStorage insertAttributedString:newAttrStr atIndex:index];

#if TARGET_OS_OSX
  textView.typingAttributes = preEditTypingAttrs;
#endif

  if (withSelection) {
    if (!textView.enrichedIsFirstResponder) {
      [textView reactFocus];
    }
    [textView enrichedSetSelectedRange:NSMakeRange(index + text.length, 0)];
  }
}

+ (void)replaceText:(NSString *)text
                      at:(NSRange)range
    additionalAttributes:
        (NSDictionary<NSAttributedStringKey, id> *)additionalAttrs
                    host:(id<EnrichedViewHost>)host
           withSelection:(BOOL)withSelection {
  if (host == nullptr) {
    return;
  }

  EnrichedBaseTextView *textView = host.textView;
#if TARGET_OS_OSX
  NSDictionary<NSAttributedStringKey, id> *preEditTypingAttrs =
      [textView.typingAttributes copy];
#endif

  [textView.textStorage replaceCharactersInRange:range withString:text];
  if (additionalAttrs != nullptr) {
    [textView.textStorage
        addAttributes:additionalAttrs
                range:NSMakeRange(range.location, [text length])];
  }

#if TARGET_OS_OSX
  textView.typingAttributes = preEditTypingAttrs;
#endif

  if (withSelection) {
    if (!textView.enrichedIsFirstResponder) {
      [textView reactFocus];
    }
    [textView
        enrichedSetSelectedRange:NSMakeRange(range.location + text.length, 0)];
  }
}
@end
