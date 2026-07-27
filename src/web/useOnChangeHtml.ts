import { type Editor } from '@tiptap/react';
import type { OnChangeHtmlEvent, SanitizationConfig } from '../types';
import type { NativeSyntheticEvent } from 'react-native';
import { useOnEditorChange } from './useOnEditorChange';
import { normalizeHtmlFromTiptap } from './normalization/tiptapHtmlNormalizer';

export const useOnChangeHtml = (
  editor: Editor,
  onChangeHtml?: (e: NativeSyntheticEvent<OnChangeHtmlEvent>) => void,
  sanitizationConfig?: SanitizationConfig
) => {
  useOnEditorChange(editor, onChangeHtml, (e) =>
    normalizeHtmlFromTiptap(e.getHTML(), sanitizationConfig)
  );
};
