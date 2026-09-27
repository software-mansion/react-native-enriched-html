import type { CSSProperties } from 'react';
import type { ColorValue } from 'react-native';
import type {
  BaseStyle,
  EnrichedTextHtmlStyle,
  EnrichedTextMentionStyleProperties,
  HtmlStyle,
  MentionStyleProperties,
} from '../../types';
import {
  DEFAULT_ENRICHED_TEXT_STYLE,
  DEFAULT_HTML_STYLE,
} from '../../utils/defaultHtmlStyle';
import { expandMentionStylesForIndicators } from '../../utils/expandMentionStylesForIndicators';
import { HEADING_TAGS } from '../formats/EnrichedHeading';
import {
  indicatorToMentionCssKey,
  MENTION_STYLE_DEFAULT_KEY,
} from './mentionIndicatorCssKey';
import { toColor } from './toColor';
import { isMentionStyleRecord } from '../../utils/isMentionStyleRecord';

export function mergeWithDefaultHtmlStyle(
  htmlStyle?: HtmlStyle,
  htmlStyleToMergeWith: HtmlStyle = DEFAULT_HTML_STYLE
): Required<HtmlStyle> {
  const style = htmlStyle ?? {};

  const mentionMap = expandMentionStylesForIndicatorsIncludeDefault(
    style,
    htmlStyleToMergeWith
  );
  const converted: HtmlStyle = {
    ...style,
    mention: mentionMap,
  };

  const merged: Record<string, unknown> = { ...htmlStyleToMergeWith };

  for (const key in converted) {
    if (key === 'mention') {
      merged[key] = { ...(converted.mention as object) };
      continue;
    }
    merged[key] = {
      ...htmlStyleToMergeWith[key as keyof HtmlStyle],
      ...(converted[key as keyof HtmlStyle] as object),
    };
  }

  return merged as Required<HtmlStyle>;
}

export function mergeWithDefaultEnrichedTextHtmlStyle(
  htmlStyle?: EnrichedTextHtmlStyle
): Required<EnrichedTextHtmlStyle> {
  const style = htmlStyle ?? {};

  const merged = mergeWithDefaultHtmlStyle(
    style as HtmlStyle,
    DEFAULT_ENRICHED_TEXT_STYLE
  );

  const mentionDefaults = DEFAULT_ENRICHED_TEXT_STYLE.mention;
  const passedMentionMap = htmlStyle?.mention;
  const mergedMentionMap = merged.mention as Record<
    string,
    EnrichedTextMentionStyleProperties
  >;
  const mention: Record<string, EnrichedTextMentionStyleProperties> = {};
  for (const indicator in mergedMentionMap) {
    mention[indicator] = {
      ...mentionDefaults,
      ...(isMentionStyleRecord(passedMentionMap)
        ? (passedMentionMap[indicator] ??
          passedMentionMap[MENTION_STYLE_DEFAULT_KEY])
        : passedMentionMap),
    };
  }

  return {
    ...merged,
    mention,
  } as Required<EnrichedTextHtmlStyle>;
}

const ET_CSS_VARS = {
  codeColor: '--et-code-color',
  codeBgColor: '--et-code-bg-color',
  blockquoteBorderColor: '--et-blockquote-border-color',
  blockquoteBorderWidth: '--et-blockquote-border-width',
  blockquoteGapWidth: '--et-blockquote-gap-width',
  blockquoteColor: '--et-blockquote-color',
  codeblockBgColor: '--et-codeblock-bg-color',
  codeblockColor: '--et-codeblock-color',
  codeblockBorderRadius: '--et-codeblock-border-radius',
  linkColor: '--et-link-color',
  linkPressColor: '--et-link-press-color',
  ulBulletColor: '--et-ul-bullet-color',
  ulBulletSize: '--et-ul-bullet-size',
  ulMarginLeft: '--et-ul-margin-left',
  ulGapWidth: '--et-ul-gap-width',
  olMarginLeft: '--et-ol-margin-left',
  olGapWidth: '--et-ol-gap-width',
  olMarkerColor: '--et-ol-marker-color',
  olMarkerFontWeight: '--et-ol-marker-font-weight',
  checkboxBoxSize: '--et-checkbox-box-size',
  checkboxGapWidth: '--et-checkbox-gap-width',
  checkboxMarginLeft: '--et-checkbox-margin-left',
  checkboxBoxColor: '--et-checkbox-box-color',
} as const;

export const ET_MENTION_CSS_VARS = {
  color: (indicator: string) =>
    `--et-mention-${indicatorToMentionCssKey(indicator)}-color`,
  backgroundColor: (indicator: string) =>
    `--et-mention-${indicatorToMentionCssKey(indicator)}-background-color`,
  textDecorationLine: (indicator: string) =>
    `--et-mention-${indicatorToMentionCssKey(indicator)}-text-decoration-line`,
} as const;

function setColorVar(
  vars: Record<string, string>,
  name: string,
  value?: ColorValue
): void {
  const c = toColor(value);
  if (c) vars[name] = c;
}

function setPxVar(
  vars: Record<string, string>,
  name: string,
  n?: number | null
): void {
  if (n != null) vars[name] = `${n}px`;
}

function setFontWeightVar(
  vars: Record<string, string>,
  prefix: string,
  bold?: boolean
): void {
  if (bold === true) vars[`--et-${prefix}-font-weight`] = 'bold';
}

function setFontStyleVar(
  vars: Record<string, string>,
  prefix: string,
  italic?: boolean
): void {
  if (italic === true) vars[`--et-${prefix}-font-style`] = 'italic';
}

function setTextDecorationVar(
  vars: Record<string, string>,
  prefix: string,
  base?: Pick<BaseStyle, 'underline' | 'strikethrough'>
): void {
  if (base?.underline !== true && base?.strikethrough !== true) return;
  const lines: string[] = [];
  if (base?.underline || prefix === 'underline') lines.push('underline');
  if (base?.strikethrough || prefix === 'strikethrough')
    lines.push('line-through');

  if (lines.length > 0)
    vars[`--et-${prefix}-text-decoration-line`] = lines.join(' ');
}

function applyBaseStyleVars(
  vars: Record<string, string>,
  prefix: string,
  base?: BaseStyle
): void {
  setFontWeightVar(vars, prefix, base?.bold);
  setFontStyleVar(vars, prefix, base?.italic);
  setTextDecorationVar(vars, prefix, base);
}

function applyCodeVars(
  vars: Record<string, string>,
  code?: HtmlStyle['code']
): void {
  setColorVar(vars, ET_CSS_VARS.codeColor, code?.color);
  setColorVar(vars, ET_CSS_VARS.codeBgColor, code?.backgroundColor);
  applyBaseStyleVars(vars, 'code', code);
}

function applyHeadingVars(
  vars: Record<string, string>,
  htmlStyle?: HtmlStyle
): void {
  for (const level of HEADING_TAGS) {
    const h = htmlStyle?.[level];
    if (h?.fontSize != null)
      vars[`--et-${level}-font-size`] = `${h.fontSize}px`;
    applyBaseStyleVars(vars, level, h);
  }
}

function applyBlockquoteVars(
  vars: Record<string, string>,
  bq?: HtmlStyle['blockquote']
): void {
  setColorVar(vars, ET_CSS_VARS.blockquoteBorderColor, bq?.borderColor);
  setPxVar(vars, ET_CSS_VARS.blockquoteBorderWidth, bq?.borderWidth);
  setPxVar(vars, ET_CSS_VARS.blockquoteGapWidth, bq?.gapWidth);
  setColorVar(vars, ET_CSS_VARS.blockquoteColor, bq?.color);
  applyBaseStyleVars(vars, 'blockquote', bq);
}

function applyCodeblockVars(
  vars: Record<string, string>,
  cb?: HtmlStyle['codeblock']
): void {
  setColorVar(vars, ET_CSS_VARS.codeblockBgColor, cb?.backgroundColor);
  setColorVar(vars, ET_CSS_VARS.codeblockColor, cb?.color);
  setPxVar(vars, ET_CSS_VARS.codeblockBorderRadius, cb?.borderRadius);
  applyBaseStyleVars(vars, 'codeblock', cb);
}

function applyLinkVars(
  vars: Record<string, string>,
  anchor?: HtmlStyle['a']
): void {
  applyBaseStyleVars(vars, 'link', anchor);
  setColorVar(vars, ET_CSS_VARS.linkColor, anchor?.color);
  setColorVar(vars, ET_CSS_VARS.linkPressColor, anchor?.pressColor);
}

function applyUnorderedListVars(
  vars: Record<string, string>,
  ul?: HtmlStyle['ul']
): void {
  setColorVar(vars, ET_CSS_VARS.ulBulletColor, ul?.bulletColor);
  setPxVar(vars, ET_CSS_VARS.ulBulletSize, ul?.bulletSize);
  setPxVar(vars, ET_CSS_VARS.ulMarginLeft, ul?.marginLeft);
  setPxVar(vars, ET_CSS_VARS.ulGapWidth, ul?.gapWidth);
  applyBaseStyleVars(vars, 'ul', ul);
}

function applyOrderedListVars(
  vars: Record<string, string>,
  ol?: HtmlStyle['ol']
): void {
  setPxVar(vars, ET_CSS_VARS.olMarginLeft, ol?.marginLeft);
  setPxVar(vars, ET_CSS_VARS.olGapWidth, ol?.gapWidth);
  setColorVar(vars, ET_CSS_VARS.olMarkerColor, ol?.markerColor);
  if (ol?.markerFontWeight != null) {
    vars[ET_CSS_VARS.olMarkerFontWeight] = String(ol.markerFontWeight);
  }
  applyBaseStyleVars(vars, 'ol', ol);
}

function applyCheckboxListVars(
  vars: Record<string, string>,
  ulCheckbox?: HtmlStyle['ulCheckbox']
): void {
  setPxVar(vars, ET_CSS_VARS.checkboxBoxSize, ulCheckbox?.boxSize);
  setPxVar(vars, ET_CSS_VARS.checkboxGapWidth, ulCheckbox?.gapWidth);
  setPxVar(vars, ET_CSS_VARS.checkboxMarginLeft, ulCheckbox?.marginLeft);
  setColorVar(vars, ET_CSS_VARS.checkboxBoxColor, ulCheckbox?.boxColor);
  applyBaseStyleVars(vars, 'checkbox', ulCheckbox);
}

function applyBoldVars(
  vars: Record<string, string>,
  bold?: HtmlStyle['bold']
): void {
  applyBaseStyleVars(vars, 'bold', bold);
}

function applyItalicVars(
  vars: Record<string, string>,
  italic?: HtmlStyle['italic']
): void {
  applyBaseStyleVars(vars, 'italic', italic);
}

function applyUnderlineVars(
  vars: Record<string, string>,
  underline?: HtmlStyle['underline']
): void {
  applyBaseStyleVars(vars, 'underline', underline);
}

function applyStrikethroughVars(
  vars: Record<string, string>,
  strikethrough?: HtmlStyle['strikethrough']
): void {
  applyBaseStyleVars(vars, 'strikethrough', strikethrough);
}

function applyMentionVars(
  vars: Record<string, string>,
  mention: Record<string, MentionStyleProperties>
): void {
  if (!mention) return;

  for (const [indicator, mentionStyle] of Object.entries(mention)) {
    setColorVar(vars, ET_MENTION_CSS_VARS.color(indicator), mentionStyle.color);
    setColorVar(
      vars,
      ET_MENTION_CSS_VARS.backgroundColor(indicator),
      mentionStyle.backgroundColor
    );
    if (mentionStyle.underline != null) {
      vars[ET_MENTION_CSS_VARS.textDecorationLine(indicator)] =
        mentionStyle.underline ? 'underline' : 'none';
    }
  }
}

function expandMentionStylesForIndicatorsIncludeDefault(
  htmlStyle: HtmlStyle,
  htmlStyleToMergeWith: HtmlStyle
) {
  const mentionIndicators = isMentionStyleRecord(htmlStyle?.mention)
    ? Object.keys(htmlStyle?.mention)
    : [];

  if (!mentionIndicators.includes(MENTION_STYLE_DEFAULT_KEY))
    mentionIndicators.push(MENTION_STYLE_DEFAULT_KEY);

  return expandMentionStylesForIndicators(
    htmlStyle?.mention,
    mentionIndicators,
    htmlStyleToMergeWith
  );
}

export function htmlStyleToCSSVariables(htmlStyle: HtmlStyle): CSSProperties {
  const vars: Record<string, string> = {};
  applyBoldVars(vars, htmlStyle.bold);
  applyItalicVars(vars, htmlStyle.italic);
  applyUnderlineVars(vars, htmlStyle.underline);
  applyStrikethroughVars(vars, htmlStyle.strikethrough);
  applyCodeVars(vars, htmlStyle.code);
  applyHeadingVars(vars, htmlStyle);
  applyBlockquoteVars(vars, htmlStyle.blockquote);
  applyCodeblockVars(vars, htmlStyle.codeblock);
  applyLinkVars(vars, htmlStyle.a);
  applyUnorderedListVars(vars, htmlStyle.ul);
  applyOrderedListVars(vars, htmlStyle.ol);
  applyCheckboxListVars(vars, htmlStyle.ulCheckbox);
  applyMentionVars(
    vars,
    htmlStyle.mention as Record<string, MentionStyleProperties>
  );
  return vars as CSSProperties;
}

export const ET_MENTION_PRESS_CSS_VARS = {
  pressColor: (indicator: string) =>
    `--et-mention-${indicatorToMentionCssKey(indicator)}-press-color`,
  pressBackgroundColor: (indicator: string) =>
    `--et-mention-${indicatorToMentionCssKey(indicator)}-press-background-color`,
} as const;

const DEFAULT_MENTION_PRESS =
  DEFAULT_ENRICHED_TEXT_STYLE.mention as EnrichedTextMentionStyleProperties;

function expandVarsWithEnrichedTextMention(
  vars: Record<string, string>,
  mention?: EnrichedTextHtmlStyle['mention']
): void {
  const isStyleRecord = isMentionStyleRecord(mention);

  const mentionIndicators = isStyleRecord ? Object.keys(mention) : [];

  if (!mentionIndicators.includes(MENTION_STYLE_DEFAULT_KEY))
    mentionIndicators.push(MENTION_STYLE_DEFAULT_KEY);

  for (const indicator of mentionIndicators) {
    const style = isStyleRecord ? mention?.[indicator] : mention;

    setColorVar(
      vars,
      ET_MENTION_PRESS_CSS_VARS.pressColor(indicator),
      style?.pressColor ??
        (isStyleRecord ? mention.default?.pressColor : undefined) ??
        DEFAULT_MENTION_PRESS.pressColor
    );
    setColorVar(
      vars,
      ET_MENTION_PRESS_CSS_VARS.pressBackgroundColor(indicator),
      style?.pressBackgroundColor ??
        (isStyleRecord ? mention.default?.pressBackgroundColor : undefined) ??
        DEFAULT_MENTION_PRESS.pressBackgroundColor
    );
  }
}

function expandCSSPropertiesWithEnrichedTextHtmlStyle(
  htmlStyle: EnrichedTextHtmlStyle | undefined,
  cssProperties: CSSProperties
): CSSProperties {
  const vars = { ...cssProperties } as Record<string, string>;
  expandVarsWithEnrichedTextMention(vars, htmlStyle?.mention);
  return vars as CSSProperties;
}

export function enrichedTextHtmlStyleToCSSVariables(
  htmlStyle: EnrichedTextHtmlStyle
): CSSProperties {
  const vars = htmlStyleToCSSVariables(htmlStyle);
  return expandCSSPropertiesWithEnrichedTextHtmlStyle(htmlStyle, vars);
}
