#import "EnrichedPlatform.h"
#pragma once

#if !TARGET_OS_OSX

@interface KeyboardUtils : NSObject
+ (UIReturnKeyType)getUIReturnKeyTypeFromReturnKeyType:
    (NSString *)returnKeyType;
@end

#endif
