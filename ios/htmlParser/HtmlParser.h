#pragma once
#import "EnrichedPlatform.h"
#import "EnrichedViewHost.h"

@interface HtmlParser : NSObject
+ (NSString *_Nullable)initiallyProcessHtml:(NSString *_Nonnull)html
                          useHtmlNormalizer:(BOOL)useHtmlNormalizer;
+ (NSArray *_Nonnull)getTextAndStylesFromHtml:(NSString *_Nonnull)fixedHtml;
+ (NSString *_Nonnull)parseToHtmlFromRange:(NSRange)range
                                      host:(id<EnrichedViewHost>)host;
@end
