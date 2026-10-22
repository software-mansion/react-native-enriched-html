import type { HtmlStyle } from 'react-native-enriched-html';

export const WEB_DEFAULT_HTML_STYLE: HtmlStyle = {
  h1: {
    fontSize: 72,
    bold: true,
  },
  h2: {
    fontSize: 60,
    bold: true,
  },
  h3: {
    fontSize: 50,
    bold: true,
  },
  h4: {
    fontSize: 40,
    bold: true,
  },
  h5: {
    fontSize: 30,
    bold: true,
  },
  h6: {
    fontSize: 24,
    bold: true,
  },
  blockquote: {
    borderColor: 'navy',
    borderWidth: 4,
    gapWidth: 16,
    color: 'navy',
  },
  codeblock: {
    color: '#008000',
    borderRadius: 8,
    backgroundColor: '#bfbfbf',
  },
  code: {
    color: 'purple',
    backgroundColor: 'yellow',
  },
  a: {
    color: 'green',
    textDecorationLine: 'underline',
    pressColor: 'darkblue',
  },
  ol: {
    gapWidth: 16,
    marginLeft: 24,
    markerColor: 'navy',
    markerFontWeight: 'bold',
  },
  ul: {
    bulletColor: 'aquamarine',
    bulletSize: 8,
    marginLeft: 24,
    gapWidth: 16,
  },
  ulCheckbox: {
    boxSize: 18,
    gapWidth: 16,
    marginLeft: 24,
    boxColor: 'rgb(0, 26, 114)',
  },
  mention: {
    '@': {
      backgroundColor: 'lightgreen',
      color: 'green',
      textDecorationLine: 'none',
    },
    '#': {
      backgroundColor: 'lightblue',
      color: 'blue',
      textDecorationLine: 'underline',
    },
  },
};

// Vertical spacing around headings and lists, shown on the main screen only,
// so the test screens stay the same.
export const WEB_DEV_HTML_STYLE: HtmlStyle = {
  ...WEB_DEFAULT_HTML_STYLE,
  h1: { ...WEB_DEFAULT_HTML_STYLE.h1, marginTop: 24, marginBottom: 12 },
  h2: { ...WEB_DEFAULT_HTML_STYLE.h2, marginTop: 20, marginBottom: 10 },
  h3: { ...WEB_DEFAULT_HTML_STYLE.h3, marginTop: 16, marginBottom: 8 },
  h4: { ...WEB_DEFAULT_HTML_STYLE.h4, marginTop: 12, marginBottom: 6 },
  h5: { ...WEB_DEFAULT_HTML_STYLE.h5, marginTop: 12, marginBottom: 6 },
  h6: { ...WEB_DEFAULT_HTML_STYLE.h6, marginTop: 12, marginBottom: 6 },
  ol: { ...WEB_DEFAULT_HTML_STYLE.ol, marginTop: 8, marginBottom: 8 },
  ul: { ...WEB_DEFAULT_HTML_STYLE.ul, marginTop: 8, marginBottom: 8 },
  ulCheckbox: {
    ...WEB_DEFAULT_HTML_STYLE.ulCheckbox,
    marginTop: 8,
    marginBottom: 8,
  },
};
