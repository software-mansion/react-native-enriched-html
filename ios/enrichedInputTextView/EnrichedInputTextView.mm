#import "EnrichedInputTextView.h"
#import "AlignmentUtils.h"
#import "CheckboxHitTestUtils.h"
#import "EnrichedTextInputView.h"
#import "HtmlParser.h"
#import "StringExtension.h"
#import "TextInsertionUtils.h"
#import "TextListsUtils.h"
#import <UniformTypeIdentifiers/UniformTypeIdentifiers.h>

@implementation EnrichedInputTextView

#if !TARGET_OS_OSX

- (void)layoutSubviews {
  [super layoutSubviews];
  // UITextView resets contentSize during its own layout pass (triggered when
  // the frame is set on first mount). Re-schedule a relayout so our explicit
  // contentSize is applied after UITextView finishes its internal layout.
  EnrichedTextInputView *input = (EnrichedTextInputView *)_input;
  if (input != nil) {
    [input scheduleRelayoutIfNeeded];
  }
}

// UITextView places the cursor at the leading edge when a paragraph contains
// zero (or invisible) glyphs because the layout engine has nothing to align.
// We fix this by reading the active alignment and repositioning the caret rect
- (CGRect)caretRectForPosition:(UITextPosition *)position {
  CGRect rect = [super caretRectForPosition:position];
  NSUInteger idx = [self offsetFromPosition:self.beginningOfDocument
                                 toPosition:position];
  NSString *text = self.textStorage.string;
  NSRange paraRange = NSMakeRange(0, 0);
  if (idx <= text.length) {
    paraRange = [text paragraphRangeForRange:NSMakeRange(idx, 0)];
  }

  // Non-empty paragraph gets its caret drawn the usual way.
  if (paraRange.length != 0) {
    return rect;
  }

  NSParagraphStyle *pStyle =
      self.typingAttributes[NSParagraphStyleAttributeName];

  if (pStyle == nil) {
    return rect;
  }

  NSString *marker =
      [TextListsUtils firstTextListWithPrefix:@"EnrichedAlignment"
                                      inArray:pStyle.textLists]
          .markerFormat;
  NSTextAlignment alignment = [AlignmentUtils markerToAlignment:marker];
  CGFloat containerWidth = self.textContainer.size.width;

  if (alignment == NSTextAlignmentCenter) {
    rect.origin.x = (containerWidth - rect.size.width) / 2.0;
  } else if (alignment == NSTextAlignmentRight) {
    rect.origin.x = containerWidth - rect.size.width;
  }

  return rect;
}

- (void)copy:(id)sender {
  EnrichedTextInputView *typedInput = (EnrichedTextInputView *)_input;
  if (typedInput == nullptr) {
    return;
  }

  // remove zero width spaces before copying the text
  NSString *plainText = [typedInput->textView.textStorage.string
      substringWithRange:typedInput->textView.selectedRange];
  NSString *fixedPlainText =
      [plainText stringByReplacingOccurrencesOfString:@"\u200B" withString:@""];

  NSString *parsedHtml =
      [HtmlParser parseToHtmlFromRange:typedInput->textView.selectedRange
                                  host:typedInput];

  NSMutableAttributedString *attrStr = [[typedInput->textView.textStorage
      attributedSubstringFromRange:typedInput->textView.selectedRange]
      mutableCopy];
  NSRange fullAttrStrRange = NSMakeRange(0, attrStr.length);
  [attrStr.mutableString replaceOccurrencesOfString:@"\u200B"
                                         withString:@""
                                            options:0
                                              range:fullAttrStrRange];

  NSData *rtfData =
      [attrStr dataFromRange:NSMakeRange(0, attrStr.length)
          documentAttributes:@{
            NSDocumentTypeDocumentAttribute : NSRTFTextDocumentType
          }
                       error:nullptr];

  UIPasteboard *pasteboard = [UIPasteboard generalPasteboard];
  [pasteboard setItems:@[ @{
                UTTypeUTF8PlainText.identifier : fixedPlainText,
                UTTypeHTML.identifier : parsedHtml,
                UTTypeRTF.identifier : rtfData
              } ]];
}

- (void)paste:(id)sender {
  EnrichedTextInputView *typedInput = (EnrichedTextInputView *)_input;
  if (typedInput == nullptr) {
    return;
  }

  UIPasteboard *pasteboard = [UIPasteboard generalPasteboard];
  NSArray<NSString *> *pasteboardTypes = pasteboard.pasteboardTypes;
  NSRange currentRange = typedInput->textView.selectedRange;

  // Check the pasteboard for supported image formats. If found, save them to
  // temporary storage then emit the 'onPasteImages' event and stop processing
  // further (ignoring any HTML/Text).
  NSMutableArray<NSDictionary *> *foundImages = [NSMutableArray new];

  for (NSDictionary<NSString *, id> *item in pasteboard.items) {
    NSData *imageData = nil;
    BOOL added = NO;
    NSString *ext = nil;
    NSString *mimeType = nil;

    for (int j = 0; j < item.allKeys.count; j++) {
      if (added) {
        break;
      }

      NSString *type = item.allKeys[j];
      if ([type isEqual:UTTypeJPEG.identifier] ||
          [type isEqual:UTTypePNG.identifier] ||
          [type isEqual:UTTypeHEIC.identifier] ||
          [type isEqual:UTTypeTIFF.identifier]) {
        id value = item[type];
        if ([value isKindOfClass:[NSData class]]) {
          // raw bytes available — no re-encoding needed
          imageData = (NSData *)value;
        } else if ([value isKindOfClass:[UIImage class]]) {
          imageData = [self getDataForImageItem:(UIImage *)value type:type];
        }
      } else if ([type isEqual:UTTypeWebP.identifier] ||
                 [type isEqual:UTTypeGIF.identifier]) {
        // webp and gifs: read raw bytes directly — no re-encoding needed
        imageData = [pasteboard dataForPasteboardType:type];
      }
      if (!imageData) {
        continue;
      }

      NSDictionary *info = [self detectImageFormat:type];
      if (!info) {
        continue;
      }
      ext = info[@"ext"];
      mimeType = info[@"mime"];

      UIImage *imageInfo = [UIImage imageWithData:imageData];

      if (imageInfo) {
        NSString *path = [self saveToTempFile:imageData extension:ext];

        if (path) {
          added = YES;
          [foundImages addObject:@{
            @"uri" : path,
            @"type" : mimeType,
            @"width" : @(imageInfo.size.width),
            @"height" : @(imageInfo.size.height)
          }];
        }
      }
    }
  }

  if (foundImages.count > 0) {
    [typedInput emitOnPasteImagesEvent:foundImages];
    return;
  }

  if ([pasteboardTypes containsObject:UTTypeHTML.identifier]) {
    // we try processing the html contents

    NSString *htmlString;
    id htmlValue = [pasteboard valueForPasteboardType:UTTypeHTML.identifier];

    if ([htmlValue isKindOfClass:[NSData class]]) {
      htmlString = [[NSString alloc] initWithData:htmlValue
                                         encoding:NSUTF8StringEncoding];
    } else if ([htmlValue isKindOfClass:[NSString class]]) {
      htmlString = htmlValue;
    }

    // validate the html
    NSString *initiallyProcessedHtml =
        [typedInput->parser initiallyProcessHtml:htmlString];

    if (initiallyProcessedHtml != nullptr) {
      // valid html, let's apply it
      currentRange.length > 0
          ? [typedInput->parser replaceFromHtml:initiallyProcessedHtml
                                          range:currentRange]
          : [typedInput->parser insertFromHtml:initiallyProcessedHtml
                                      location:currentRange.location];
    } else {
      // fall back to plain text, otherwise do nothing
      [self tryHandlingPlainTextItemsIn:pasteboard
                                  range:currentRange
                                  input:typedInput];
    }
  } else {
    [self tryHandlingPlainTextItemsIn:pasteboard
                                range:currentRange
                                input:typedInput];
  }

  [typedInput anyTextMayHaveBeenModified];
}

#endif // !TARGET_OS_OSX

- (NSDictionary *)detectImageFormat:(NSString *)type {
  if ([type isEqual:UTTypeJPEG.identifier]) {
    return @{@"ext" : @"jpg", @"mime" : @"image/jpeg"};
  } else if ([type isEqual:UTTypePNG.identifier]) {
    return @{@"ext" : @"png", @"mime" : @"image/png"};
  } else if ([type isEqual:UTTypeGIF.identifier]) {
    return @{@"ext" : @"gif", @"mime" : @"image/gif"};
  } else if ([type isEqual:UTTypeHEIC.identifier]) {
    return @{@"ext" : @"heic", @"mime" : @"image/heic"};
  } else if ([type isEqual:UTTypeWebP.identifier]) {
    return @{@"ext" : @"webp", @"mime" : @"image/webp"};
  } else if ([type isEqual:UTTypeTIFF.identifier]) {
    return @{@"ext" : @"tiff", @"mime" : @"image/tiff"};
  } else {
    return nil;
  }
}

#if !TARGET_OS_OSX
- (NSData *)getDataForImageItem:(UIImage *)image type:(NSString *)type {
  if ([type isEqual:UTTypePNG.identifier]) {
    return UIImagePNGRepresentation(image);
  } else if ([type isEqual:UTTypeHEIC.identifier]) {
    return UIImageHEICRepresentation(image);
  } else {
    return UIImageJPEGRepresentation(image, 1.0);
  }
}

#endif // !TARGET_OS_OSX

- (NSString *)saveToTempFile:(NSData *)data extension:(NSString *)ext {
  if (!data)
    return nil;
  NSString *fileName =
      [NSString stringWithFormat:@"%@.%@", [NSUUID UUID].UUIDString, ext];

  NSString *filePath =
      [NSTemporaryDirectory() stringByAppendingPathComponent:fileName];

  if ([data writeToFile:filePath atomically:YES]) {
    return [NSURL fileURLWithPath:filePath].absoluteString;
  }

  return nil;
}

#if !TARGET_OS_OSX
- (void)tryHandlingPlainTextItemsIn:(UIPasteboard *)pasteboard
                              range:(NSRange)range
                              input:(EnrichedTextInputView *)input {
  NSArray *existingTypes = pasteboard.pasteboardTypes;
  NSArray *handledTypes = @[
    UTTypeUTF8PlainText.identifier, UTTypePlainText.identifier,
    UTTypeURL.identifier
  ];
  NSString *plainText;

  for (NSString *type in handledTypes) {
    if (![existingTypes containsObject:type]) {
      continue;
    }

    id value = [pasteboard valueForPasteboardType:type];

    if ([value isKindOfClass:[NSData class]]) {
      plainText = [[NSString alloc] initWithData:value
                                        encoding:NSUTF8StringEncoding];
    } else if ([value isKindOfClass:[NSString class]]) {
      plainText = (NSString *)value;
    } else if ([value isKindOfClass:[NSURL class]]) {
      plainText = [(NSURL *)value absoluteString];
    }
  }

  if (!plainText) {
    return;
  }

  range.length > 0 ? [TextInsertionUtils replaceText:plainText
                                                  at:range
                                additionalAttributes:nullptr
                                                host:input
                                       withSelection:YES]
                   : [TextInsertionUtils insertText:plainText
                                                 at:range.location
                               additionalAttributes:nullptr
                                               host:input
                                      withSelection:YES];
}

- (void)cut:(id)sender {
  EnrichedTextInputView *typedInput = (EnrichedTextInputView *)_input;
  if (typedInput == nullptr) {
    return;
  }

  [self copy:sender];
  [TextInsertionUtils replaceText:@""
                               at:typedInput->textView.selectedRange
             additionalAttributes:nullptr
                             host:typedInput
                    withSelection:YES];

  [typedInput anyTextMayHaveBeenModified];
}

- (BOOL)canPerformAction:(SEL)action withSender:(id)sender {
  if (action == @selector(paste:)) {
    UIPasteboard *pasteboard = [UIPasteboard generalPasteboard];
    // Enable Paste if clipboard has Text OR Images
    if (pasteboard.hasStrings || pasteboard.hasImages) {
      return YES;
    }
  }
  return [super canPerformAction:action withSender:sender];
}

#else // TARGET_OS_OSX

- (void)layout {
  [super layout];
  // Re-schedule a relayout so sizing is re-applied after AppKit finishes its
  // own layout pass (mirrors the layoutSubviews override on iOS).
  EnrichedTextInputView *input = (EnrichedTextInputView *)_input;
  if (input != nil) {
    [input scheduleRelayoutIfNeeded];
  }
}

// On macOS focus events are tied to first-responder status instead of
// UITextViewDelegate's textViewDidBegin/EndEditing (whose AppKit counterparts
// only fire around actual edits).
- (BOOL)becomeFirstResponder {
  BOOL result = [super becomeFirstResponder];
  EnrichedTextInputView *input = (EnrichedTextInputView *)_input;
  if (result && input != nil) {
    [input handleDidBeginEditing];
  }
  return result;
}

- (BOOL)resignFirstResponder {
  BOOL result = [super resignFirstResponder];
  EnrichedTextInputView *input = (EnrichedTextInputView *)_input;
  // resignFirstResponder also fires during window teardown; only emit for
  // real focus changes.
  if (result && input != nil && self.window != nil) {
    [input handleDidEndEditing];
  }
  return result;
}

- (void)mouseDown:(NSEvent *)event {
  EnrichedTextInputView *input = (EnrichedTextInputView *)_input;
  if (input != nil) {
    NSPoint point = [self convertPoint:event.locationInWindow fromView:nil];
    NSInteger checkboxIndex =
        [CheckboxHitTestUtils hitTestCheckboxAtPoint:point inInput:input];
    if (checkboxIndex >= 0) {
      if (!self.enrichedIsFirstResponder) {
        [self.window makeFirstResponder:self];
      }
      [input handleCheckboxTapAtIndex:(NSUInteger)checkboxIndex];
      // Swallow the click so the caret does not additionally move to the
      // clicked location (matches cancelsTouchesInView on iOS).
      return;
    }
  }
  [super mouseDown:event];
}

// NSTextView places the cursor at the leading edge when a paragraph contains
// zero (or invisible) glyphs because the layout engine has nothing to align.
// This mirrors the caretRectForPosition: override on iOS by repositioning the
// insertion point rect based on the active alignment.
- (NSRect)adjustedInsertionPointRect:(NSRect)rect {
  NSUInteger idx = self.selectedRange.location;
  NSString *text = self.textStorage.string;
  NSRange paraRange = NSMakeRange(0, 0);
  if (idx <= text.length) {
    paraRange = [text paragraphRangeForRange:NSMakeRange(idx, 0)];
  }

  // Non-empty paragraph gets its caret drawn the usual way.
  if (paraRange.length != 0) {
    return rect;
  }

  NSParagraphStyle *pStyle =
      self.typingAttributes[NSParagraphStyleAttributeName];

  if (pStyle == nil) {
    return rect;
  }

  NSString *marker =
      [TextListsUtils firstTextListWithPrefix:@"EnrichedAlignment"
                                      inArray:pStyle.textLists]
          .markerFormat;
  NSTextAlignment alignment = [AlignmentUtils markerToAlignment:marker];
  CGFloat containerWidth = self.textContainer.size.width;

  if (alignment == NSTextAlignmentCenter) {
    rect.origin.x = (containerWidth - rect.size.width) / 2.0;
  } else if (alignment == NSTextAlignmentRight) {
    rect.origin.x = containerWidth - rect.size.width;
  }

  return rect;
}

- (void)drawInsertionPointInRect:(NSRect)rect
                           color:(NSColor *)color
                        turnedOn:(BOOL)flag {
  [super drawInsertionPointInRect:[self adjustedInsertionPointRect:rect]
                            color:color
                         turnedOn:flag];
}

- (void)setNeedsDisplayInRect:(NSRect)rect avoidAdditionalLayout:(BOOL)flag {
  // Widen caret invalidation to the full line width so a repositioned
  // insertion point does not leave ghosts at its original location.
  rect.origin.x = 0;
  rect.size.width = self.bounds.size.width;
  [super setNeedsDisplayInRect:rect avoidAdditionalLayout:flag];
}

- (void)copy:(id)sender {
  EnrichedTextInputView *typedInput = (EnrichedTextInputView *)_input;
  if (typedInput == nullptr) {
    return;
  }

  // remove zero width spaces before copying the text
  NSString *plainText = [typedInput->textView.textStorage.string
      substringWithRange:typedInput->textView.selectedRange];
  NSString *fixedPlainText =
      [plainText stringByReplacingOccurrencesOfString:@"\u200B" withString:@""];

  NSString *parsedHtml =
      [HtmlParser parseToHtmlFromRange:typedInput->textView.selectedRange
                                  host:typedInput];

  NSMutableAttributedString *attrStr = [[typedInput->textView.textStorage
      attributedSubstringFromRange:typedInput->textView.selectedRange]
      mutableCopy];
  NSRange fullAttrStrRange = NSMakeRange(0, attrStr.length);
  [attrStr.mutableString replaceOccurrencesOfString:@"\u200B"
                                         withString:@""
                                            options:0
                                              range:fullAttrStrRange];

  NSData *rtfData =
      [attrStr dataFromRange:NSMakeRange(0, attrStr.length)
          documentAttributes:@{
            NSDocumentTypeDocumentAttribute : NSRTFTextDocumentType
          }
                       error:nullptr];

  NSPasteboard *pasteboard = NSPasteboard.generalPasteboard;
  [pasteboard clearContents];
  [pasteboard declareTypes:@[
    NSPasteboardTypeHTML, NSPasteboardTypeRTF, NSPasteboardTypeString
  ]
                     owner:nil];
  [pasteboard setString:fixedPlainText forType:NSPasteboardTypeString];
  [pasteboard setString:parsedHtml forType:NSPasteboardTypeHTML];
  if (rtfData != nullptr) {
    [pasteboard setData:rtfData forType:NSPasteboardTypeRTF];
  }
}

- (void)cut:(id)sender {
  EnrichedTextInputView *typedInput = (EnrichedTextInputView *)_input;
  if (typedInput == nullptr) {
    return;
  }

  [self copy:sender];
  [TextInsertionUtils replaceText:@""
                               at:typedInput->textView.selectedRange
             additionalAttributes:nullptr
                             host:typedInput
                    withSelection:YES];

  [typedInput anyTextMayHaveBeenModified];
}

- (void)paste:(id)sender {
  EnrichedTextInputView *typedInput = (EnrichedTextInputView *)_input;
  if (typedInput == nullptr) {
    return;
  }

  NSPasteboard *pasteboard = NSPasteboard.generalPasteboard;
  NSRange currentRange = typedInput->textView.selectedRange;

  // Check the pasteboard for supported image formats. If found, save them to
  // temporary storage then emit the 'onPasteImages' event and stop processing
  // further (ignoring any HTML/Text). Modern NSPasteboard types are UTIs, so
  // the same identifiers as on iOS apply.
  NSMutableArray<NSDictionary *> *foundImages = [NSMutableArray new];

  for (NSPasteboardItem *item in pasteboard.pasteboardItems) {
    NSData *imageData = nil;
    NSString *ext = nil;
    NSString *mimeType = nil;

    for (NSPasteboardType type in item.types) {
      if ([type isEqual:UTTypeJPEG.identifier] ||
          [type isEqual:UTTypePNG.identifier] ||
          [type isEqual:UTTypeHEIC.identifier] ||
          [type isEqual:UTTypeTIFF.identifier] ||
          [type isEqual:UTTypeWebP.identifier] ||
          [type isEqual:UTTypeGIF.identifier]) {
        NSData *typeData = [item dataForType:type];
        NSDictionary *info = [self detectImageFormat:type];
        if (typeData == nil || info == nil) {
          continue;
        }
        imageData = typeData;
        ext = info[@"ext"];
        mimeType = info[@"mime"];
        break;
      }

      // Finder file copies arrive as file URLs instead of raw image bytes.
      if ([type isEqual:NSPasteboardTypeFileURL]) {
        NSString *urlString = [item stringForType:NSPasteboardTypeFileURL];
        NSURL *fileURL =
            urlString != nil ? [NSURL URLWithString:urlString] : nil;
        if (fileURL == nil) {
          continue;
        }
        UTType *fileType =
            [UTType typeWithFilenameExtension:fileURL.pathExtension];
        NSDictionary *info = [self detectImageFormat:fileType.identifier];
        if (info == nil) {
          continue;
        }
        NSData *fileData = [NSData dataWithContentsOfURL:fileURL];
        if (fileData == nil) {
          continue;
        }
        imageData = fileData;
        ext = info[@"ext"];
        mimeType = info[@"mime"];
        break;
      }
    }

    if (imageData == nil) {
      continue;
    }

    UIImage *imageInfo = [UIImage imageWithData:imageData];
    if (imageInfo) {
      NSString *path = [self saveToTempFile:imageData extension:ext];
      if (path) {
        [foundImages addObject:@{
          @"uri" : path,
          @"type" : mimeType,
          @"width" : @(imageInfo.size.width),
          @"height" : @(imageInfo.size.height)
        }];
      }
    }
  }

  if (foundImages.count > 0) {
    [typedInput emitOnPasteImagesEvent:foundImages];
    return;
  }

  NSString *htmlString = [pasteboard stringForType:NSPasteboardTypeHTML];
  if (htmlString != nil) {
    // we try processing the html contents
    NSString *initiallyProcessedHtml =
        [typedInput->parser initiallyProcessHtml:htmlString];

    if (initiallyProcessedHtml != nullptr) {
      // valid html, let's apply it
      currentRange.length > 0
          ? [typedInput->parser replaceFromHtml:initiallyProcessedHtml
                                          range:currentRange]
          : [typedInput->parser insertFromHtml:initiallyProcessedHtml
                                      location:currentRange.location];
    } else {
      // fall back to plain text, otherwise do nothing
      [self tryHandlingPlainTextItemsIn:pasteboard
                                  range:currentRange
                                  input:typedInput];
    }
  } else {
    [self tryHandlingPlainTextItemsIn:pasteboard
                                range:currentRange
                                input:typedInput];
  }

  [typedInput anyTextMayHaveBeenModified];
}

- (void)pasteAsPlainText:(id)sender {
  [self paste:sender];
}

- (void)pasteAsRichText:(id)sender {
  [self paste:sender];
}

- (void)tryHandlingPlainTextItemsIn:(NSPasteboard *)pasteboard
                              range:(NSRange)range
                              input:(EnrichedTextInputView *)input {
  NSString *plainText = [pasteboard stringForType:NSPasteboardTypeString];
  if (plainText == nil) {
    plainText = [pasteboard stringForType:NSPasteboardTypeURL];
  }

  if (!plainText) {
    return;
  }

  range.length > 0 ? [TextInsertionUtils replaceText:plainText
                                                  at:range
                                additionalAttributes:nullptr
                                                host:input
                                       withSelection:YES]
                   : [TextInsertionUtils insertText:plainText
                                                 at:range.location
                               additionalAttributes:nullptr
                                               host:input
                                      withSelection:YES];
}

- (BOOL)validateUserInterfaceItem:(id<NSValidatedUserInterfaceItem>)item {
  if (item.action == @selector(paste:)) {
    NSPasteboard *pasteboard = NSPasteboard.generalPasteboard;
    // Enable Paste if clipboard has Text OR Images
    if ([pasteboard canReadItemWithDataConformingToTypes:@[
          UTTypeUTF8PlainText.identifier, UTTypeHTML.identifier,
          UTTypeImage.identifier, NSPasteboardTypeFileURL
        ]]) {
      return YES;
    }
  }
  return [super validateUserInterfaceItem:item];
}

#endif // TARGET_OS_OSX

@end
