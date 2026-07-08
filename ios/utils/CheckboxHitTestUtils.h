#import "EnrichedPlatform.h"

@class EnrichedTextInputView;

@interface CheckboxHitTestUtils : NSObject

+ (NSInteger)hitTestCheckboxAtPoint:(CGPoint)pt
                            inInput:(EnrichedTextInputView *)input;

@end
