#pragma once
#import "EnrichedPlatform.h"

@interface AlignmentEntry : NSObject

@property(nonatomic, assign) NSRange range;
@property(nonatomic, assign) NSTextAlignment alignment;

@end
