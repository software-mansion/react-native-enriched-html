import type { HtmlStyle } from '../types';
import { isMentionStyleRecord } from './isMentionStyleRecord';

export const normalizeDeprecatedFields = (style: HtmlStyle): HtmlStyle => {
  if (style.a?.textDecorationLine === 'underline') style.a.underline = true;

  if (isMentionStyleRecord(style.mention)) {
    for (const key in style.mention) {
      if (style.mention[key]?.textDecorationLine === 'underline')
        style.mention[key].underline = true;
    }
  } else {
    if (style.mention?.textDecorationLine === 'underline')
      style.mention.underline = true;
  }

  return style;
};
