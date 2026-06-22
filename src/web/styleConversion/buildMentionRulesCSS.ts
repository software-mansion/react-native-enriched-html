import type {
  EnrichedTextHtmlStyle,
  HtmlStyle,
  MentionStyleProperties,
} from '../../types';
import { isMentionStyleRecord } from '../../utils/isMentionStyleRecord';
import {
  ENRICHED_TEXT_CLASSNAME,
  ENRICHED_TEXT_INPUT_CLASSNAME,
} from '../constants/classNames';
import { ET_MENTION_CSS_VARS } from './htmlStyleToCSSVariables';
import { MENTION_STYLE_DEFAULT_KEY } from './mentionIndicatorCssKey';

function escapeIndicatorForCssAttributeSelector(indicator: string): string {
  if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') {
    return CSS.escape(indicator);
  }
  return indicator.replace(/["\\]/g, '\\$&');
}

function mentionSelector(className: string, indicator: string): string {
  return indicator === MENTION_STYLE_DEFAULT_KEY
    ? `.${className} mention`
    : `.${className} mention[indicator="${escapeIndicatorForCssAttributeSelector(indicator)}"]`;
}

export function buildMentionRulesCSS(
  htmlStyle?: HtmlStyle | EnrichedTextHtmlStyle
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

  const lines: string[] = [];

  for (const indicator of keys) {
    const inputSelector = mentionSelector(
      ENRICHED_TEXT_INPUT_CLASSNAME,
      indicator
    );
    const textSelector = mentionSelector(ENRICHED_TEXT_CLASSNAME, indicator);

    lines.push(
      `${inputSelector},
${textSelector} {
  color: var(${ET_MENTION_CSS_VARS.color(indicator)});
  background-color: var(${ET_MENTION_CSS_VARS.backgroundColor(indicator)});
  text-decoration-line: var(${ET_MENTION_CSS_VARS.textDecorationLine(indicator)});
}`.trim()
    );
  }

  return lines.join('\n');
}
