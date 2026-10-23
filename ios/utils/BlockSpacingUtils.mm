#import "BlockSpacingUtils.h"
#import "interfaces/StyleHeaders.h"
#import "utils/TextListsUtils.h"
#import <vector>

namespace {
struct BlockParagraph {
  NSRange range;
  StyleType type;
  CGFloat marginTop;
  CGFloat marginBottom;
};

struct BlockMarker {
  NSString *prefix;
  StyleType type;
  CGFloat marginTop;
  CGFloat marginBottom;
};
} // namespace

static const StyleType kSpacedBlockTypes[] = {
    H1, H2, H3, H4, H5, H6, UnorderedList, OrderedList, CheckboxList};

// Consecutive items of one list form a single block, while every heading
// paragraph is a block of its own.
static BOOL isSameBlock(const BlockParagraph &previous,
                        const BlockParagraph &next) {
  BOOL isList = previous.type == UnorderedList ||
                previous.type == OrderedList || previous.type == CheckboxList;
  return isList && previous.type == next.type;
}

@implementation BlockSpacingUtils

+ (void)applyBlockSpacingInHost:(id<EnrichedViewHost>)host {
  // Without margins, spacing stays at 0, as every re-render starts from
  // default paragraph styles.
  if (![host.config hasBlockMargins]) {
    return;
  }

  std::vector<BlockParagraph> paragraphs = [self paragraphsInHost:host];
  std::vector<CGFloat> spacingBefore(paragraphs.size(), 0);
  std::vector<CGFloat> spacingAfter(paragraphs.size(), 0);

  for (size_t i = 0; i + 1 < paragraphs.size(); i++) {
    const BlockParagraph &previous = paragraphs[i];
    const BlockParagraph &next = paragraphs[i + 1];
    if (isSameBlock(previous, next)) {
      continue;
    }
    // The gap goes on the block whose margin it is, so that blockquote and
    // code block decorations, drawn over whole line fragments, don't stretch
    // into it.
    if (next.marginTop >= previous.marginBottom) {
      spacingBefore[i + 1] = next.marginTop;
    } else {
      spacingAfter[i] = previous.marginBottom;
    }
  }

  NSTextStorage *textStorage = host.textView.textStorage;
  [textStorage beginEditing];
  for (size_t i = 0; i < paragraphs.size(); i++) {
    NSRange range = paragraphs[i].range;
    if (range.length == 0) {
      continue;
    }
    CGFloat before = spacingBefore[i];
    CGFloat after = spacingAfter[i];
    [textStorage
        enumerateAttribute:NSParagraphStyleAttributeName
                   inRange:range
                   options:0
                usingBlock:^(id _Nullable value, NSRange subRange,
                             BOOL *_Nonnull stop) {
                  NSParagraphStyle *pStyle = (NSParagraphStyle *)value;
                  if (pStyle.paragraphSpacingBefore == before &&
                      pStyle.paragraphSpacing == after) {
                    return;
                  }
                  NSMutableParagraphStyle *newPStyle =
                      pStyle != nil ? [pStyle mutableCopy]
                                    : [[NSMutableParagraphStyle alloc] init];
                  newPStyle.paragraphSpacingBefore = before;
                  newPStyle.paragraphSpacing = after;
                  [textStorage addAttribute:NSParagraphStyleAttributeName
                                      value:newPStyle
                                      range:subRange];
                }];
  }
  [textStorage endEditing];
}

+ (std::vector<BlockParagraph>)paragraphsInHost:(id<EnrichedViewHost>)host {
  NSTextStorage *textStorage = host.textView.textStorage;
  NSString *string = textStorage.string;
  EnrichedConfig *config = host.config;

  std::vector<BlockMarker> markers;
  for (StyleType type : kSpacedBlockTypes) {
    StyleBase *style = (StyleBase *)host.stylesDict[@(type)];
    if (style != nil) {
      markers.push_back({[style getMarkerPrefix] ?: [style getValue],
                         type,
                         [config blockMarginTopForStyle:type],
                         [config blockMarginBottomForStyle:type]});
    }
  }

  std::vector<BlockParagraph> paragraphs;
  NSUInteger location = 0;
  while (location < string.length) {
    NSRange range = [string paragraphRangeForRange:NSMakeRange(location, 0)];
    NSParagraphStyle *pStyle =
        [textStorage attribute:NSParagraphStyleAttributeName
                       atIndex:range.location
                effectiveRange:nil];

    BlockParagraph paragraph = {range, None, 0, 0};
    for (const BlockMarker &marker : markers) {
      if ([TextListsUtils textLists:pStyle.textLists
                     containsPrefix:marker.prefix]) {
        paragraph = {range, marker.type, marker.marginTop, marker.marginBottom};
        break;
      }
    }

    paragraphs.push_back(paragraph);
    location = NSMaxRange(range);
  }

  // A trailing newline leaves an empty last line, which is laid out as one
  // more paragraph.
  if (string.length > 0 &&
      [[NSCharacterSet newlineCharacterSet]
          characterIsMember:[string characterAtIndex:string.length - 1]]) {
    paragraphs.push_back({NSMakeRange(string.length, 0), None, 0, 0});
  }

  return paragraphs;
}

@end
