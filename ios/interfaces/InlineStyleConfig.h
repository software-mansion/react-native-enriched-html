#pragma once
#import <Foundation/Foundation.h>

@interface InlineStyleConfig : NSObject <NSCopying>
@property(nonatomic) BOOL bold;
@property(nonatomic) BOOL italic;
@property(nonatomic) BOOL underline;
@property(nonatomic) BOOL strikethrough;
@end
