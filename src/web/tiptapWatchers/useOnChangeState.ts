import { useEffect, useRef } from 'react';
import { type Editor } from '@tiptap/react';
import type { OnChangeStateEvent } from '../../types';
import type { NativeSyntheticEvent } from 'react-native';
import { adaptWebToNativeEvent } from '../nativeMappers/adaptWebToNativeEvent';
import {
  getCurrentAlignment,
  isAnyParagraphFormatActive,
  isFormatBlocked,
} from '../formats/formatRules';
import type { HtmlStyle } from '../../types';
import { normalizeColorToHex } from '../normalization/colorNormalizer';

export const useOnChangeState = (
  editor: Editor | null,
  htmlStyle: Required<HtmlStyle>,
  onChangeState?: (e: NativeSyntheticEvent<OnChangeStateEvent>) => void
) => {
  const lastStateHashRef = useRef<string | null>(null);

  useEffect(() => {
    if (!editor || !onChangeState) return;

    const handleUpdate = () => {
      const state = buildState(editor, htmlStyle);
      const stateHash = hashState(state);

      if (lastStateHashRef.current === stateHash) {
        return;
      }

      lastStateHashRef.current = stateHash;
      onChangeState(adaptWebToNativeEvent(null, state));
    };

    handleUpdate();
    editor.on('transaction', handleUpdate);

    return () => {
      editor.off('transaction', handleUpdate);
    };
  }, [editor, onChangeState, htmlStyle]);
};

function buildState(
  editor: Editor,
  htmlStyle: Required<HtmlStyle>
): OnChangeStateEvent {
  const isAnyBlockActive = isAnyParagraphFormatActive(editor);

  function inlineFormat(tiptapName: string, isConflicting: boolean) {
    return {
      isActive: editor.isActive(tiptapName),
      isConflicting,
      isBlocking: isFormatBlocked(tiptapName, editor, htmlStyle),
    };
  }

  function paragraphFormat(isActive: boolean, additionalIsConflicting = false) {
    return {
      isActive,
      isConflicting: (!isActive && isAnyBlockActive) || additionalIsConflicting,
      isBlocking: false,
    };
  }

  const customStyle = getCurrentCustomStyleAttributes(editor);

  return {
    bold: inlineFormat('bold', false),
    italic: inlineFormat('italic', false),
    underline: inlineFormat('underline', false),
    strikeThrough: inlineFormat('strike', false),
    inlineCode: inlineFormat('code', editor.isActive('link')),
    h1: paragraphFormat(editor.isActive('heading', { level: 1 })),
    h2: paragraphFormat(editor.isActive('heading', { level: 2 })),
    h3: paragraphFormat(editor.isActive('heading', { level: 3 })),
    h4: paragraphFormat(editor.isActive('heading', { level: 4 })),
    h5: paragraphFormat(editor.isActive('heading', { level: 5 })),
    h6: paragraphFormat(editor.isActive('heading', { level: 6 })),
    blockQuote: paragraphFormat(editor.isActive('blockquote')),
    codeBlock: paragraphFormat(
      editor.isActive('codeBlock'),
      editor.isActive('link')
    ),
    orderedList: paragraphFormat(editor.isActive('orderedList')),
    unorderedList: paragraphFormat(editor.isActive('unorderedList')),
    checkboxList: paragraphFormat(editor.isActive('checkboxList')),
    link: inlineFormat(
      'link',
      editor.isActive('code') ||
        editor.isActive('link') ||
        editor.isActive('codeBlock')
    ),
    mention: inlineFormat(
      'mention',
      editor.isActive('code') || editor.isActive('codeBlock')
    ),
    image: {
      isActive: editor.isActive('image'),
      isConflicting: editor.isActive('link'),
      isBlocking: isFormatBlocked('image', editor, htmlStyle),
    },
    alignment: getCurrentAlignment(editor) ?? 'auto',
    customStyle: {
      foregroundColor: toHexColor(customStyle.foregroundColor),
      backgroundColor: toHexColor(customStyle.backgroundColor),
      fontSize: customStyle.fontSize ?? 0,
      fontFamily: customStyle.fontFamily ?? '',
    },
  };
}

function toHexColor(color: string | null | undefined): string {
  return normalizeColorToHex(color) ?? color ?? '';
}

function getCurrentCustomStyleAttributes(editor: Editor): Record<string, any> {
  const { selection, doc, schema } = editor.state;
  if (selection.empty) {
    const marks = editor.state.storedMarks ?? selection.$from.marks();
    return schema.marks.customStyle?.isInSet(marks)?.attrs ?? {};
  }

  const foregroundColors = new Set<string | null>();
  const backgroundColors = new Set<string | null>();
  const fontSizes = new Set<number | null>();
  const fontFamilies = new Set<string | null>();

  doc.nodesBetween(selection.from, selection.to, (node) => {
    if (!node.isText) return;
    const attrs = schema.marks.customStyle?.isInSet(node.marks)?.attrs;
    foregroundColors.add(toHexColor(attrs?.foregroundColor) || null);
    backgroundColors.add(toHexColor(attrs?.backgroundColor) || null);
    fontSizes.add(attrs?.fontSize ?? null);
    fontFamilies.add(attrs?.fontFamily ?? null);
  });

  return {
    foregroundColor: getSingleValue(foregroundColors),
    backgroundColor: getSingleValue(backgroundColors),
    fontSize: getSingleValue(fontSizes),
    fontFamily: getSingleValue(fontFamilies),
  };
}

function getSingleValue<T>(values: Set<T | null>): T | null {
  return values.size === 1 ? ([...values][0] ?? null) : null;
}

function hashState(state: OnChangeStateEvent): string {
  const formatEntries = Object.entries(state).filter(
    ([key]) => key !== 'alignment' && key !== 'customStyle'
  );
  const formatHash = formatEntries
    .map(([, formatState]) => {
      const s = formatState as {
        isActive: boolean;
        isConflicting: boolean;
        isBlocking: boolean;
      };
      return String(getFormatHash(s.isActive, s.isConflicting, s.isBlocking));
    })
    .join('');

  return `${formatHash}|${state.alignment}|${state.customStyle.foregroundColor}|${state.customStyle.backgroundColor}|${state.customStyle.fontSize}|${state.customStyle.fontFamily}`;
}

function getFormatHash(
  isActive: boolean,
  isConflicting: boolean,
  isBlocking: boolean
): number {
  // eslint-disable-next-line no-bitwise
  return (+isActive << 2) | (+isConflicting << 1) | (+isBlocking << 0);
}
