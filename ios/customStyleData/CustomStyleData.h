#pragma once
#import <UIKit/UIKit.h>

@interface CustomStyleData : NSObject <NSCopying>

@property(nonatomic, strong, nullable) UIColor *foregroundColor;
@property(nonatomic, strong, nullable) UIColor *backgroundColor;

- (BOOL)isEmpty;

// Applies a partial update from a dict. A key absent from the dict leaves the
// field unchanged; NSNull value clears it.
- (void)mergeFromDict:(NSDictionary *)dict;

@end
