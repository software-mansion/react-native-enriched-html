#pragma once
#include <TargetConditionals.h>

// Cross-platform UIKit/AppKit compatibility layer. Every header in the
// library imports this instead of <UIKit/UIKit.h> so the same sources
// compile on iOS and on macOS (react-native-macos).

#if !TARGET_OS_OSX

#import <UIKit/UIKit.h>

// The platform text view every host component builds upon.
typedef UITextView EnrichedBaseTextView;

NS_INLINE void EnrichedRectFill(CGRect rect) { UIRectFill(rect); }

NS_INLINE CGFloat EnrichedFontLineHeight(UIFont *font) {
  return font.lineHeight;
}

NS_INLINE CGFloat EnrichedFontScaledValue(CGFloat value) {
  return [[UIFontMetrics defaultMetrics] scaledValueForValue:value];
}

NS_INLINE void EnrichedDrawImageInRect(UIImage *image, CGRect rect) {
  [image drawInRect:rect];
}

NS_INLINE void EnrichedBringSubviewToFront(UIView *parent, UIView *child) {
  [parent bringSubviewToFront:child];
}

@interface UITextView (EnrichedUIKitCompat)

// UIKit/AppKit-neutral accessors used by code shared between platforms.
@property(nonatomic, readonly) UIEdgeInsets enrichedTextContainerInset;
@property(nonatomic, readonly) BOOL enrichedHasMarkedText;
@property(nonatomic, readonly) BOOL enrichedIsFirstResponder;

- (void)enrichedEndEditing;
- (void)enrichedSetTintColor:(nullable UIColor *)color;

@end

#else // TARGET_OS_OSX

#import <AppKit/AppKit.h>

#ifdef __cplusplus
extern "C" {
#endif
#import <React/RCTUIKit.h>
#ifdef __cplusplus
}
#endif

// RCTUIKit.h aliases UIFont/UIFontDescriptor/UIBezierPath/UIViewController and
// typedefs UIEdgeInsets, but leaves the rest to consumers.
@compatibility_alias UIColor NSColor;
@compatibility_alias UIImage NSImage;
@compatibility_alias UIImageView NSImageView;
// Not RCTUILabel: its `text` property only implements the setter (the
// auto-synthesized getter returns nil, never the stringValue), which breaks
// shared code that reads label.text. The category below provides both
// accessors on top of a plain NSTextField.
@compatibility_alias UILabel NSTextField;
@compatibility_alias UIView NSView;

typedef NSTextView EnrichedBaseTextView;

// Mirrors UIKit's UIRectCorner bit values.
typedef NS_OPTIONS(NSUInteger, UIRectCorner) {
  UIRectCornerTopLeft = 1 << 0,
  UIRectCornerTopRight = 1 << 1,
  UIRectCornerBottomLeft = 1 << 2,
  UIRectCornerBottomRight = 1 << 3,
  UIRectCornerAllCorners = ~0UL,
};

NS_INLINE CGFloat EnrichedFontScaledValue(CGFloat value) {
  // Dynamic Type does not exist on macOS.
  return value;
}

NS_INLINE CGFloat EnrichedFontLineHeight(NSFont *font) {
  return UIFontLineHeight(font);
}

#ifdef __cplusplus
extern "C" {
#endif
void EnrichedRectFill(CGRect rect);
void EnrichedDrawImageInRect(NSImage *image, CGRect rect);
void EnrichedBringSubviewToFront(NSView *parent, NSView *child);
#ifdef __cplusplus
}
#endif

@interface NSTextView (EnrichedUIKitCompat)

// UITextView.text
@property(nonatomic, copy, nullable) NSString *text;

// UITextView.scrollEnabled — forwards to the enclosing NSScrollView.
@property(nonatomic, assign, getter=isScrollEnabled) BOOL scrollEnabled;

// UITextView.textContainerInset expressed as UIEdgeInsets. NSTextView's own
// textContainerInset is a symmetric NSSize; the real drawing origin is
// textContainerOrigin.
@property(nonatomic, readonly) UIEdgeInsets enrichedTextContainerInset;

// UITextView.markedTextRange != nil
@property(nonatomic, readonly) BOOL enrichedHasMarkedText;

// UIResponder.isFirstResponder
@property(nonatomic, readonly) BOOL enrichedIsFirstResponder;

// UIView.endEditing:
- (void)enrichedEndEditing;

// UITextView.tintColor — maps to insertion point + selection highlight.
- (void)enrichedSetTintColor:(nullable NSColor *)color;

@end

@interface NSTextField (EnrichedUIKitCompat)

// UILabel.text
@property(nonatomic, copy, nullable) NSString *text;

// UILabel.attributedText
@property(nonatomic, copy, nullable) NSAttributedString *attributedText;

@end

// Placeholder label that is transparent to mouse events. UILabel has
// userInteractionEnabled == NO by default, but NSTextField is an NSControl
// that participates in hit-testing and swallows every mouseDown — placed on
// top of the text view it would block clicks from ever focusing the input.
@interface EnrichedPlaceholderLabel : NSTextField
@end

@interface NSImage (EnrichedUIKitCompat)

+ (nullable NSImage *)imageWithData:(nonnull NSData *)data;
+ (nullable NSImage *)systemImageNamed:(nonnull NSString *)name;

@end

#endif // TARGET_OS_OSX

#ifdef __cplusplus
extern "C" {
#endif
// UIBezierPath bezierPathWithRoundedRect:byRoundingCorners:cornerRadii: has no
// AppKit equivalent, so both platforms go through this helper.
UIBezierPath *_Nonnull EnrichedRoundedRectPath(CGRect rect,
                                               UIRectCorner corners,
                                               CGFloat radius);
#ifdef __cplusplus
}
#endif
