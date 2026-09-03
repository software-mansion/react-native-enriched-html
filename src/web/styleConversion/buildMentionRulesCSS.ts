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
import {
  ET_MENTION_CSS_VARS,
  ET_MENTION_PRESS_CSS_VARS,
} from './htmlStyleToCSSVariables';
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
  htmlStyle?: HtmlStyle | EnrichedTextHtmlStyle,
  isInteractible?: boolean
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

  // Base mention styling - shared by the editable input and the read-only view.
  for (const indicator of keys) {
    const inputSelector = mentionSelector(
      ENRICHED_TEXT_INPUT_CLASSNAME,
      indicator
    );
    const textSelector = mentionSelector(ENRICHED_TEXT_CLASSNAME, indicator);

    lines.push(
      `${inputSelector},
${textSelector} {
  color: var(${ET_MENTION_CSS_VARS.color(indicator)}, var(${ET_MENTION_CSS_VARS.color(MENTION_STYLE_DEFAULT_KEY)}));
  background-color: var(${ET_MENTION_CSS_VARS.backgroundColor(indicator)}, var(${ET_MENTION_CSS_VARS.backgroundColor(MENTION_STYLE_DEFAULT_KEY)}));
  text-decoration-line: var(${ET_MENTION_CSS_VARS.textDecorationLine(indicator)}, var(${ET_MENTION_CSS_VARS.textDecorationLine(MENTION_STYLE_DEFAULT_KEY)}));
  transition: none;
}`.trim()
    );
  }

  // Press-state styling - only the read-only EnrichedText handles presses.

  if (isInteractible) {
    lines.push(
      `${mentionSelector(ENRICHED_TEXT_CLASSNAME, MENTION_STYLE_DEFAULT_KEY)} {
  cursor: pointer;
}`.trim()
    );
  }

  for (const indicator of keys) {
    const textSelector = mentionSelector(ENRICHED_TEXT_CLASSNAME, indicator);

    lines.push(
      `${textSelector}:active {
  color: var(${ET_MENTION_PRESS_CSS_VARS.pressColor(indicator)}, var(${ET_MENTION_PRESS_CSS_VARS.pressColor(MENTION_STYLE_DEFAULT_KEY)}));
  background-color: var(${ET_MENTION_PRESS_CSS_VARS.pressBackgroundColor(indicator)}, var(${ET_MENTION_PRESS_CSS_VARS.pressBackgroundColor(MENTION_STYLE_DEFAULT_KEY)}));
}`.trim()
    );
  }

  return lines.join('\n');
}
