#import "EnrichedPlatform.h"

#import <objc/runtime.h>

#if !TARGET_OS_OSX

UIBezierPath *EnrichedRoundedRectPath(CGRect rect, UIRectCorner corners,
                                      CGFloat radius) {
  return [UIBezierPath bezierPathWithRoundedRect:rect
                               byRoundingCorners:corners
                                     cornerRadii:CGSizeMake(radius, radius)];
}

@implementation UITextView (EnrichedUIKitCompat)

- (UIEdgeInsets)enrichedTextContainerInset {
  return self.textContainerInset;
}

- (BOOL)enrichedHasMarkedText {
  return self.markedTextRange != nil;
}

- (BOOL)enrichedIsFirstResponder {
  return self.isFirstResponder;
}

- (void)enrichedEndEditing {
  [self endEditing:NO];
}

- (void)enrichedSetTintColor:(UIColor *)color {
  if (color != nil) {
    self.tintColor = color;
  }
}

@end

#else // TARGET_OS_OSX

void EnrichedRectFill(CGRect rect) {
  // NSRectFill uses copy blending which would erase underlying content on
  // transparent backgrounds; source-over matches UIRectFill.
  NSRectFillUsingOperation(rect, NSCompositingOperationSourceOver);
}

void EnrichedDrawImageInRect(NSImage *image, CGRect rect) {
  [image drawInRect:rect
            fromRect:NSZeroRect
           operation:NSCompositingOperationSourceOver
            fraction:1.0
      respectFlipped:YES
               hints:nil];
}

void EnrichedBringSubviewToFront(NSView *parent, NSView *child) {
  if (child.superview == parent) {
    [child removeFromSuperview];
  }
  [parent addSubview:child positioned:NSWindowAbove relativeTo:nil];
}

UIBezierPath *EnrichedRoundedRectPath(CGRect rect, UIRectCorner corners,
                                      CGFloat radius) {
  NSBezierPath *path = [NSBezierPath bezierPath];
  CGFloat minX = NSMinX(rect), midX = NSMidX(rect), maxX = NSMaxX(rect);
  CGFloat minY = NSMinY(rect), midY = NSMidY(rect), maxY = NSMaxY(rect);

  CGFloat topLeft = (corners & UIRectCornerTopLeft) ? radius : 0;
  CGFloat topRight = (corners & UIRectCornerTopRight) ? radius : 0;
  CGFloat bottomLeft = (corners & UIRectCornerBottomLeft) ? radius : 0;
  CGFloat bottomRight = (corners & UIRectCornerBottomRight) ? radius : 0;

  // The library always draws into flipped (top-left origin) text view
  // contexts, so "top" here means minY, matching UIKit's UIRectCorner.
  [path moveToPoint:NSMakePoint(midX, minY)];
  [path appendBezierPathWithArcFromPoint:NSMakePoint(maxX, minY)
                                 toPoint:NSMakePoint(maxX, midY)
                                  radius:topRight];
  [path appendBezierPathWithArcFromPoint:NSMakePoint(maxX, maxY)
                                 toPoint:NSMakePoint(midX, maxY)
                                  radius:bottomRight];
  [path appendBezierPathWithArcFromPoint:NSMakePoint(minX, maxY)
                                 toPoint:NSMakePoint(minX, midY)
                                  radius:bottomLeft];
  [path appendBezierPathWithArcFromPoint:NSMakePoint(minX, minY)
                                 toPoint:NSMakePoint(midX, minY)
                                  radius:topLeft];
  [path closePath];
  return path;
}

@implementation NSTextView (EnrichedUIKitCompat)

- (NSString *)text {
  return self.string;
}

- (void)setText:(NSString *)text {
  self.string = text ?: @"";
}

- (BOOL)isScrollEnabled {
  NSScrollView *scrollView = self.enclosingScrollView;
  return scrollView != nil && scrollView.hasVerticalScroller;
}

- (void)setScrollEnabled:(BOOL)scrollEnabled {
  NSScrollView *scrollView = self.enclosingScrollView;
  scrollView.hasVerticalScroller = scrollEnabled;
  scrollView.verticalScrollElasticity =
      scrollEnabled ? NSScrollElasticityAutomatic : NSScrollElasticityNone;
}

- (UIEdgeInsets)enrichedTextContainerInset {
  NSPoint origin = self.textContainerOrigin;
  return NSEdgeInsetsMake(origin.y, origin.x, self.textContainerInset.height,
                          origin.x);
}

- (BOOL)enrichedHasMarkedText {
  return self.hasMarkedText;
}

- (BOOL)enrichedIsFirstResponder {
  return self.window.firstResponder == self;
}

- (void)enrichedEndEditing {
  if (self.enrichedIsFirstResponder) {
    [self.window makeFirstResponder:nil];
  }
}

- (void)enrichedSetTintColor:(NSColor *)color {
  if (color == nil) {
    return;
  }
  self.insertionPointColor = color;
  NSMutableDictionary *attributes =
      [self.selectedTextAttributes mutableCopy] ?: [NSMutableDictionary new];
  attributes[NSBackgroundColorAttributeName] =
      [color colorWithAlphaComponent:0.25];
  self.selectedTextAttributes = attributes;
}

@end

@implementation NSTextField (EnrichedUIKitCompat)

- (NSString *)text {
  return self.stringValue;
}

- (void)setText:(NSString *)text {
  self.stringValue = text ?: @"";
}

- (NSAttributedString *)attributedText {
  return self.attributedStringValue;
}

- (void)setAttributedText:(NSAttributedString *)attributedText {
  self.attributedStringValue = attributedText ?: [NSAttributedString new];
}

@end

@implementation EnrichedPlaceholderLabel

// The label is constrained to cover the whole text view, so it must never win
// hit-testing — otherwise clicks would not reach (and focus) the NSTextView
// underneath it.
- (NSView *)hitTest:(NSPoint)point {
  return nil;
}

@end

@implementation NSImage (EnrichedUIKitCompat)

+ (NSImage *)imageWithData:(NSData *)data {
  return [[NSImage alloc] initWithData:data];
}

+ (NSImage *)systemImageNamed:(NSString *)name {
  return [NSImage imageWithSystemSymbolName:name accessibilityDescription:nil];
}

@end

#endif // TARGET_OS_OSX
