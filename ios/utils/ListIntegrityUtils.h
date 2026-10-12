#import "EnrichedTextInputView.h"
#import <UIKit/UIKit.h>
#pragma once

@interface ListIntegrityUtils : NSObject
// Updates nested lists structure, so all child/parent list relations are valid.
+ (void)validateListsInDirtyRanges:(EnrichedTextInputView *)input;
@end
