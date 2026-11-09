#import "ArrayExtension.h"

@implementation NSArray (ArrayExtension)

- (NSArray *)sortedArrayBySortKey:(NSInteger (^)(id item))sortKeyForItem {
  return [self sortedArrayWithOptions:NSSortStable
                      usingComparator:^NSComparisonResult(id a, id b) {
                        NSInteger aKey = sortKeyForItem(a);
                        NSInteger bKey = sortKeyForItem(b);
                        if (aKey == bKey) {
                          return NSOrderedSame;
                        }
                        return aKey < bKey ? NSOrderedAscending
                                           : NSOrderedDescending;
                      }];
}

@end
