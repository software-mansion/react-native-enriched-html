#import "CustomStyleData.h"

@implementation CustomStyleData

- (BOOL)isEmpty {
  return _foregroundColor == nil && _backgroundColor == nil;
}

- (void)mergeFromDict:(NSDictionary *)dict {
  id fgVal = dict[@"foregroundColor"];
  if (fgVal != nil) {
    self.foregroundColor =
        [fgVal isKindOfClass:[UIColor class]] ? (UIColor *)fgVal : nil;
  }
  id bgVal = dict[@"backgroundColor"];
  if (bgVal != nil) {
    self.backgroundColor =
        [bgVal isKindOfClass:[UIColor class]] ? (UIColor *)bgVal : nil;
  }
}

- (BOOL)isEqual:(id)object {
  if (self == object)
    return YES;
  if (![object isKindOfClass:[CustomStyleData class]])
    return NO;
  CustomStyleData *other = (CustomStyleData *)object;
  BOOL fgEqual = (_foregroundColor == other.foregroundColor) ||
                 [_foregroundColor isEqual:other.foregroundColor];
  BOOL bgEqual = (_backgroundColor == other.backgroundColor) ||
                 [_backgroundColor isEqual:other.backgroundColor];
  return fgEqual && bgEqual;
}

- (NSUInteger)hash {
  return [_foregroundColor hash] ^ [_backgroundColor hash];
}

- (id)copyWithZone:(NSZone *)zone {
  CustomStyleData *copy = [[CustomStyleData allocWithZone:zone] init];
  copy.foregroundColor = self.foregroundColor;
  copy.backgroundColor = self.backgroundColor;
  return copy;
}

@end
