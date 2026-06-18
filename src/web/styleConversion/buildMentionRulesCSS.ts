import type { HtmlStyle, MentionStyleProperties } from '../../types';
import { isMentionStyleRecord } from '../../utils/isMentionStyleRecord';
import {
  ENRICHED_TEXT_CLASSNAME,
  ENRICHED_TEXT_INPUT_CLASSNAME,
} from '../consts/classNames';
import { ET_MENTION_CSS_VARS } from './htmlStyleToCSSVariables';
import { MENTION_STYLE_DEFAULT_KEY } from './mentionIndicatorCssKey';

function escapeIndicatorForCssAttributeSelector(indicator: string): string {
  if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') {
    return CSS.escape(indicator);
  }
  return indicator.replace(/["\\]/g, '\\$&');
}

export function buildMentionRulesCSS(
  component: 'input' | 'text',
  htmlStyle?: HtmlStyle
): string {
  const mapRaw = htmlStyle?.mention;
  if (!mapRaw || typeof mapRaw !== 'object' || !isMentionStyleRecord(mapRaw)) {
    return '';
  }

  const map: Record<string, MentionStyleProperties> = mapRaw;
  const keys = Object.keys(map);
  if (keys.length === 0) {
    return '';
  }

  const className =
    component === 'input'
      ? ENRICHED_TEXT_INPUT_CLASSNAME
      : ENRICHED_TEXT_CLASSNAME;

  const lines: string[] = [];
  for (const indicator of keys) {
    const selector =
      indicator === MENTION_STYLE_DEFAULT_KEY
        ? `.${className} mention`
        : `.${className} mention[indicator="${escapeIndicatorForCssAttributeSelector(indicator)}"]`;

    lines.push(
      `${selector} {
  color: var(${ET_MENTION_CSS_VARS.color(indicator)});
  background-color: var(${ET_MENTION_CSS_VARS.backgroundColor(indicator)});
  text-decoration-line: var(${ET_MENTION_CSS_VARS.textDecorationLine(indicator)});
}`.trim()
    );
  }

  return lines.join('\n');
}
