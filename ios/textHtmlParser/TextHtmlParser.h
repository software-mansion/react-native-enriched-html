#pragma once
#import "EnrichedPlatform.h"

@class EnrichedTextView;

@interface TextHtmlParser : NSObject
@property(nonatomic, weak) EnrichedTextView *view;
- (instancetype _Nonnull)initWithView:(EnrichedTextView *_Nonnull)view;
- (void)replaceWholeFromHtml:(NSString *_Nonnull)html;
@end
