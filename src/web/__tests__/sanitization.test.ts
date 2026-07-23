import {
  sanitizeHtml,
  sanitizeMentionAttributes,
  checkMentionAttributes,
} from '../sanitization/htmlSanitizer';

describe('sanitizeMentionAttributes', () => {
  it('returns an empty object when given no attributes', () => {
    expect(sanitizeMentionAttributes()).toEqual({});
    expect(sanitizeMentionAttributes({})).toEqual({});
  });

  it('keeps data-* and commonly-allowed attributes', () => {
    expect(
      sanitizeMentionAttributes({
        'data-user-id': '42',
        'data-team': 'core',
        'id': 'm1',
        'class': 'highlight',
      })
    ).toEqual({
      'data-user-id': '42',
      'data-team': 'core',
      'id': 'm1',
      'class': 'highlight',
    });
  });

  it('strips event handlers and unsafe attributes', () => {
    const result = sanitizeMentionAttributes({
      'onclick': 'alert(1)',
      'onmouseover': 'steal()',
      // eslint-disable-next-line no-script-url
      'href': 'javascript:alert(1)',
      'data-user-id': '42',
    });
    expect(result).toEqual({ 'data-user-id': '42' });
  });

  it('does not return the reserved text/indicator attributes', () => {
    const result = sanitizeMentionAttributes({
      'text': 'Joe',
      'indicator': '@',
      'data-user-id': '42',
    });
    expect(result).toEqual({ 'data-user-id': '42' });
  });
});

describe('checkMentionAttributes', () => {
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it('does not warn for data-*, text, indicator, or commonly-allowed attributes', () => {
    checkMentionAttributes({
      'data-user-id': '42',
      'text': 'Joe',
      'indicator': '@',
      'id': 'm1',
      'class': 'x',
      'style': 'color: red',
    });
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('warns for custom attributes without a recognized prefix', () => {
    checkMentionAttributes({ foo: 'bar' });
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy.mock.calls[0][0]).toContain('foo');
  });

  it('does nothing when given no attributes', () => {
    checkMentionAttributes();
    expect(warnSpy).not.toHaveBeenCalled();
  });
});

describe('sanitizeHtmlMention', () => {
  it('keeps <mention> tags with text/indicator/data-* attributes', () => {
    const out = sanitizeHtml(
      '<mention text="Joe" indicator="@" data-user-id="42">@Joe</mention>'
    );
    expect(out).toContain('text="Joe"');
    expect(out).toContain('indicator="@"');
    expect(out).toContain('data-user-id="42"');
  });

  it('strips <mention> event handlers', () => {
    expect(
      sanitizeHtml('<mention onclick="alert(1)">x</mention>')
    ).not.toContain('onclick');
  });
});

describe('sanitizeLinkAttributes', () => {
  it('strips javascript: URLs from links', () => {
    const out = sanitizeHtml('<a href="javascript:alert(1)">x</a>');
    // eslint-disable-next-line no-script-url
    expect(out).not.toContain('javascript:');
  });

  it('strips unknown protocol URLs from links', () => {
    const out = sanitizeHtml('<a href="custom://link">x</a>');
    expect(out).not.toContain('custom');
  });
});
