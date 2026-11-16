/*
 * Port of the ignoredStyles tests from cpp/tests/GumboParserTest.cpp, the
 * expected outputs are the same as the native normalizer's outputs
 */
import type { EnrichedStyleName } from '../../types';
import {
  IGNORABLE_STYLES,
  getIgnoredStylesMask,
} from '../../utils/ignoredStyles';
import { isEnrichedHtml, normalizeHtml } from '../normalization/htmlNormalizer';
import { prepareHtmlForTiptap } from '../normalization/tiptapHtmlNormalizer';

const ignoring = (...styles: EnrichedStyleName[]) =>
  getIgnoredStylesMask(styles);

describe('getIgnoredStylesMask', () => {
  test('no ignored styles keeps every style', () => {
    expect(getIgnoredStylesMask([])).toBe(0);
  });

  test('every style ignored sets every bit', () => {
    expect(getIgnoredStylesMask(IGNORABLE_STYLES)).toBe(2 ** 21 - 1);
  });

  test('bits follow cpp/parser/IgnoredStyles.h', () => {
    expect(ignoring('bold')).toBe(2 ** 0);
    expect(ignoring('h1')).toBe(2 ** 5);
    expect(ignoring('checkboxList')).toBe(2 ** 15);
    expect(ignoring('customStyle')).toBe(2 ** 20);
    expect(ignoring('bold', 'customStyle')).toBe(2 ** 0 + 2 ** 20);
  });

  test('unknown names are ignored', () => {
    expect(getIgnoredStylesMask(['bold', 'nope' as EnrichedStyleName])).toBe(
      getIgnoredStylesMask(['bold'])
    );
  });
});

describe('normalizeHtml with ignored styles', () => {
  describe('IgnoredInlineStylesAreUnwrapped', () => {
    test.each<[string, number, string]>([
      ['<p><b>a</b><i>b</i></p>', ignoring('bold'), '<p>a<i>b</i></p>'],
      ['<strong>x</strong> <em>y</em>', ignoring('bold', 'italic'), 'x y'],
      ['<span style="font-weight: bold">x</span>', ignoring('bold'), 'x'],
      [
        '<u>a</u><s>b</s><code>c</code>',
        ignoring('underline', 'strikeThrough', 'inlineCode'),
        'abc',
      ],
      [
        '<a href="https://x.com?a=1&amp;b=2">link</a>',
        ignoring('link'),
        'link',
      ],
      [
        '<mention text="@John" indicator="@" data-id="1">@John</mention>',
        ignoring('mention'),
        '@John',
      ],
    ])('%s (mask %d) → %s', (input, mask, expected) => {
      expect(normalizeHtml(input, mask)).toBe(expected);
    });
  });

  describe('IgnoredCustomStyle', () => {
    test.each<[string, number, string]>([
      [
        '<span style="color: red; font-size: 20px">x</span>',
        ignoring('customStyle'),
        'x',
      ],
      [
        '<span style="color: red; font-weight: bold">x</span>',
        ignoring('customStyle'),
        '<b>x</b>',
      ],
      [
        '<span style="color: red; font-weight: bold">x</span>',
        ignoring('bold'),
        '<span style="color: red">x</span>',
      ],
      [
        '<b id="docs-internal-guid-1234567890"><p dir="ltr"><span style="font-size:11pt;font-family:Arial;color:#000000;font-weight:700">Bold</span><span style="font-size:11pt;font-family:Arial;color:#000000"> text</span></p></b>',
        ignoring('customStyle'),
        '<p><b>Bold</b> text</p>',
      ],
    ])('%s (mask %d) → %s', (input, mask, expected) => {
      expect(normalizeHtml(input, mask)).toBe(expected);
    });
  });

  describe('IgnoredBlockStylesBecomeParagraphs', () => {
    test.each<[string, number, string]>([
      ['<h1>x</h1><h2>y</h2>', ignoring('h1'), '<p>x</p><h2>y</h2>'],
      [
        '<h3 style="text-align: center">x</h3>',
        ignoring('h3'),
        '<p style="text-align: center">x</p>',
      ],
      ['<h1></h1>', ignoring('h1'), '<br>'],
      ['<pre>x</pre>', ignoring('codeBlock'), '<p>x</p>'],
      [
        '<codeblock><p>a</p><p>b</p></codeblock>',
        ignoring('codeBlock'),
        '<p>a</p><p>b</p>',
      ],
      ['<blockquote>x</blockquote>', ignoring('blockQuote'), '<p>x</p>'],
    ])('%s (mask %d) → %s', (input, mask, expected) => {
      expect(normalizeHtml(input, mask)).toBe(expected);
    });
  });

  describe('IgnoredListsBecomeParagraphs', () => {
    test.each<[string, number, string]>([
      [
        '<ul><li>a</li><li></li><li><b>c</b></li></ul>',
        ignoring('unorderedList'),
        '<p>a</p><br><p><b>c</b></p>',
      ],
      [
        '<ol style="text-align: right"><li>a</li></ol>',
        ignoring('orderedList'),
        '<p style="text-align: right">a</p>',
      ],
      [
        '<ul data-type="checkbox"><li checked>a</li><li>b</li></ul>',
        ignoring('checkboxList'),
        '<p>a</p><p>b</p>',
      ],
      [
        '<ul data-type="checkbox"><li checked>a</li><li>b</li></ul>',
        ignoring('unorderedList'),
        '<ul data-type="checkbox"><li checked>a</li><li>b</li></ul>',
      ],
      ['<ul><li>a</li></ul>', ignoring('checkboxList'), '<ul><li>a</li></ul>'],
    ])('%s (mask %d) → %s', (input, mask, expected) => {
      expect(normalizeHtml(input, mask)).toBe(expected);
    });
  });

  describe('IgnoredImagesAndAlignment', () => {
    test.each<[string, number, string]>([
      [
        '<p>a<img src="x.png" width="10" height="20" />b</p>',
        ignoring('image'),
        '<p>ab</p>',
      ],
      [
        '<ul><li><img src="x" /></li></ul>',
        ignoring('unorderedList', 'image'),
        '<br>',
      ],
      [
        '<p style="text-align: center">x</p>',
        ignoring('alignment'),
        '<p>x</p>',
      ],
      [
        '<ul style="text-align: center"><li>x</li></ul>',
        ignoring('alignment'),
        '<ul><li>x</li></ul>',
      ],
      [
        '<h3 style="text-align: center">x</h3>',
        ignoring('h3', 'alignment'),
        '<p>x</p>',
      ],
    ])('%s (mask %d) → %s', (input, mask, expected) => {
      expect(normalizeHtml(input, mask)).toBe(expected);
    });
  });

  describe('IgnoredStylesKeepContent', () => {
    test.each<[string, number, string]>([
      [
        '<p>a<img src="x.png" width="10" height="20" />b</p>',
        ignoring('bold'),
        '<p>a<img src="x.png" width="10" height="20" />b</p>',
      ],
      [
        '<p>a &lt;b&gt; &amp; c</p>',
        ignoring('bold'),
        '<p>a &lt;b&gt; &amp; c</p>',
      ],
      ['<span> lead</span>', ignoring('bold'), ' lead'],
      ['<p>a</p><br><p>b</p>', ignoring('bold'), '<p>a</p><br><p>b</p>'],
      [
        'hello <b>world</b>',
        getIgnoredStylesMask(IGNORABLE_STYLES),
        'hello world',
      ],
    ])('%s (mask %d) → %s', (input, mask, expected) => {
      expect(normalizeHtml(input, mask)).toBe(expected);
    });
  });
});

describe('editor HTML is never filtered', () => {
  test.each([
    ['<html><p><b>x</b></p></html>', true],
    ['  <html>\n<p>x</p>\n</html>\n', true],
    ['<p><b>x</b></p>', false],
    ['<html><p>x</p>', false],
  ])('isEnrichedHtml(%j) → %s', (html, expected) => {
    expect(isEnrichedHtml(html)).toBe(expected);
  });

  test('prepareHtmlForTiptap filters external HTML only', () => {
    const mask = getIgnoredStylesMask(IGNORABLE_STYLES);
    expect(prepareHtmlForTiptap('<p><b>x</b></p>', true, undefined, mask)).toBe(
      '<p>x</p>'
    );
    expect(
      prepareHtmlForTiptap(
        '<html><p><b>x</b></p></html>',
        true,
        undefined,
        mask
      )
    ).toBe('<p><b>x</b></p>');
  });
});
