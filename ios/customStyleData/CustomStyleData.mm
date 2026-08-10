#import "CustomStyleData.h"

@implementation CustomStyleData

- (BOOL)isEmpty {
  return _foregroundColor == nil && _backgroundColor == nil &&
         _fontSize == nil && _fontFamily == nil;
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
  id fsVal = dict[@"fontSize"];
  if (fsVal != nil) {
    if ([fsVal isKindOfClass:[NSNumber class]] &&
        [(NSNumber *)fsVal doubleValue] > 0) {
      self.fontSize = (NSNumber *)fsVal;
    } else {
      self.fontSize = nil;
    }
  }
  id ffVal = dict[@"fontFamily"];
  if (ffVal != nil) {
    self.fontFamily =
        [ffVal isKindOfClass:[NSString class]] ? (NSString *)ffVal : nil;
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
  BOOL fsEqual = (_fontSize == other.fontSize) ||
                 (_fontSize != nil && other.fontSize != nil &&
                  [_fontSize isEqualToNumber:other.fontSize]);
  BOOL ffEqual = (_fontFamily == other.fontFamily) ||
                 [_fontFamily isEqualToString:other.fontFamily];
  return fgEqual && bgEqual && fsEqual && ffEqual;
}

- (NSUInteger)hash {
  return [_foregroundColor hash] ^ [_backgroundColor hash] ^ [_fontSize hash] ^
         [_fontFamily hash];
}

- (id)copyWithZone:(NSZone *)zone {
  CustomStyleData *copy = [[CustomStyleData allocWithZone:zone] init];
  copy.foregroundColor = self.foregroundColor;
  copy.backgroundColor = self.backgroundColor;
  copy.fontSize = self.fontSize;
  copy.fontFamily = self.fontFamily;
  return copy;
}

@end
