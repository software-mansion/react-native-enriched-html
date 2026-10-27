import { useRef, useState } from 'react';
import {
  EnrichedTextInput,
  type EnrichedTextInputInstance,
  type OnChangeSelectionEvent,
  type TextRect,
} from 'react-native-enriched-html';

// The first paragraph wraps onto several lines in a 200px wide input
const SAMPLE_HTML =
  '<p>The quick brown fox jumps over the lazy dog again and again</p><p>BBBB</p>';

const INPUT_STYLE = { width: 200, padding: 12, fontSize: 16 };

export function TestMeasureRanges() {
  const ref = useRef<EnrichedTextInputInstance>(null);
  const [rangesInput, setRangesInput] = useState('[]');
  const [rects, setRects] = useState<TextRect[][] | null>(null);
  const [lastSelection, setLastSelection] =
    useState<OnChangeSelectionEvent | null>(null);

  const measure = async () => {
    const ranges = JSON.parse(rangesInput) as { start: number; end: number }[];
    setRects((await ref.current?.measureRanges(ranges)) ?? null);
  };

  return (
    <div>
      <div data-testid="editor-container">
        <EnrichedTextInput
          ref={ref}
          defaultValue={SAMPLE_HTML}
          editable
          scrollEnabled
          style={INPUT_STYLE}
          onChangeSelection={(e) => {
            setLastSelection(e.nativeEvent);
          }}
        />
      </div>

      <input
        data-testid="ranges-input"
        value={rangesInput}
        onChange={(e) => setRangesInput(e.target.value)}
      />
      <button data-testid="measure-button" onClick={measure}>
        Measure
      </button>

      <input
        data-testid="rects-json"
        readOnly
        value={rects ? JSON.stringify(rects) : ''}
      />
      <span data-testid="selection-start">{lastSelection?.start ?? ''}</span>
    </div>
  );
}
