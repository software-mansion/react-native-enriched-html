import { useRef, useState, type ChangeEvent } from 'react';
import {
  EnrichedTextInput,
  type EnrichedInputStyle,
  type EnrichedTextInputInstance,
  type OnChangeSelectionEvent,
  type OnChangeStateEvent,
} from 'react-native-enriched-html';
import { Toolbar } from '../components/Toolbar';
import { WEB_DEFAULT_HTML_STYLE } from '../defaultHtmlStyle';

function toInteger(value: string): number {
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? 0 : parsed;
}

export function TestInsertValue() {
  const ref = useRef<EnrichedTextInputInstance>(null);
  const [setupHtmlInput, setSetupHtmlInput] = useState('');
  const [insertInput, setInsertInput] = useState('');
  const [selectionStartInput, setSelectionStartInput] = useState('0');
  const [selectionEndInput, setSelectionEndInput] = useState('0');
  const [editorState, setEditorState] = useState<OnChangeStateEvent | null>(
    null
  );
  const [selection, setSelection] = useState<OnChangeSelectionEvent | null>(
    null
  );
  const [editorHtml, setEditorHtml] = useState('');

  const handleClear = () => {
    ref.current?.setValue('');
    setSetupHtmlInput('');
    setInsertInput('');
    setSelectionStartInput('0');
    setSelectionEndInput('0');
    setEditorHtml('');
  };

  const handleSetValue = () => {
    ref.current?.setValue(setupHtmlInput);
  };

  const handleApplySelection = () => {
    ref.current?.setSelection(
      toInteger(selectionStartInput),
      toInteger(selectionEndInput)
    );
  };

  const handleInsert = () => {
    ref.current?.insertValue(
      insertInput,
      selection?.start ?? 0,
      selection?.end ?? 0
    );
  };

  return (
    <div style={styles.container}>
      <div
        data-testid="insert-value-editor"
        onClick={() => ref.current?.focus()}
      >
        <EnrichedTextInput
          ref={ref}
          editable
          scrollEnabled
          autoFocus
          style={enrichedInputStyle}
          htmlStyle={WEB_DEFAULT_HTML_STYLE}
          onChangeHtml={(e) => {
            setEditorHtml(e.nativeEvent.value);
          }}
          onChangeState={(e) => {
            setEditorState(e.nativeEvent);
          }}
          onChangeSelection={(e) => {
            setSelection({
              start: e.nativeEvent.start,
              end: e.nativeEvent.end,
              text: e.nativeEvent.text,
            });
          }}
        />
      </div>

      <Toolbar
        editorRef={ref}
        state={editorState}
        onOpenLinkModal={() => {}}
        onOpenImageModal={() => {}}
      />

      <div style={styles.controls}>
        <button
          type="button"
          data-testid="focus-button"
          onClick={() => ref.current?.focus()}
        >
          Focus
        </button>
        <button type="button" data-testid="clear-button" onClick={handleClear}>
          Clear
        </button>
      </div>

      <label htmlFor="setup-html-input">Setup HTML</label>
      <textarea
        id="setup-html-input"
        data-testid="setup-html-input"
        value={setupHtmlInput}
        onChange={(e: ChangeEvent<HTMLTextAreaElement>) => {
          setSetupHtmlInput(e.target.value);
        }}
        rows={3}
        style={styles.textInput}
      />
      <button
        type="button"
        data-testid="setup-set-value-button"
        onClick={handleSetValue}
      >
        Set value
      </button>

      <div style={styles.selectionControls}>
        <label htmlFor="insert-value-selection-start">Selection start</label>
        <input
          id="insert-value-selection-start"
          data-testid="insert-value-selection-start"
          type="number"
          value={selectionStartInput}
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            setSelectionStartInput(e.target.value);
          }}
        />
        <label htmlFor="insert-value-selection-end">Selection end</label>
        <input
          id="insert-value-selection-end"
          data-testid="insert-value-selection-end"
          type="number"
          value={selectionEndInput}
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            setSelectionEndInput(e.target.value);
          }}
        />
        <button
          type="button"
          data-testid="insert-value-apply-selection-button"
          onClick={handleApplySelection}
        >
          Apply selection
        </button>
      </div>

      <label htmlFor="insert-value-input">Insert value HTML</label>
      <textarea
        id="insert-value-input"
        data-testid="insert-value-input"
        value={insertInput}
        onChange={(e: ChangeEvent<HTMLTextAreaElement>) => {
          setInsertInput(e.target.value);
        }}
        rows={3}
        style={styles.textInput}
      />
      <button
        type="button"
        data-testid="insert-value-submit-button"
        onClick={handleInsert}
      >
        Insert value
      </button>

      <pre
        data-testid="insert-value-html-output"
        style={styles.htmlOutput}
        aria-hidden
      >
        {editorHtml}
      </pre>
      <span data-testid="insert-value-current-selection-end" hidden>
        {selection?.end ?? 0}
      </span>
    </div>
  );
}

const styles = {
  container: {
    padding: '16px',
  },
  controls: {
    display: 'flex',
    gap: '8px',
    marginTop: '12px',
    marginBottom: '12px',
  },
  selectionControls: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '8px',
    alignItems: 'center' as const,
    marginBottom: '12px',
  },
  textInput: {
    display: 'block',
    width: '100%',
    marginTop: '4px',
    marginBottom: '8px',
    fontFamily: 'ui-monospace, monospace',
    fontSize: 12,
  },
  htmlOutput: {
    position: 'absolute',
    width: 1,
    height: 1,
    overflow: 'hidden',
    clip: 'rect(0 0 0 0)',
    whiteSpace: 'pre-wrap',
  },
} as const;

const enrichedInputStyle: EnrichedInputStyle = {
  width: '100%',
  minHeight: 24,
  maxWidth: 350,
  paddingVertical: 10,
  paddingHorizontal: 12,
  backgroundColor: 'gainsboro',
  fontSize: 16,
  lineHeight: 22,
  fontFamily: 'Helvetica Neue',
};
