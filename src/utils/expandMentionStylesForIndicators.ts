import type { HtmlStyle, MentionStyleProperties } from '../types';
import { isMentionStyleRecord } from './isMentionStyleRecord';

export function expandMentionStylesForIndicators(
  mention: HtmlStyle['mention'] | undefined,
  indicators: string[],
  htmlStyleToMergeWith: HtmlStyle
): Record<string, MentionStyleProperties> {
  const out: Record<string, MentionStyleProperties> = {};
  for (const indicator of indicators) {
    out[indicator] = {
      ...htmlStyleToMergeWith.mention,
      ...(isMentionStyleRecord(mention)
        ? (mention[indicator] ?? mention.default ?? {})
        : mention),
    };
  }
  return out;
}
