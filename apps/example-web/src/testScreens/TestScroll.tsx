import { EnrichedTextInput } from 'react-native-enriched-html';
import { useState } from 'react';

const LONG_HTML = '<p>Test</p><br>'.repeat(150);

export function TestScroll() {
  const [offset, setOffset] = useState(0);
  return (
    <div data-testid="test-scroll-root">
      <div data-testid="scroll-editor">
        <EnrichedTextInput
          style={{ height: 150 }}
          defaultValue={LONG_HTML}
          onScroll={(e) => {
            setOffset(e.nativeEvent.contentOffset.y);
          }}
        />
      </div>
      <div data-testid="scroll-offset-output">{offset}</div>
    </div>
  );
}
