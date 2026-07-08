#import "EnrichedTextTextView.h"
#import "EnrichedTextTouchHandler.h"
#import "EnrichedTextView.h"
#import "HtmlParser.h"
#import <UniformTypeIdentifiers/UniformTypeIdentifiers.h>

@implementation EnrichedTextTextView

- (void)copy:(id)sender {
  EnrichedTextView *host = self.host;
  if (host == nullptr) {
    return;
  }

  // remove zero width spaces before copying the text
  NSString *plainText = [host.textView.textStorage.string
      substringWithRange:host.textView.selectedRange];
  NSString *fixedPlainText =
      [plainText stringByReplacingOccurrencesOfString:@"\u200B" withString:@""];

  NSString *parsedHtml =
      [HtmlParser parseToHtmlFromRange:host.textView.selectedRange host:host];

  NSMutableAttributedString *attrStr = [[host.textView.textStorage
      attributedSubstringFromRange:host.textView.selectedRange] mutableCopy];
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

#if !TARGET_OS_OSX
  UIPasteboard *pasteboard = [UIPasteboard generalPasteboard];
  [pasteboard setItems:@[ @{
                UTTypeUTF8PlainText.identifier : fixedPlainText,
                UTTypeHTML.identifier : parsedHtml,
                UTTypeRTF.identifier : rtfData
              } ]];
#else
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
#endif
}

#if !TARGET_OS_OSX
- (void)touchesBegan:(NSSet<UITouch *> *)touches withEvent:(UIEvent *)event {
  if (touches.count == 1) {
    UITouch *touch = touches.anyObject;
    CGPoint point = [touch locationInView:self];
    [self.touchHandler handleTouchBeganAtPoint:point];
  }
  [super touchesBegan:touches withEvent:event];
}

- (void)touchesEnded:(NSSet<UITouch *> *)touches withEvent:(UIEvent *)event {
  if (touches.count == 1) {
    UITouch *touch = touches.anyObject;
    CGPoint point = [touch locationInView:self];
    [self.touchHandler handleTouchEndedAtPoint:point];
  }
  [super touchesEnded:touches withEvent:event];
}

- (void)touchesCancelled:(NSSet<UITouch *> *)touches
               withEvent:(UIEvent *)event {
  [self.touchHandler handleTouchCancelled];
  [super touchesCancelled:touches withEvent:event];
}
#else
// The touch handler runs before `super` so link/mention pressed styling is
// not delayed (see header comment); the same ordering applies to mouseDown.
- (void)mouseDown:(NSEvent *)event {
  NSPoint point = [self convertPoint:event.locationInWindow fromView:nil];
  [self.touchHandler handleTouchBeganAtPoint:point];
  [super mouseDown:event];
}

- (void)mouseUp:(NSEvent *)event {
  NSPoint point = [self convertPoint:event.locationInWindow fromView:nil];
  [self.touchHandler handleTouchEndedAtPoint:point];
  [super mouseUp:event];
}

- (void)mouseDragged:(NSEvent *)event {
  // Dragging away from the pressed element cancels the press, mirroring
  // touchesCancelled on iOS.
  [self.touchHandler handleTouchCancelled];
  [super mouseDragged:event];
}
#endif

@end
