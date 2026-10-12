#pragma once
#import <UIKit/UIKit.h>

@interface TextListsUtils : NSObject

// Appends value to the array. If exclusivePrefix is non-nil, any existing
// entry whose markerFormat starts with that prefix is evicted first, ensuring
// only one value from the family is present at a time.
+ (NSArray<NSTextList *> *_Nonnull)
      textListsByAdding:(NSString *_Nonnull)value
    withExclusivePrefix:(NSString *_Nullable)prefix
                toArray:(NSArray<NSTextList *> *_Nullable)existing;

// Returns a new array without entries whose markerFormat equals value removed
// or whose markerFormat starts with prefix
+ (NSArray<NSTextList *> *_Nonnull)
    textListsByRemoving:(NSString *_Nonnull)value
             withPrefix:(NSString *_Nullable)prefix
              fromArray:(NSArray<NSTextList *> *_Nullable)existing;

// Returns a new array without entries whose markerFormat starts with prefix
+ (NSArray<NSTextList *> *_Nonnull)
    textListsByRemovingPrefix:(NSString *_Nullable)prefix
                    fromArray:(NSArray<NSTextList *> *_Nullable)existing;

// Returns YES if any entry's markerFormat equals value exactly.
+ (BOOL)textLists:(NSArray<NSTextList *> *_Nullable)textLists
    containsValue:(NSString *_Nonnull)value;

// Returns YES if any entry's markerFormat starts with prefix.
+ (BOOL)textLists:(NSArray<NSTextList *> *_Nullable)textLists
    containsPrefix:(NSString *_Nullable)prefix;

// Returns the first entry with a markerFormat that starts with prefix,
// otherwise nil.
+ (NSTextList *_Nullable)
    firstTextListWithPrefix:(NSString *_Nullable)prefix
                    inArray:(NSArray<NSTextList *> *_Nullable)textLists;

// nested-lists-scoped utils

// Returns the sub-sequence of textLists (preserving relative order) that
// represents the real list nesting chain. The last entry is this paragraph's
// own list type.
+ (NSArray<NSTextList *> *_Nonnull)listChainInArray:
    (NSArray<NSTextList *> *_Nullable)textLists;

// Replaces the whole list chain with the given one.
+ (NSArray<NSTextList *> *_Nonnull)
    textListsByReplacingChainWith:(NSArray<NSTextList *> *_Nonnull)chain
                          inArray:(NSArray<NSTextList *> *_Nullable)existing;

// Returns the chain length (nesting depth) of markers representing list styles.
+ (NSInteger)listDepthInArray:(NSArray<NSTextList *> *_Nullable)textLists;

// Returns the markerFormat of the paragraph's own deepest list entry.
+ (NSString *_Nullable)deepestListMarkerFormatInArray:
    (NSArray<NSTextList *> *_Nullable)textLists;

// Append a new entry to the existing chain, becoming the new deepest nested
// list level.
+ (NSArray<NSTextList *> *_Nonnull)
    textListsByAppendingToChain:(NSString *_Nonnull)value
                        toArray:(NSArray<NSTextList *> *_Nullable)existing;

// Removes a deepest entry from the existing chain.
+ (NSArray<NSTextList *> *_Nonnull)textListsByRemovingDeepestChainEntry:
    (NSArray<NSTextList *> *_Nullable)existing;

// Removes the closest parent (second to last element) in the list chain.
+ (NSArray<NSTextList *> *_Nonnull)textListsByRemovingParentChainEntry:
    (NSArray<NSTextList *> *_Nullable)existing;

// Replaces the deepest existing chain entry.
+ (NSArray<NSTextList *> *_Nonnull)
    textListsByReplacingDeepestChainEntry:(NSString *_Nonnull)value
                                  toArray:(NSArray<NSTextList *> *_Nullable)
                                              existing;

// Captures textLists of every paragraph overlapping range, so they can be put
// back with restoreTextListsSnapshot:inTextStorage:.
+ (NSArray *_Nonnull)snapshotTextListsInRange:(NSRange)range
                                  textStorage:
                                      (NSTextStorage *_Nonnull)textStorage;

// Restores textLists captured by snapshotTextListsInRange:textStorage:.
+ (void)restoreTextListsSnapshot:(NSArray *_Nonnull)snapshot
                     textStorage:(NSTextStorage *_Nonnull)textStorage;

@end
