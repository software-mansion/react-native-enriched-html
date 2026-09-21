#pragma once

#import "EnrichedTextInputView.h"
#import "interfaces/StyleTypeEnum.h"
#import "platform/EnrichedPlatform.h"
#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

@interface ShortcutsUtils : NSObject

+ (BOOL)tryHandlingParagraphShortcutsInRange:(NSRange)range
                             replacementText:(NSString *)text
                                       input:(EnrichedTextInputView *)input;

+ (BOOL)tryHandlingInlineShortcutsInRange:(NSRange)range
                          replacementText:(NSString *)text
                                    input:(EnrichedTextInputView *)input;

@end

NS_ASSUME_NONNULL_END
