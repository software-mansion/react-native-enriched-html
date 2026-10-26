#pragma once
#import "interfaces/EnrichedViewHost.h"
#import <UIKit/UIKit.h>

// Applies the configured heading and list margins as paragraph spacing.
// Adjacent margins collapse into the larger one and the first and last blocks
// get no outer space. Only paragraph styles change, never the characters, so
// the HTML, the plain text and selection offsets stay the same.
@interface BlockSpacingUtils : NSObject
+ (void)applyBlockSpacingInHost:(id<EnrichedViewHost>)host;
@end
