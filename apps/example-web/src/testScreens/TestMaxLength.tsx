import { useRef, useState, type ChangeEvent } from 'react';
import {
  EnrichedTextInput,
  type EnrichedInputStyle,
  type EnrichedTextInputInstance,
} from 'react-native-enriched-html';
import { WEB_DEFAULT_HTML_STYLE } from '../defaultHtmlStyle';

function toInteger(value: string): number {
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? 0 : parsed;
}

export function TestMaxLength() {
  const ref = useRef<EnrichedTextInputInstance>(null);
  const [maxLengthInput, setMaxLengthInput] = useState('10');
  const [htmlInput, setHtmlInput] = useState('<html><p></p></html>');
  const [editorHtml, setEditorHtml] = useState('');
  const [selStartInput, setSelStartInput] = useState('0');
  const [selEndInput, setSelEndInput] = useState('0');
  const [linkStartInput, setLinkStartInput] = useState('0');
  const [linkEndInput, setLinkEndInput] = useState('0');
  const [linkTextInput, setLinkTextInput] = useState('link');
  const [linkUrlInput, setLinkUrlInput] = useState('https://example.com');
  const [mentionIndicatorInput, setMentionIndicatorInput] = useState('@');
  const [mentionTextInput, setMentionTextInput] = useState('Jane');
  const [imageSrcInput, setImageSrcInput] = useState('/pw-e2e-ok.png');
  const [imageWidthInput, setImageWidthInput] = useState('40');
  const [imageHeightInput, setImageHeightInput] = useState('40');

  const maxLength =
    maxLengthInput.trim() === '' ? undefined : toInteger(maxLengthInput);

  return (
    <div data-testid="test-max-length-root">
      <div
        data-testid="test-max-length-editor"
        onClick={() => ref.current?.focus()}
      >
        <EnrichedTextInput
          ref={ref}
          defaultValue="<html><p></p></html>"
          editable
          scrollEnabled
          style={editorStyle}
          htmlStyle={WEB_DEFAULT_HTML_STYLE}
          maxLength={maxLength}
          mentionIndicators={['@', '#']}
          onChangeHtml={(e) => {
            setEditorHtml(e.nativeEvent.value);
          }}
        />
      </div>

      <div>
        <label>
          maxLength{' '}
          <input
            data-testid="test-max-length-maxlength-input"
            value={maxLengthInput}
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              setMaxLengthInput(e.target.value);
            }}
          />
        </label>
      </div>

      <textarea
        data-testid="test-max-length-html-input"
        value={htmlInput}
        onChange={(e: ChangeEvent<HTMLTextAreaElement>) => {
          setHtmlInput(e.target.value);
        }}
        rows={4}
      />
      <button
        type="button"
        data-testid="test-max-length-set-value-button"
        onClick={() => ref.current?.setValue(htmlInput)}
      >
        Set value
      </button>

      <div>
        <input
          data-testid="test-max-length-selection-start"
          type="number"
          value={selStartInput}
          onChange={(e) => {
            setSelStartInput(e.target.value);
          }}
        />
        <input
          data-testid="test-max-length-selection-end"
          type="number"
          value={selEndInput}
          onChange={(e) => {
            setSelEndInput(e.target.value);
          }}
        />
        <button
          type="button"
          data-testid="test-max-length-apply-selection-button"
          onClick={() =>
            ref.current?.setSelection(
              toInteger(selStartInput),
              toInteger(selEndInput)
            )
          }
        >
          setSelection
        </button>
      </div>

      <div>
        <input
          data-testid="test-max-length-setlink-start"
          type="number"
          value={linkStartInput}
          onChange={(e) => {
            setLinkStartInput(e.target.value);
          }}
        />
        <input
          data-testid="test-max-length-setlink-end"
          type="number"
          value={linkEndInput}
          onChange={(e) => {
            setLinkEndInput(e.target.value);
          }}
        />
        <input
          data-testid="test-max-length-setlink-text"
          value={linkTextInput}
          onChange={(e) => {
            setLinkTextInput(e.target.value);
          }}
        />
        <input
          data-testid="test-max-length-setlink-url"
          value={linkUrlInput}
          onChange={(e) => {
            setLinkUrlInput(e.target.value);
          }}
        />
        <button
          type="button"
          data-testid="test-max-length-apply-setlink-button"
          onClick={() =>
            ref.current?.setLink(
              toInteger(linkStartInput),
              toInteger(linkEndInput),
              linkTextInput,
              linkUrlInput
            )
          }
        >
          setLink
        </button>
      </div>

      <div>
        <input
          data-testid="test-max-length-mention-indicator"
          value={mentionIndicatorInput}
          onChange={(e) => {
            setMentionIndicatorInput(e.target.value);
          }}
        />
        <input
          data-testid="test-max-length-mention-text"
          value={mentionTextInput}
          onChange={(e) => {
            setMentionTextInput(e.target.value);
          }}
        />
        <button
          type="button"
          data-testid="test-max-length-set-mention-button"
          onMouseDown={(e) => {
            e.preventDefault();
          }}
          onClick={() =>
            ref.current?.setMention(mentionIndicatorInput, mentionTextInput, {
              id: '1',
            })
          }
        >
          setMention
        </button>
        <button
          type="button"
          data-testid="test-max-length-start-mention-button"
          onMouseDown={(e) => {
            e.preventDefault();
          }}
          onClick={() => ref.current?.startMention(mentionIndicatorInput)}
        >
          startMention
        </button>
      </div>

      <div>
        <input
          data-testid="test-max-length-image-src"
          value={imageSrcInput}
          onChange={(e) => {
            setImageSrcInput(e.target.value);
          }}
        />
        <input
          data-testid="test-max-length-image-width"
          type="number"
          value={imageWidthInput}
          onChange={(e) => {
            setImageWidthInput(e.target.value);
          }}
        />
        <input
          data-testid="test-max-length-image-height"
          type="number"
          value={imageHeightInput}
          onChange={(e) => {
            setImageHeightInput(e.target.value);
          }}
        />
        <button
          type="button"
          data-testid="test-max-length-set-image-button"
          onClick={() =>
            ref.current?.setImage(
              imageSrcInput,
              toInteger(imageWidthInput),
              toInteger(imageHeightInput)
            )
          }
        >
          setImage
        </button>
      </div>

      <pre data-testid="test-max-length-html-output">{editorHtml}</pre>
    </div>
  );
}

const editorStyle: EnrichedInputStyle = {
  width: '100%',
  maxWidth: 360,
  minHeight: 100,
  paddingVertical: 8,
  paddingHorizontal: 8,
  fontSize: 16,
};
