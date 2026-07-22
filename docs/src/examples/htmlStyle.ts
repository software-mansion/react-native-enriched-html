import type {
  HtmlStyle,
  EnrichedTextHtmlStyle,
} from 'react-native-enriched-html';

// Shared htmlStyle for the interactive docs examples.
//
// The colors are tuned to read well in Docusaurus' light and dark modes. They
// exist purely to make the rendered rich text match the docs' visual language
//
// It lives in its own file so the example sources stay focused on the API
// being demonstrated.

const TEXT = '#232736'; // body text inside code blocks
const MUTED = '#5b6bb0'; // list markers, quote text
const GREEN = '#57b495'; // checkboxes
const LINK = '#2f6fd0'; // link / mention accent

export const htmlStyle: HtmlStyle = {
  h1: { fontSize: 30, bold: true },
  h2: { fontSize: 26, bold: true },
  h3: { fontSize: 22, bold: true },
  h4: { fontSize: 19, bold: true },
  h5: { fontSize: 17, bold: true },
  h6: { fontSize: 15, bold: true },
  blockquote: {
    borderColor: '#919fcf',
    borderWidth: 4,
    gapWidth: 12,
    color: MUTED,
  },
  codeblock: {
    color: TEXT,
    backgroundColor: '#e2e5ff',
    borderRadius: 8,
  },
  code: {
    color: '#782aeb',
    backgroundColor: '#e8dafc',
  },
  a: {
    color: '#38acdd',
    textDecorationLine: 'none',
  },
  mention: {
    color: LINK,
    backgroundColor: '#dbe7fb',
    textDecorationLine: 'none',
  },
  ol: {
    gapWidth: 8,
    markerFontWeight: '600',
    markerColor: MUTED,
  },
  ul: {
    bulletColor: MUTED,
    bulletSize: 5,
    marginLeft: 4,
    gapWidth: 8,
  },
  ulCheckbox: {
    boxSize: 16,
    boxColor: GREEN,
  },
};

export const enrichedTextHtmlStyle: EnrichedTextHtmlStyle = {
  ...htmlStyle,
  a: {
    ...htmlStyle.a,
    pressColor: '#3b82f6',
  },
  mention: {
    ...htmlStyle.mention,
    pressColor: '#1d4fa0',
    pressBackgroundColor: '#c2d8f7',
  },
};
