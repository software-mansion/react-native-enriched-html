#pragma once
#import "EnrichedConfig.h"
#import "EnrichedPlatform.h"
#import "EnrichedViewHost.h"
#import "MediaAttachment.h"
#import "MentionParams.h"
#import <React/RCTViewComponentView.h>

#ifndef EnrichedTextViewNativeComponent_h
#define EnrichedTextViewNativeComponent_h

NS_ASSUME_NONNULL_BEGIN

@interface EnrichedTextView
    : RCTViewComponentView <EnrichedViewHost, MediaAttachmentDelegate> {
@public
  EnrichedBaseTextView *textView;
@public
  EnrichedConfig *config;
@public
  NSDictionary<NSNumber *, id> *stylesDict;
  NSMutableDictionary<NSNumber *, NSArray<NSNumber *> *> *conflictingStyles;
  NSMutableDictionary<NSNumber *, NSArray<NSNumber *> *> *blockingStyles;
  NSMutableDictionary<NSAttributedStringKey, id> *defaultTypingAttributes;
@public
  BOOL useHtmlNormalizer;
}
- (CGSize)measureSize:(CGFloat)maxWidth;
- (void)emitOnLinkPressEvent:(NSString *)url;
- (void)emitOnMentionPressEvent:(MentionParams *)mention;
@end

NS_ASSUME_NONNULL_END

#endif /* EnrichedTextViewNativeComponent_h */
