import { mergeWithDefaultHtmlStyle } from '../htmlStyleToCSSVariables';
import { buildMentionRulesCSS } from '../buildMentionRulesCSS';
import {
  ENRICHED_TEXT_CLASSNAME,
  ENRICHED_TEXT_INPUT_CLASSNAME,
} from '../../constants/classNames';

describe('buildMentionRulesCSS', () => {
  it.each([
    {
      description: 'EnrichedTextInput',
      input: 'input' as const,
      expected: ENRICHED_TEXT_INPUT_CLASSNAME,
    },
    {
      description: 'EnrichedText',
      input: 'text' as const,
      expected: ENRICHED_TEXT_CLASSNAME,
    },
  ])(
    '[$description] emits default class rule and attribute rule for @',
    ({ input, expected }) => {
      const merged = mergeWithDefaultHtmlStyle({
        mention: { '@': { color: 'red' } },
      });
      const css = buildMentionRulesCSS(input, merged);

      expect(css).toMatch(new RegExp(`\\.${expected} mention\\s*\\{`));
      expect(css).toContain('var(--et-mention-default-color)');
      expect(css).toContain('var(--et-mention-default-background-color)');
      expect(css).toContain('var(--et-mention-default-text-decoration-line)');

      expect(css).toContain(`.${expected} mention[indicator="@"]`);
      expect(css).toContain('var(--et-mention-u0040-color)');
      expect(css).toContain('var(--et-mention-u0040-background-color)');
      expect(css).toContain('var(--et-mention-u0040-text-decoration-line)');
    }
  );

  it('returns empty string when mention is missing', () => {
    expect(buildMentionRulesCSS('input', undefined)).toBe('');
    expect(buildMentionRulesCSS('input', {})).toBe('');
  });

  it('returns empty string when mention is not a style record', () => {
    expect(buildMentionRulesCSS('input', { mention: { color: 'red' } })).toBe(
      ''
    );
  });
});
