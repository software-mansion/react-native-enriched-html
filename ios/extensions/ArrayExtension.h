#import <Foundation/Foundation.h>
#pragma once

@interface NSArray (ArrayExtension)
- (NSArray *)sortedArrayBySortKey:(NSInteger (^)(id item))sortKeyForItem;
@end
