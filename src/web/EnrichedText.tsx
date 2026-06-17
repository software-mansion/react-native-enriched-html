import type { EnrichedTextProps } from '../types';

export const EnrichedText = ({ children }: EnrichedTextProps) => {
  return <div dangerouslySetInnerHTML={{ __html: children }} />;
};
