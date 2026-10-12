#import "TextListsUtils.h"

@implementation TextListsUtils

+ (NSArray<NSTextList *> *_Nonnull)
      textListsByAdding:(NSString *_Nonnull)value
    withExclusivePrefix:(NSString *_Nullable)prefix
                toArray:(NSArray<NSTextList *> *_Nullable)existing {
  NSMutableArray<NSTextList *> *updated =
      existing ? [existing mutableCopy] : [NSMutableArray array];

  if (prefix != nil) {
    NSUInteger i = 0;
    while (i < updated.count) {
      if ([updated[i].markerFormat hasPrefix:prefix]) {
        if ([updated[i].markerFormat isEqualToString:value]) {
          return updated;
        }
        [updated removeObjectAtIndex:i];
      } else {
        i++;
      }
    }
  } else {
    for (NSTextList *list in updated) {
      if ([list.markerFormat isEqualToString:value]) {
        return updated;
      }
    }
  }

  [updated addObject:[[NSTextList alloc] initWithMarkerFormat:value options:0]];
  return updated;
}

+ (NSArray<NSTextList *> *_Nonnull)
    textListsByRemoving:(NSString *_Nonnull)value
             withPrefix:(NSString *_Nullable)prefix
              fromArray:(NSArray<NSTextList *> *_Nullable)existing {
  NSMutableArray<NSTextList *> *updated = [NSMutableArray array];
  for (NSTextList *list in existing) {
    if ((prefix == nullptr && ![list.markerFormat isEqualToString:value]) ||
        (prefix != nullptr && ![list.markerFormat hasPrefix:prefix])) {
      [updated addObject:list];
    }
  }
  return updated;
}

+ (NSArray<NSTextList *> *_Nonnull)
    textListsByRemovingPrefix:(NSString *_Nullable)prefix
                    fromArray:(NSArray<NSTextList *> *_Nullable)existing {
  NSMutableArray<NSTextList *> *updated = [NSMutableArray array];
  for (NSTextList *list in existing) {
    if (![list.markerFormat hasPrefix:prefix]) {
      [updated addObject:list];
    }
  }
  return updated;
}

+ (BOOL)textLists:(NSArray<NSTextList *> *_Nullable)textLists
    containsValue:(NSString *_Nonnull)value {
  for (NSTextList *list in textLists) {
    if ([list.markerFormat isEqualToString:value]) {
      return YES;
    }
  }
  return NO;
}

+ (BOOL)textLists:(NSArray<NSTextList *> *_Nullable)textLists
    containsPrefix:(NSString *_Nullable)prefix {
  for (NSTextList *list in textLists) {
    if ([list.markerFormat hasPrefix:prefix]) {
      return YES;
    }
  }
  return NO;
}

+ (NSTextList *_Nullable)
    firstTextListWithPrefix:(NSString *_Nullable)prefix
                    inArray:(NSArray<NSTextList *> *_Nullable)textLists {
  for (NSTextList *list in textLists) {
    if ([list.markerFormat hasPrefix:prefix]) {
      return list;
    }
  }
  return nil;
}

+ (NSArray<NSTextList *> *_Nonnull)listChainInArray:
    (NSArray<NSTextList *> *_Nullable)textLists {
  NSMutableArray<NSTextList *> *chain = [NSMutableArray array];
  for (NSTextList *list in textLists) {
    if (![list.markerFormat hasPrefix:@"EnrichedAlignment"]) {
      [chain addObject:list];
    }
  }
  return chain;
}

+ (NSArray<NSTextList *> *_Nonnull)
    textListsByReplacingChainWith:(NSArray<NSTextList *> *_Nonnull)chain
                          inArray:(NSArray<NSTextList *> *_Nullable)existing {
  NSMutableArray<NSTextList *> *updated = [NSMutableArray array];
  for (NSTextList *list in existing) {
    if ([list.markerFormat hasPrefix:@"EnrichedAlignment"]) {
      [updated addObject:list];
    }
  }
  [updated addObjectsFromArray:chain];
  return updated;
}

+ (NSInteger)listDepthInArray:(NSArray<NSTextList *> *_Nullable)textLists {
  return [self listChainInArray:textLists].count;
}

+ (NSString *_Nullable)deepestListMarkerFormatInArray:
    (NSArray<NSTextList *> *_Nullable)textLists {
  return [self listChainInArray:textLists].lastObject.markerFormat;
}

+ (NSArray<NSTextList *> *_Nonnull)
    textListsByAppendingToChain:(NSString *_Nonnull)value
                        toArray:(NSArray<NSTextList *> *_Nullable)existing {
  NSMutableArray<NSTextList *> *updated =
      existing ? [existing mutableCopy] : [NSMutableArray array];
  [updated addObject:[[NSTextList alloc] initWithMarkerFormat:value options:0]];
  return updated;
}

+ (NSArray<NSTextList *> *_Nonnull)textListsByRemovingDeepestChainEntry:
    (NSArray<NSTextList *> *_Nullable)existing {
  NSArray<NSTextList *> *chain = [self listChainInArray:existing];
  if (chain.count == 0) {
    return existing ?: @[];
  }

  NSMutableArray<NSTextList *> *updated =
      existing ? [existing mutableCopy] : [NSMutableArray array];
  NSUInteger index = [updated indexOfObjectIdenticalTo:chain.lastObject];
  if (index != NSNotFound) {
    [updated removeObjectAtIndex:index];
  }
  return updated;
}

+ (NSArray<NSTextList *> *_Nonnull)textListsByRemovingParentChainEntry:
    (NSArray<NSTextList *> *_Nullable)existing {
  NSMutableArray<NSTextList *> *chain =
      [[self listChainInArray:existing] mutableCopy];
  if (chain.count < 2) {
    return existing ?: @[];
  }
  [chain removeObjectAtIndex:chain.count - 2];
  return [self textListsByReplacingChainWith:chain inArray:existing];
}

+ (NSArray<NSTextList *> *_Nonnull)
    textListsByReplacingDeepestChainEntry:(NSString *_Nonnull)value
                                  toArray:(NSArray<NSTextList *> *_Nullable)
                                              existing {
  NSArray<NSTextList *> *withoutDeepest =
      [self textListsByRemovingDeepestChainEntry:existing];
  return [self textListsByAppendingToChain:value toArray:withoutDeepest];
}

+ (NSArray *_Nonnull)snapshotTextListsInRange:(NSRange)range
                                  textStorage:
                                      (NSTextStorage *_Nonnull)textStorage {
  NSMutableArray *snapshot = [NSMutableArray array];
  if (NSMaxRange(range) > textStorage.length) {
    return snapshot;
  }
  NSRange paragraphsRange = [textStorage.string paragraphRangeForRange:range];
  [textStorage
      enumerateAttribute:NSParagraphStyleAttributeName
                 inRange:paragraphsRange
                 options:0
              usingBlock:^(id _Nullable value, NSRange subRange,
                           BOOL *_Nonnull stop) {
                NSParagraphStyle *pStyle = (NSParagraphStyle *)value;
                if (pStyle == nil) {
                  return;
                }
                [snapshot addObject:@[
                  [NSValue valueWithRange:subRange], pStyle.textLists ?: @[]
                ]];
              }];
  return snapshot;
}

+ (void)restoreTextListsSnapshot:(NSArray *_Nonnull)snapshot
                     textStorage:(NSTextStorage *_Nonnull)textStorage {
  for (NSArray *entry in snapshot) {
    NSRange range = [entry[0] rangeValue];
    if (NSMaxRange(range) > textStorage.length) {
      continue;
    }
    NSParagraphStyle *current =
        [textStorage attribute:NSParagraphStyleAttributeName
                       atIndex:range.location
                effectiveRange:NULL];
    if (current == nil) {
      continue;
    }
    NSMutableParagraphStyle *pStyle = [current mutableCopy];
    pStyle.textLists = entry[1];
    [textStorage addAttribute:NSParagraphStyleAttributeName
                        value:pStyle
                        range:range];
  }
}

@end
