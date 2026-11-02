import { normalizeFontFamily } from '../formats/EnrichedCustomStyle';

describe('normalizeFontFamily', () => {
  it.each([
    // first family of the stack
    ['Roboto, sans-serif', 'Roboto'],
    ['"Open Sans", Arial', 'Open Sans'],
    ["'Open Sans'", 'Open Sans'],
    // commas inside quotes are part of the family name
    ['"SWM, Inc", Arial', 'SWM, Inc'],
    ["'SWM,Inc', Arial", 'SWM,Inc'],
    // an empty first family is no family
    [', Arial', null],
    ["'", null],
    ['', null],
    [null, null],
  ])('%p → %p', (input, expected) => {
    expect(normalizeFontFamily(input)).toBe(expected);
  });
});
