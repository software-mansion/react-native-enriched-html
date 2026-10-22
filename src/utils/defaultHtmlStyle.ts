import type { HtmlStyle, EnrichedTextHtmlStyle } from '../types';

export const DEFAULT_HTML_STYLE: Required<HtmlStyle> = {
  h1: {
    fontSize: 32,
    bold: false,
    marginTop: 0,
    marginBottom: 0,
  },
  h2: {
    fontSize: 24,
    bold: false,
    marginTop: 0,
    marginBottom: 0,
  },
  h3: {
    fontSize: 20,
    bold: false,
    marginTop: 0,
    marginBottom: 0,
  },
  h4: {
    fontSize: 16,
    bold: false,
    marginTop: 0,
    marginBottom: 0,
  },
  h5: {
    fontSize: 14,
    bold: false,
    marginTop: 0,
    marginBottom: 0,
  },
  h6: {
    fontSize: 12,
    bold: false,
    marginTop: 0,
    marginBottom: 0,
  },
  blockquote: {
    borderColor: 'darkgray',
    borderWidth: 4,
    gapWidth: 16,
    color: undefined,
  },
  codeblock: {
    color: 'black',
    borderRadius: 8,
    backgroundColor: 'darkgray',
  },
  code: {
    color: 'red',
    backgroundColor: 'darkgray',
  },
  a: {
    color: 'blue',
    textDecorationLine: 'underline',
    pressColor: 'darkblue',
  },
  mention: {
    color: 'blue',
    backgroundColor: 'yellow',
    textDecorationLine: 'underline',
  },
  ol: {
    gapWidth: 16,
    marginLeft: 16,
    marginTop: 0,
    marginBottom: 0,
    markerFontWeight: undefined,
    markerColor: undefined,
  },
  ul: {
    bulletColor: 'black',
    bulletSize: 8,
    marginLeft: 16,
    marginTop: 0,
    marginBottom: 0,
    gapWidth: 16,
  },
  ulCheckbox: {
    boxSize: 24,
    gapWidth: 16,
    marginLeft: 16,
    marginTop: 0,
    marginBottom: 0,
    boxColor: 'blue',
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
