import type { CSSProperties } from 'react';
import type { TextStyle } from 'react-native';
import { enrichedTextStyleToCSSProperties } from '../enrichedTextStyleToCSSProperties';

type TestCase = {
  description: string;
  input: TextStyle;
  expected: CSSProperties;
};

function convert(style: TextStyle): CSSProperties {
  return enrichedTextStyleToCSSProperties(style);
}

// These suites only cover the text-only properties that
// enrichedTextStyleToCSSProperties adds on top of the shared base.

describe('empty input', () => {
  it('returns an empty object for an empty style', () => {
    expect(convert({})).toEqual({
      overflowY: 'hidden',
    });
  });
});

describe('textAlign', () => {
  const cases: TestCase[] = [
    {
      description: 'left passes through',
      input: { textAlign: 'left' },
      expected: {
        overflowY: 'hidden',
        textAlign: 'left',
      },
    },
    {
      description: 'center passes through',
      input: { textAlign: 'center' },
      expected: {
        overflowY: 'hidden',
        textAlign: 'center',
      },
    },
    {
      description: 'justify passes through',
      input: { textAlign: 'justify' },
      expected: {
        overflowY: 'hidden',
        textAlign: 'justify',
      },
    },
  ];

  it.each(cases)('$description', ({ input, expected }) => {
    expect(convert(input)).toEqual(expected);
  });

  it("omits 'auto' (no CSS equivalent)", () => {
    expect(convert({ textAlign: 'auto' })).not.toHaveProperty('textAlign');
  });
});

describe('textTransform', () => {
  it.each(['none', 'capitalize', 'uppercase', 'lowercase'] as const)(
    '%s passes through',
    (value) => {
      expect(convert({ textTransform: value })).toEqual({
        overflowY: 'hidden',
        textTransform: value,
      });
    }
  );
});

describe('text decoration', () => {
  const cases: TestCase[] = [
    {
      description: 'textDecorationLine underline passes through',
      input: { textDecorationLine: 'underline' },
      expected: {
        overflowY: 'hidden',
        textDecorationLine: 'underline',
      },
    },
    {
      description: 'textDecorationLine combined value passes through',
      input: { textDecorationLine: 'underline line-through' },
      expected: {
        overflowY: 'hidden',
        textDecorationLine: 'underline line-through',
      },
    },
    {
      description: 'textDecorationStyle passes through',
      input: { textDecorationStyle: 'dashed' },
      expected: {
        overflowY: 'hidden',
        textDecorationStyle: 'dashed',
      },
    },
    {
      description: 'textDecorationColor (string) passes through',
      input: { textDecorationColor: 'red' },
      expected: {
        overflowY: 'hidden',
        textDecorationColor: 'red',
      },
    },
    {
      description: 'textDecorationColor (integer) converts to rgba',
      input: { textDecorationColor: 0xff0000ff } as unknown as TextStyle,
      expected: {
        overflowY: 'hidden',
        textDecorationColor: 'rgba(255, 0, 0, 1)',
      },
    },
  ];

  it.each(cases)('$description', ({ input, expected }) => {
    expect(convert(input)).toEqual(expected);
  });
});

describe('textShadow', () => {
  it('combines offset, radius and color into the CSS shorthand', () => {
    expect(
      convert({
        textShadowColor: 'black',
        textShadowOffset: { width: 1, height: 2 },
        textShadowRadius: 3,
      })
    ).toEqual({
      overflowY: 'hidden',
      textShadow: '1px 2px 3px black',
    });
  });

  it('defaults missing offset and radius to 0', () => {
    expect(convert({ textShadowColor: 'red' })).toEqual({
      overflowY: 'hidden',
      textShadow: '0px 0px 0px red',
    });
  });

  it('omits the color when none is provided', () => {
    expect(
      convert({
        textShadowOffset: { width: 4, height: 5 },
        textShadowRadius: 6,
      })
    ).toEqual({
      overflowY: 'hidden',
      textShadow: '4px 5px 6px',
    });
  });

  it('converts integer color values', () => {
    expect(
      convert({
        textShadowColor: 0x00000080,
        textShadowOffset: { width: 0, height: 1 },
      } as unknown as TextStyle)
    ).toEqual({
      overflowY: 'hidden',
      textShadow: `0px 1px 0px rgba(0, 0, 0, ${128 / 255})`,
    });
  });

  it('is omitted when no textShadow props are set', () => {
    expect(convert({ color: 'red' })).not.toHaveProperty('textShadow');
  });
});

describe('userSelect', () => {
  it.each(['auto', 'none', 'text', 'contain', 'all'] as const)(
    '%s passes through',
    (value) => {
      expect(convert({ userSelect: value })).toEqual({
        overflowY: 'hidden',
        userSelect: value,
      });
    }
  );
});

describe('fontVariant', () => {
  it('joins the RN array into a CSS string', () => {
    expect(convert({ fontVariant: ['small-caps', 'tabular-nums'] })).toEqual({
      overflowY: 'hidden',
      fontVariant: 'small-caps tabular-nums',
    });
  });

  it('joins a single-item array', () => {
    expect(convert({ fontVariant: ['small-caps'] })).toEqual({
      overflowY: 'hidden',
      fontVariant: 'small-caps',
    });
  });
});

describe('writingDirection → direction', () => {
  it.each(['ltr', 'rtl'] as const)('%s maps to direction', (value) => {
    expect(convert({ writingDirection: value })).toEqual({
      overflowY: 'hidden',
      direction: value,
    });
  });

  it("omits 'auto' (no CSS equivalent)", () => {
    expect(convert({ writingDirection: 'auto' })).not.toHaveProperty(
      'direction'
    );
  });
});

describe('verticalAlign', () => {
  it.each(['top', 'bottom', 'middle'] as const)(
    '%s passes through',
    (value) => {
      expect(convert({ verticalAlign: value })).toEqual({
        overflowY: 'hidden',
        verticalAlign: value,
      });
    }
  );

  it("omits 'auto' (no CSS equivalent)", () => {
    expect(convert({ verticalAlign: 'auto' })).not.toHaveProperty(
      'verticalAlign'
    );
  });
});

describe('combined text style', () => {
  it('emits all text-only properties together', () => {
    expect(
      convert({
        textAlign: 'center',
        textTransform: 'uppercase',
        textDecorationLine: 'underline',
        textDecorationColor: 'blue',
        userSelect: 'none',
      })
    ).toEqual({
      overflowY: 'hidden',
      textAlign: 'center',
      textTransform: 'uppercase',
      textDecorationLine: 'underline',
      textDecorationColor: 'blue',
      userSelect: 'none',
    });
  });
});
