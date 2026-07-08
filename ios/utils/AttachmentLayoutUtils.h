#pragma once
#import "EnrichedConfig.h"
#import "EnrichedPlatform.h"
#import "ImageAttachment.h"

@interface AttachmentLayoutUtils : NSObject

+ (void)handleAttachmentUpdate:(MediaAttachment *)attachment
                      textView:(EnrichedBaseTextView *)textView
                 onLayoutBlock:(dispatch_block_t)layoutBlock;

+ (NSMutableDictionary<NSValue *, UIImageView *> *)
    layoutAttachmentsInTextView:(EnrichedBaseTextView *)textView
                         config:(EnrichedConfig *)config
                  existingViews:
                      (NSMutableDictionary<NSValue *, UIImageView *> *)
                          attachmentViews;

+ (CGRect)frameForAttachment:(ImageAttachment *)attachment
                     atRange:(NSRange)range
                    textView:(EnrichedBaseTextView *)textView
                      config:(EnrichedConfig *)config;

@end
