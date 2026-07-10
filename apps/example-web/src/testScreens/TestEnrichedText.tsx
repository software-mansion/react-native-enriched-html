import { useState, type ChangeEvent } from 'react';
import { EnrichedText } from 'react-native-enriched-html';
import type { TextStyle } from 'react-native';
import { WEB_DEFAULT_HTML_STYLE } from '../defaultHtmlStyle';

const INITIAL_VALUE = '<html><p></p></html>';

export function TestEnrichedText() {
  const [htmlInput, setHtmlInput] = useState(INITIAL_VALUE);
  const [value, setValue] = useState(INITIAL_VALUE);
  const [isWide, setIsWide] = useState(false);

  return (
    <div data-testid="test-enriched-text-root">
      <div
        data-testid="test-enriched-text-display"
        style={enrichedTextContainerStyle}
      >
        <EnrichedText
          style={isWide ? enrichedTextWideStyle : enrichedTextStyle}
          htmlStyle={WEB_DEFAULT_HTML_STYLE}
        >
          {value}
        </EnrichedText>
      </div>

      <button
        type="button"
        data-testid="test-enriched-text-toggle-width-button"
        onClick={() => {
          setIsWide((prev) => !prev);
        }}
      >
        Toggle width
      </button>

      <textarea
        data-testid="test-enriched-text-html-input"
        value={htmlInput}
        onChange={(e: ChangeEvent<HTMLTextAreaElement>) => {
          setHtmlInput(e.target.value);
        }}
        rows={4}
      />
      <button
        type="button"
        data-testid="test-enriched-text-set-value-button"
        onClick={() => {
          setValue(htmlInput);
        }}
      >
        Set value
      </button>

      <pre data-testid="test-enriched-text-value-output">{value}</pre>
    </div>
  );
}

const enrichedTextStyle: TextStyle = {
  width: '100%',
  maxWidth: 360,
  paddingVertical: 8,
  paddingHorizontal: 8,
  backgroundColor: 'gainsboro',
  fontSize: 16,
};

const enrichedTextWideStyle: TextStyle = {
  ...enrichedTextStyle,
  minWidth: 360,
  maxWidth: 720,
};

const enrichedTextContainerStyle = {
  width: 'fit-content',
};
