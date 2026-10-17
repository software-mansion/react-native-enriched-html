/**
 * The `applyLinkOnPaste` behavior: pasting clipboard content that consists solely
 * of a URL over a non-empty selection turns the selection into a link
 * pointing to that URL instead of replacing it.
 */

import type { Editor } from '@tiptap/react';

import { findAutolinkRangesInWord } from '../pmPlugins/AutolinkPlugin/autolinkRegex';
import { setLink } from '../formats/EnrichedLink';
import {
  nativeLeafText,
  tiptapPosToNativePos,
} from '../nativeMappers/positionMapping';

/**
 * Returns a href when the whole string is a single word URL matching
 * the configured link regex, `null` otherwise. `linkRegex === null` means
 * link detection is disabled.
 */
function linkUrlIfEntireString(
  text: string,
  linkRegex: RegExp | null | undefined
): string | null {
  if (linkRegex === null || text.length === 0) {
    return null;
  }

  const ranges = findAutolinkRangesInWord(text, linkRegex);
  const isFullMatch = ranges.some(
    (r) => r.start === 0 && r.endExclusive === text.length
  );
  if (!isFullMatch) {
    return null;
  }

  return text;
}

export function handleApplyLinkOnPaste(
  event: ClipboardEvent,
  getEditor: () => Editor | null,
  getApplyLinkOnPaste: () => boolean | undefined,
  getLinkRegex: () => RegExp | null | undefined
): boolean {
  if (!getApplyLinkOnPaste()) return false;

  const editor = getEditor();
  if (!editor) return false;

  const { from, to } = editor.state.selection;
  if (from === to) return false;

  const pasted = event.clipboardData?.getData('text/plain').trim() ?? '';
  const href = linkUrlIfEntireString(pasted, getLinkRegex());
  if (!href) return false;

  const selectedText = nativeLeafText(editor.state.doc, from, to);
  if (selectedText.trim().length === 0) return false;

  const nativeFrom = tiptapPosToNativePos(editor.state.doc, from);
  const nativeTo = tiptapPosToNativePos(editor.state.doc, to);

  if (!setLink(editor, nativeFrom, nativeTo, selectedText, href)) return false;

  event.preventDefault();
  editor.commands.setTextSelection(to);
  return true;
}
