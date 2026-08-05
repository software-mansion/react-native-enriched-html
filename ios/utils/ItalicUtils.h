#import <UIKit/UIKit.h>
#pragma once

@interface ItalicUtils : NSObject

+ (void)applyItalicInTextStorage:(NSTextStorage *)textStorage
                         inRange:(NSRange)range;
@end
