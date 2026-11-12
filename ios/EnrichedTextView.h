#pragma once
#import "config/EnrichedConfig.h"
#import "interfaces/EnrichedViewHost.h"
#import "interfaces/MediaAttachment.h"
#import "interfaces/MentionParams.h"
#import <React/RCTViewComponentView.h>
#import <UIKit/UIKit.h>

#ifndef EnrichedTextViewNativeComponent_h
#define EnrichedTextViewNativeComponent_h

NS_ASSUME_NONNULL_BEGIN

@interface EnrichedTextView
    : RCTViewComponentView <EnrichedViewHost, MediaAttachmentDelegate> {
@public
  UITextView *textView;
@public
  EnrichedConfig *config;
@public
  NSDictionary<NSNumber *, id> *stylesDict;
  NSMutableDictionary<NSNumber *, NSArray<NSNumber *> *> *conflictingStyles;
  NSMutableDictionary<NSNumber *, NSArray<NSNumber *> *> *blockingStyles;
  NSMutableDictionary<NSAttributedStringKey, id> *defaultTypingAttributes;
@public
  BOOL useHtmlNormalizer;
@public
  uint32_t ignoredStylesMask;
}
- (CGSize)measureSize:(CGFloat)maxWidth;
+ (CGSize)measureSnapshot:(NSAttributedString *)snapshot
                 maxWidth:(CGFloat)maxWidth
     maximumNumberOfLines:(NSUInteger)maximumNumberOfLines
            lineBreakMode:(NSLineBreakMode)lineBreakMode;
- (void)emitOnLinkPressEvent:(NSString *)url;
- (void)emitOnMentionPressEvent:(MentionParams *)mention;
- (void)emitOnImagePressEvent:(MediaAttachment *)attachment;
- (void)layoutAttachments;
@end

NS_ASSUME_NONNULL_END

#endif /* EnrichedTextViewNativeComponent_h */
