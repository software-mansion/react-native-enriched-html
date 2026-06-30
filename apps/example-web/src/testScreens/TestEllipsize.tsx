import { useState, type ChangeEvent } from 'react';
import {
  EnrichedText,
  type EnrichedTextProps,
} from 'react-native-enriched-html';
import type { TextStyle } from 'react-native';
import { WEB_DEFAULT_HTML_STYLE } from '../defaultHtmlStyle';

type EllipsizeMode = NonNullable<EnrichedTextProps['ellipsizeMode']>;

const ELLIPSIZE_MODES: EllipsizeMode[] = ['head', 'middle', 'tail', 'clip'];

const INITIAL_VALUE =
  '<html><p>This is a fairly long paragraph that should wrap across several lines so the truncation has something to chew on. Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p></html>';

export function TestEllipsize() {
  const [htmlInput, setHtmlInput] = useState(INITIAL_VALUE);
  const [value, setValue] = useState(INITIAL_VALUE);
  const [numberOfLines, setNumberOfLines] = useState(2);
  const [ellipsizeMode, setEllipsizeMode] = useState<EllipsizeMode>('tail');

  return (
    <div data-testid="test-ellipsize-root">
      <div
        data-testid="test-ellipsize-display"
        style={enrichedTextContainerStyle}
      >
        <EnrichedText
          style={enrichedTextStyle}
          htmlStyle={WEB_DEFAULT_HTML_STYLE}
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
    </div>
  );
}

const enrichedTextStyle: TextStyle = {
  // a definite width is required so the clamp can measure line breaks even
  // before any content is rendered (otherwise the box collapses to 0 width)
  width: 360,
  paddingVertical: 8,
  paddingHorizontal: 8,
  backgroundColor: 'gainsboro',
  fontSize: 16,
};

const enrichedTextContainerStyle = {
  width: 360,
};
