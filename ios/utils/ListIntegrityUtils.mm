#import "ListIntegrityUtils.h"
#import "EnrichedTextInputView.h"
#import "TextListsUtils.h"

@implementation ListIntegrityUtils

+ (void)validateListsInDirtyRanges:(EnrichedTextInputView *)input {
  NSString *string = input->textView.textStorage.string;
  // ranges of list compounds that were already validated, so that
  // other dirty ranges within the same compound are skipped
  NSMutableIndexSet *validatedIndexes = [NSMutableIndexSet indexSet];

  NSArray *dirtyRanges = [[input->attributesManager getDirtyRanges] copy];
  for (NSValue *rangeValue in dirtyRanges) {
    NSRange dirtyRange = [rangeValue rangeValue];
    if (NSMaxRange(dirtyRange) > string.length) {
      continue;
    }

    NSRange paragraphsRange = [string paragraphRangeForRange:dirtyRange];
    // the paragraph right after the edit got a new predecessor, so it has to be
    // checked as well
    if (NSMaxRange(paragraphsRange) < string.length) {
      paragraphsRange = NSUnionRange(
          paragraphsRange,
          [string paragraphRangeForRange:NSMakeRange(
                                             NSMaxRange(paragraphsRange), 0)]);
    }

    NSUInteger position = paragraphsRange.location;
    while (position < NSMaxRange(paragraphsRange)) {
      NSRange paragraphRange =
          [string paragraphRangeForRange:NSMakeRange(position, 0)];
      position = NSMaxRange(paragraphRange);

      if ([validatedIndexes containsIndex:paragraphRange.location] ||
          ![self isListParagraph:paragraphRange input:input]) {
        continue;
      }

      NSRange compoundRange = [self listCompoundRangeAround:paragraphRange
                                                      input:input];
      [self validateListCompound:compoundRange input:input];
      [validatedIndexes addIndexesInRange:compoundRange];
    }
  }
}

// Expands the paragraph to the contiguous run of list paragraphs around it.
+ (NSRange)listCompoundRangeAround:(NSRange)paragraphRange
                             input:(EnrichedTextInputView *)input {
  NSString *string = input->textView.textStorage.string;
  NSRange compoundRange = paragraphRange;

  while (compoundRange.location > 0) {
    NSRange prevRange = [string
        paragraphRangeForRange:NSMakeRange(compoundRange.location - 1, 0)];
    if (![self isListParagraph:prevRange input:input]) {
      break;
    }
    compoundRange = NSUnionRange(compoundRange, prevRange);
  }

  while (NSMaxRange(compoundRange) < string.length) {
    NSRange nextRange = [string
        paragraphRangeForRange:NSMakeRange(NSMaxRange(compoundRange), 0)];
    if (![self isListParagraph:nextRange input:input]) {
      break;
    }
    compoundRange = NSUnionRange(compoundRange, nextRange);
  }

  return compoundRange;
}

+ (void)validateListCompound:(NSRange)compoundRange
                       input:(EnrichedTextInputView *)input {
  NSTextStorage *textStorage = input->textView.textStorage;
  NSString *string = textStorage.string;
  NSRange cursorParagraphRange = [string
      paragraphRangeForRange:NSMakeRange(input->textView.selectedRange.location,
                                         0)];

  // chains of the preceding paragraphs that can still be parents of the
  // following ones, along with their original depths
  NSMutableArray<NSNumber *> *depthsStack = [NSMutableArray array];
  NSMutableArray<NSArray<NSTextList *> *> *chainsStack = [NSMutableArray array];

  NSUInteger position = compoundRange.location;
  while (position < NSMaxRange(compoundRange)) {
    NSRange paragraphRange =
        [string paragraphRangeForRange:NSMakeRange(position, 0)];
    position = NSMaxRange(paragraphRange);

    NSParagraphStyle *pStyle =
        [textStorage attribute:NSParagraphStyleAttributeName
                       atIndex:paragraphRange.location
                effectiveRange:NULL];
    NSArray<NSTextList *> *chain =
        [TextListsUtils listChainInArray:pStyle.textLists];
    NSUInteger depth = chain.count;

    // pop from both stacks if didn't move deeper into nesting
    while (depthsStack.count > 0 &&
           depthsStack.lastObject.unsignedIntegerValue >= depth) {
      [depthsStack removeLastObject];
      [chainsStack removeLastObject];
    }
    NSArray<NSTextList *> *parentChain = chainsStack.lastObject ?: @[];

    if (![self chain:chain hasParentChain:parentChain]) {
      // rebuild the list chain using the parent chain
      NSMutableArray<NSTextList *> *newChain = [NSMutableArray array];
      for (NSTextList *ancestor in parentChain) {
        [newChain addObject:[[NSTextList alloc]
                                initWithMarkerFormat:ancestor.markerFormat
                                             options:0]];
      }
      [newChain addObject:chain.lastObject];

      // add the updated paragraph style attribute
      NSMutableParagraphStyle *newStyle = [pStyle mutableCopy];
      newStyle.textLists =
          [TextListsUtils textListsByReplacingChainWith:newChain
                                                inArray:pStyle.textLists];
      [textStorage addAttribute:NSParagraphStyleAttributeName
                          value:newStyle
                          range:paragraphRange];
      [input->attributesManager addDirtyRange:paragraphRange];

      if (NSEqualRanges(paragraphRange, cursorParagraphRange)) {
        [self updateTypingTextLists:newStyle.textLists input:input];
      }
      chain = newChain;
    }

    [depthsStack addObject:@(depth)];
    [chainsStack addObject:chain];
  }
}

// checks if nested structure is valid
+ (BOOL)chain:(NSArray<NSTextList *> *)chain
    hasParentChain:(NSArray<NSTextList *> *)parentChain {
  if (chain.count != parentChain.count + 1) {
    return NO;
  }
  for (NSUInteger i = 0; i < parentChain.count; i++) {
    if (![self listFormat:chain[i].markerFormat
                hasKindOf:parentChain[i].markerFormat]) {
      return NO;
    }
  }
  return YES;
}

+ (BOOL)listFormat:(NSString *)format hasKindOf:(NSString *)otherFormat {
  if ([format hasPrefix:@"EnrichedCheckbox"]) {
    return [otherFormat hasPrefix:@"EnrichedCheckbox"];
  }
  return [format isEqualToString:otherFormat];
}

+ (BOOL)isListParagraph:(NSRange)paragraphRange
                  input:(EnrichedTextInputView *)input {
  if (paragraphRange.length == 0) {
    return NO;
  }
  NSParagraphStyle *pStyle =
      [input->textView.textStorage attribute:NSParagraphStyleAttributeName
                                     atIndex:paragraphRange.location
                              effectiveRange:NULL];
  return [TextListsUtils listDepthInArray:pStyle.textLists] > 0;
}

+ (void)updateTypingTextLists:(NSArray<NSTextList *> *)textLists
                        input:(EnrichedTextInputView *)input {
  NSMutableDictionary *typingAttrs =
      [input->textView.typingAttributes mutableCopy];
  NSMutableParagraphStyle *typingStyle =
      [typingAttrs[NSParagraphStyleAttributeName] mutableCopy];
  if (typingStyle == nil) {
    return;
  }
  typingStyle.textLists = textLists;
  typingAttrs[NSParagraphStyleAttributeName] = typingStyle;
  input->textView.typingAttributes = typingAttrs;
}

@end
