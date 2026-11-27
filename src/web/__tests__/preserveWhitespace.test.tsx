import { act, createRef } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { EnrichedTextInput } from '../EnrichedTextInput';
import type { EnrichedTextInputInstance } from '../../types';

jest.mock('../EnrichedText.css', () => ({}));

const HTML =
  '<html><codeblock><p>  const x = 1;</p></codeblock><p>  hello   world </p></html>';

// Same document, with and without indentation between the block tags.
const COMPACT_HTML =
  '<html><p>first</p><ul><li>item</li></ul><codeblock><p>code</p></codeblock>' +
  '<ul data-type="checkbox"><li checked>task</li></ul></html>';
const PRETTY_HTML = COMPACT_HTML.replace(/></g, '>\n  <');

describe('EnrichedTextInput whitespace preservation', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  async function mount(defaultValue?: string, useHtmlNormalizer?: boolean) {
    const ref = createRef<EnrichedTextInputInstance>();
    act(() => {
      root.render(
        <EnrichedTextInput
          ref={ref}
          defaultValue={defaultValue}
          useHtmlNormalizer={useHtmlNormalizer}
        />
      );
    });
    // TipTap emits `create` on a timeout once the view is mounted.
    await act(() => new Promise<void>((resolve) => setTimeout(resolve, 20)));
    return ref.current!;
  }

  test.each([true, false])(
    'keeps spaces from defaultValue (useHtmlNormalizer=%s)',
    async (useHtmlNormalizer) => {
      const input = await mount(HTML, useHtmlNormalizer);
      expect(await input.getHTML()).toBe(HTML);
    }
  );

  test.each([true, false])(
    'keeps spaces from setValue (useHtmlNormalizer=%s)',
    async (useHtmlNormalizer) => {
      const input = await mount(undefined, useHtmlNormalizer);
      await act(async () => input.setValue(HTML));
      expect(await input.getHTML()).toBe(HTML);
    }
  );

  test.each([true, false])(
    'ignores line breaks between blocks (useHtmlNormalizer=%s)',
    async (useHtmlNormalizer) => {
      const input = await mount(PRETTY_HTML, useHtmlNormalizer);
      expect(await input.getHTML()).toBe(COMPACT_HTML);
    }
  );
});
