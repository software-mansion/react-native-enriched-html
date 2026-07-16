import { useRef } from 'react';
import type { TextStyle } from 'react-native';
import {
  EnrichedText,
  type BlurEvent,
  type EnrichedTextInstance,
  type FocusEvent,
  type OnLinkPressEvent,
  type OnMentionPressEvent,
} from 'react-native-enriched-html';
import { WEB_DEFAULT_HTML_STYLE } from '../defaultHtmlStyle';

interface TextRendererProps {
  htmlValue: string;
}

export function TextRenderer({ htmlValue }: TextRendererProps) {
  const ref = useRef<EnrichedTextInstance>(null);

  const handleTextFocus = (e: FocusEvent) => {
    console.log('[EnrichedText] onFocus', e.nativeEvent);
  };

  const handleTextBlur = (e: BlurEvent) => {
    console.log('[EnrichedText] onBlur', e.nativeEvent);
  };

  const handleLinkPress = (e: OnLinkPressEvent) => {
    console.log('[EnrichedText] link press event', e);
  };

  const handleMentionPress = (e: OnMentionPressEvent) => {
    console.log('[EnrichedText] mention press event', e);
  };

  return (
    <div className="container enriched-text-container">
      <h1 className="app-title">Enriched Text</h1>
      <EnrichedText
        ref={ref}
        style={enrichedTextStyle}
        htmlStyle={WEB_DEFAULT_HTML_STYLE}
        onFocus={handleTextFocus}
        onBlur={handleTextBlur}
        onLinkPress={handleLinkPress}
        onMentionPress={handleMentionPress}
      >
        {htmlValue}
      </EnrichedText>
      <div className="btn-row" data-testid="editor-actions-row">
        <button
          className="btn"
          data-testid="focus-button"
          onClick={() => ref.current?.focus()}
        >
          Focus
        </button>
        <button
          className="btn"
          data-testid="blur-button"
          onClick={() => ref.current?.blur()}
        >
          Blur
        </button>
      </div>
    </div>
  );
}

const enrichedTextStyle: TextStyle = {
  backgroundColor: 'gainsboro',
  width: '100%',
  marginVertical: 12,
  paddingVertical: 12,
  paddingHorizontal: 14,
  borderRadius: 8,
  fontSize: 18,
};
