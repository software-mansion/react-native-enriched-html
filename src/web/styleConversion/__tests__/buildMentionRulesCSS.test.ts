import { mergeWithDefaultHtmlStyle } from '../htmlStyleToCSSVariables';
import { buildMentionRulesCSS } from '../buildMentionRulesCSS';
import {
  ENRICHED_TEXT_CLASSNAME,
  ENRICHED_TEXT_INPUT_CLASSNAME,
} from '../../constants/classNames';

describe('buildMentionRulesCSS', () => {
  it('emits base rules for both containers (default + @)', () => {
    const merged = mergeWithDefaultHtmlStyle({
      mention: { '@': { color: 'red' } },
    });
    const css = buildMentionRulesCSS(merged);

    expect(css).toContain(`.${ENRICHED_TEXT_INPUT_CLASSNAME} mention`);
    expect(css).toContain(`.${ENRICHED_TEXT_CLASSNAME} mention`);
    expect(css).toContain('var(--et-mention-default-color)');
    expect(css).toContain('var(--et-mention-default-background-color)');
    expect(css).toContain('var(--et-mention-default-text-decoration-line)');

    expect(css).toContain(
      `.${ENRICHED_TEXT_INPUT_CLASSNAME} mention[indicator="@"]`
    );
    expect(css).toContain(`.${ENRICHED_TEXT_CLASSNAME} mention[indicator="@"]`);
    expect(css).toContain('var(--et-mention-u0040-color)');
    expect(css).toContain('var(--et-mention-u0040-background-color)');
    expect(css).toContain('var(--et-mention-u0040-text-decoration-line)');
  });

  it('appends press-state rules for the read-only view only', () => {
    const merged = mergeWithDefaultHtmlStyle({
      mention: { '@': { color: 'red' } },
    });
    const css = buildMentionRulesCSS(merged);

    expect(css).toContain(`.${ENRICHED_TEXT_CLASSNAME} mention:active`);
    expect(css).toContain(
      `.${ENRICHED_TEXT_CLASSNAME} mention[indicator="@"]:active`
    );
    expect(css).toContain('var(--et-mention-default-press-color)');
    expect(css).toContain('var(--et-mention-default-press-background-color)');
    expect(css).toContain('var(--et-mention-u0040-press-color)');
    expect(css).toContain('var(--et-mention-u0040-press-background-color)');

    expect(css).not.toContain(
      `.${ENRICHED_TEXT_INPUT_CLASSNAME} mention:active`
    );
    expect(css).not.toContain(
      `.${ENRICHED_TEXT_INPUT_CLASSNAME} mention[indicator="@"]:active`
    );
  });

  it('returns empty string when mention is missing', () => {
    expect(buildMentionRulesCSS(undefined)).toBe('');
    expect(buildMentionRulesCSS({})).toBe('');
  });

  it('returns empty string when mention is not a style record', () => {
    expect(buildMentionRulesCSS({ mention: { color: 'red' } })).toBe('');
  });
});
