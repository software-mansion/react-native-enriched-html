import { useState, type ChangeEvent } from 'react';
import {
  EnrichedText,
  type OnLinkPressEvent,
  type OnMentionPressEvent,
} from 'react-native-enriched-html';
import type { TextStyle } from 'react-native';
import { WEB_DEFAULT_HTML_STYLE } from '../defaultHtmlStyle';

const INITIAL_VALUE = '<html><p></p></html>';

export function TestEnrichedText() {
  const [htmlInput, setHtmlInput] = useState(INITIAL_VALUE);
  const [value, setValue] = useState(INITIAL_VALUE);
  const [lastLinkPress, setLastLinkPress] = useState<OnLinkPressEvent | null>(
    null
  );
  const [lastMentionPress, setLastMentionPress] =
    useState<OnMentionPressEvent | null>(null);

  return (
    <div data-testid="test-enriched-text-root">
      <div
        data-testid="test-enriched-text-display"
        style={enrichedTextContainerStyle}
      >
        <EnrichedText
          style={enrichedTextStyle}
          htmlStyle={WEB_DEFAULT_HTML_STYLE}
          onLinkPress={setLastLinkPress}
          onMentionPress={setLastMentionPress}
        >
          {value}
        </EnrichedText>
      </div>

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

      <pre data-testid="test-enriched-text-link-press-output">
        {JSON.stringify(lastLinkPress)}
      </pre>
      <pre data-testid="test-enriched-text-mention-press-output">
        {JSON.stringify(lastMentionPress)}
      </pre>
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

const enrichedTextContainerStyle = {
  width: 'fit-content',
};
