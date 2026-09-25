#import "InlineStyleConfig.h"

@implementation InlineStyleConfig

- (id)copyWithZone:(NSZone *)zone {
  InlineStyleConfig *copy = [[[self class] allocWithZone:zone] init];
  copy.bold = _bold;
  copy.italic = _italic;
  copy.underline = _underline;
  copy.strikethrough = _strikethrough;
  return copy;
}

@end
