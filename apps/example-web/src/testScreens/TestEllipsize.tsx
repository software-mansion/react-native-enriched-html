import { useMemo, useState, type ChangeEvent } from 'react';
import {
  EnrichedText,
  type EnrichedTextProps,
  type HtmlStyle,
} from 'react-native-enriched-html';
import type { TextStyle } from 'react-native';
import { WEB_DEFAULT_HTML_STYLE } from '../defaultHtmlStyle';

type EllipsizeMode = NonNullable<EnrichedTextProps['ellipsizeMode']>;

const ELLIPSIZE_MODES: EllipsizeMode[] = ['head', 'middle', 'tail', 'clip'];

export function TestEllipsize() {
  const [htmlInput, setHtmlInput] = useState('');
  const [value, setValue] = useState('');
  const [numberOfLines, setNumberOfLines] = useState(2);
  const [ellipsizeMode, setEllipsizeMode] = useState<EllipsizeMode>('tail');

  const [styleOverride, setStyleOverride] = useState(false);
  const [headingsOverride, setHeadingsOverride] = useState(false);
  const [olOverride, setOlOverride] = useState(false);
  const [blockquoteOverride, setBlockquoteOverride] = useState(false);

  const style = useMemo<TextStyle>(
    () =>
      styleOverride
        ? { ...enrichedTextStyle, ...STYLE_OVERRIDE }
        : enrichedTextStyle,
    [styleOverride]
  );

  const htmlStyle = useMemo<HtmlStyle>(() => {
    let next: HtmlStyle = WEB_DEFAULT_HTML_STYLE;

    if (headingsOverride) {
      next = {
        ...next,
        h1: { ...next.h1, fontSize: 40 },
        h2: { ...next.h2, fontSize: 36 },
        h3: { ...next.h3, fontSize: 32 },
        h4: { ...next.h4, fontSize: 28 },
        h5: { ...next.h5, fontSize: 22 },
        h6: { ...next.h6, fontSize: 16 },
      };
    }

    if (olOverride) {
      next = { ...next, ol: { ...next.ol, marginLeft: 96 } };
    }

    if (blockquoteOverride) {
      next = { ...next, blockquote: { ...next.blockquote, gapWidth: 64 } };
    }

    return next;
  }, [headingsOverride, olOverride, blockquoteOverride]);

  return (
    <div data-testid="test-ellipsize-root">
      <div
        data-testid="test-ellipsize-display"
        style={enrichedTextContainerStyle}
      >
        <EnrichedText
          style={style}
          htmlStyle={htmlStyle}
          ellipsizeMode={ellipsizeMode}
          numberOfLines={numberOfLines}
        >
          {value}
        </EnrichedText>
      </div>

      <div>
        <label htmlFor="test-ellipsize-number-of-lines-input">
          numberOfLines
        </label>
        <input
          id="test-ellipsize-number-of-lines-input"
          data-testid="test-ellipsize-number-of-lines-input"
          type="number"
          min={0}
          value={numberOfLines}
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            setNumberOfLines(Number(e.target.value));
          }}
        />
      </div>

      <div data-testid="test-ellipsize-mode-buttons">
        {ELLIPSIZE_MODES.map((mode) => (
          <button
            key={mode}
            type="button"
            data-testid={`test-ellipsize-mode-${mode}`}
            onClick={() => {
              setEllipsizeMode(mode);
            }}
          >
            {mode}
          </button>
        ))}
      </div>

      <div data-testid="test-ellipsize-override-buttons">
        <button
          type="button"
          data-testid="test-ellipsize-toggle-style"
          onClick={() => {
            setStyleOverride((prev) => !prev);
          }}
        >
          toggle style
        </button>
        <button
          type="button"
          data-testid="test-ellipsize-toggle-headings"
          onClick={() => {
            setHeadingsOverride((prev) => !prev);
          }}
        >
          toggle headings
        </button>
        <button
          type="button"
          data-testid="test-ellipsize-toggle-ol"
          onClick={() => {
            setOlOverride((prev) => !prev);
          }}
        >
          toggle ol
        </button>
        <button
          type="button"
          data-testid="test-ellipsize-toggle-blockquote"
          onClick={() => {
            setBlockquoteOverride((prev) => !prev);
          }}
        >
          toggle blockquote
        </button>
      </div>

      <textarea
        data-testid="test-ellipsize-html-input"
        value={htmlInput}
        onChange={(e: ChangeEvent<HTMLTextAreaElement>) => {
          setHtmlInput(e.target.value);
        }}
        rows={4}
      />
      <button
        type="button"
        data-testid="test-ellipsize-set-value-button"
        onClick={() => {
          setValue(htmlInput);
        }}
      >
        Set value
      </button>

      <pre data-testid="test-ellipsize-mode-output">{ellipsizeMode}</pre>
      <pre data-testid="test-ellipsize-number-of-lines-output">
        {numberOfLines}
      </pre>
      <pre data-testid="test-ellipsize-value-output">{value}</pre>
      <pre data-testid="test-ellipsize-style-override-output">
        style override - {String(styleOverride)}
      </pre>
      <pre data-testid="test-ellipsize-headings-override-output">
        headings override - {String(headingsOverride)}
      </pre>
      <pre data-testid="test-ellipsize-ol-override-output">
        ol override - {String(olOverride)}
      </pre>
      <pre data-testid="test-ellipsize-blockquote-override-output">
        blockquote override - {String(blockquoteOverride)}
      </pre>
    </div>
  );
}

const enrichedTextStyle: TextStyle = {
  width: 360,
  paddingVertical: 8,
  paddingHorizontal: 8,
  backgroundColor: 'gainsboro',
  fontSize: 16,
};

const STYLE_OVERRIDE: TextStyle = {
  fontSize: 28,
  lineHeight: 40,
};

const enrichedTextContainerStyle = {
  width: 360,
};
