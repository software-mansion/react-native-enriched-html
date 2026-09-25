import type { HtmlStyle, EnrichedTextHtmlStyle, BaseStyle } from '../types';

export const DEFAULT_BASE_STYLE: Required<BaseStyle> = {
  bold: false,
  italic: false,
  underline: false,
  strikethrough: false,
};

export const DEFAULT_HTML_STYLE: Required<HtmlStyle> = {
  bold: {
    ...DEFAULT_BASE_STYLE,
  },
  italic: {
    ...DEFAULT_BASE_STYLE,
  },
  underline: {
    ...DEFAULT_BASE_STYLE,
  },
  strikethrough: {
    ...DEFAULT_BASE_STYLE,
  },
  h1: {
    fontSize: 32,
    ...DEFAULT_BASE_STYLE,
  },
  h2: {
    fontSize: 24,
    ...DEFAULT_BASE_STYLE,
  },
  h3: {
    fontSize: 20,
    ...DEFAULT_BASE_STYLE,
  },
  h4: {
    fontSize: 16,
    ...DEFAULT_BASE_STYLE,
  },
  h5: {
    fontSize: 14,
    ...DEFAULT_BASE_STYLE,
  },
  h6: {
    fontSize: 12,
    ...DEFAULT_BASE_STYLE,
  },
  blockquote: {
    borderColor: 'darkgray',
    borderWidth: 4,
    gapWidth: 16,
    color: undefined,
    ...DEFAULT_BASE_STYLE,
  },
  codeblock: {
    color: 'black',
    borderRadius: 8,
    backgroundColor: 'darkgray',
    ...DEFAULT_BASE_STYLE,
  },
  code: {
    color: 'red',
    backgroundColor: 'darkgray',
    ...DEFAULT_BASE_STYLE,
  },
  a: {
    color: 'blue',
    textDecorationLine: 'underline',
    pressColor: 'darkblue',
    ...DEFAULT_BASE_STYLE,
  },
  mention: {
    color: 'blue',
    backgroundColor: 'yellow',
    textDecorationLine: 'underline',
    ...DEFAULT_BASE_STYLE,
  },
  ol: {
    gapWidth: 16,
    marginLeft: 16,
    markerFontWeight: undefined,
    markerColor: undefined,
    ...DEFAULT_BASE_STYLE,
  },
  ul: {
    bulletColor: 'black',
    bulletSize: 8,
    marginLeft: 16,
    gapWidth: 16,
    ...DEFAULT_BASE_STYLE,
  },
  ulCheckbox: {
    boxSize: 24,
    gapWidth: 16,
    marginLeft: 16,
    boxColor: 'blue',
    ...DEFAULT_BASE_STYLE,
  },
};

export const DEFAULT_ENRICHED_TEXT_STYLE: Required<EnrichedTextHtmlStyle> = {
  ...DEFAULT_HTML_STYLE,
  mention: {
    ...DEFAULT_HTML_STYLE.mention,
    pressColor: 'darkblue',
    pressBackgroundColor: 'yellow',
  },
};
