#import "CheckboxHitTestUtils.h"
#import "EnrichedTextInputView.h"
#import "config/EnrichedConfig.h"
#import "interfaces/StyleHeaders.h"
#import "utils/TextListsUtils.h"

static const CGFloat kCheckboxHitSlopLeft = 8.0;
static const CGFloat kCheckboxHitSlopVertical = 6.0;

@implementation CheckboxHitTestUtils

// MARK: - Coordinate helpers

+ (CGPoint)containerPointFromViewPoint:(CGPoint)point
                              textView:(UITextView *)textView {
  return CGPointMake(point.x - textView.textContainerInset.left,
                     point.y - textView.textContainerInset.top);
}

// MARK: - Glyph lookup

+ (NSUInteger)glyphIndexAtContainerPoint:(CGPoint)point
                                textView:(UITextView *)textView {
  return [textView.layoutManager glyphIndexForPoint:point
                                    inTextContainer:textView.textContainer
                     fractionOfDistanceThroughGlyph:nil];
}

// MARK: - Checkbox detection

+ (BOOL)isCheckboxGlyph:(NSUInteger)glyphIndex
                inInput:(EnrichedTextInputView *)input {
  UITextView *textView = input->textView;
  NSLayoutManager *layoutManager = textView.layoutManager;
  NSTextStorage *storage = textView.textStorage;

  NSUInteger charIndex =
      [layoutManager characterIndexForGlyphAtIndex:glyphIndex];

  if (charIndex >= storage.length) {
    return NO;
  }

  CheckboxListStyle *checkboxListStyle =
      (CheckboxListStyle *)input->stylesDict[@([CheckboxListStyle getType])];

  if (!checkboxListStyle) {
    return NO;
  }

  return [checkboxListStyle detect:NSMakeRange(charIndex, 0)];
}

// MARK: - Checkbox rect

// the checkbox list might be nested, so we need to add the
// ancestor lists' cumulative margins to properly draw the checkbox
+ (CGFloat)ancestorHeadIndentForCharIndex:(NSUInteger)charIndex
                                  inInput:(EnrichedTextInputView *)input {
  NSTextStorage *storage = input->textView.textStorage;
  if (charIndex >= storage.length) {
    return 0;
  }

  NSParagraphStyle *pStyle = [storage attribute:NSParagraphStyleAttributeName
                                        atIndex:charIndex
                                 effectiveRange:NULL];
  NSArray<NSTextList *> *chain =
      [TextListsUtils listChainInArray:pStyle.textLists];
  if (chain.count <= 1) {
    return 0;
  }

  NSArray<NSTextList *> *ancestorChain =
      [chain subarrayWithRange:NSMakeRange(0, chain.count - 1)];

  ListStyleBase *checkboxListStyle =
      (ListStyleBase *)input->stylesDict[@([CheckboxListStyle getType])];

  return checkboxListStyle
             ? [checkboxListStyle cumulativeHeadIndentForChain:ancestorChain]
             : 0;
}

+ (CGRect)checkboxRectForGlyphIndex:(NSUInteger)glyphIndex
                            inInput:(EnrichedTextInputView *)input {
  UITextView *textView = input->textView;
  NSLayoutManager *layoutManager = textView.layoutManager;
  EnrichedConfig *config = input->config;

  if (!config) {
    return CGRectNull;
  }

  NSUInteger charIndex =
      [layoutManager characterIndexForGlyphAtIndex:glyphIndex];
  CGFloat ancestorIndent = [self ancestorHeadIndentForCharIndex:charIndex
                                                        inInput:input];

  CGRect lineRect = [layoutManager lineFragmentRectForGlyphAtIndex:glyphIndex
                                                    effectiveRange:nil];

  CGFloat originX =
      lineRect.origin.x + ancestorIndent + config.checkboxListMarginLeft;

  CGFloat originY = lineRect.origin.y +
                    (lineRect.size.height - config.checkboxListBoxSize) / 2.0;

  return CGRectMake(originX, originY, config.checkboxListBoxSize,
                    config.checkboxListBoxSize);
}

// MARK: - Hit rect

+ (CGRect)expandedHitRectFromCheckboxRect:(CGRect)rect {
  if (CGRectIsNull(rect))
    return rect;

  return CGRectInset(rect, -kCheckboxHitSlopLeft, -kCheckboxHitSlopVertical);
}

// MARK: - Public API

+ (NSInteger)hitTestCheckboxAtPoint:(CGPoint)point
                            inInput:(EnrichedTextInputView *)input {
  UITextView *textView = input->textView;

  CGPoint containerPoint = [self containerPointFromViewPoint:point
                                                    textView:textView];

  NSUInteger glyphIndex = [self glyphIndexAtContainerPoint:containerPoint
                                                  textView:textView];

  if (glyphIndex == NSNotFound) {
    return -1;
  }

  if (![self isCheckboxGlyph:glyphIndex inInput:input]) {
    return -1;
  }

  CGRect checkboxRect = [self checkboxRectForGlyphIndex:glyphIndex
                                                inInput:input];

  if (CGRectIsNull(checkboxRect)) {
    return -1;
  }

  CGRect hitRect = [self expandedHitRectFromCheckboxRect:checkboxRect];

  if (!CGRectContainsPoint(hitRect, containerPoint)) {
    return -1;
  }

  return [textView.layoutManager characterIndexForGlyphAtIndex:glyphIndex];
}

@end
