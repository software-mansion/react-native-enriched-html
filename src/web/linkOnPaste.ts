/**
 * The `linkOnPaste` behavior: pasting clipboard content that consists solely
 * of a URL over a non-empty selection turns the selection into a link
 * pointing to that URL instead of replacing it.
 */

import type { Editor } from '@tiptap/react';

import { findAutolinkRangesInWord } from './pmPlugins/AutolinkPlugin/autolinkRegex';

/**
 * Returns a normalized href when the whole string is a single URL matching
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

  return /^https?:\/\//i.test(text) ? text : `https://${text}`;
}

export function handleLinkOnPaste(
  event: ClipboardEvent,
  getEditor: () => Editor | null,
  getLinkOnPaste: () => boolean | undefined,
  getLinkRegex: () => RegExp | null | undefined
): boolean {
  if (!getLinkOnPaste()) return false;

  const editor = getEditor();
  if (!editor) return false;

  const { from, to } = editor.state.selection;
  if (from === to) return false;

  const pasted = event.clipboardData?.getData('text/plain').trim() ?? '';
  const href = linkUrlIfEntireString(pasted, getLinkRegex());
  if (!href) return false;

  const selectedText = editor.state.doc.textBetween(from, to, ' ');
  if (selectedText.trim().length === 0) return false;

  // setLink is overridden in EnrichedLink to bail out when the link style is
  // blocked (e.g. inside inline code or a code block); a `false` run result
  // falls through to the default paste handling.
  if (!editor.chain().setLink({ href }).run()) {
    return false;
  }

  event.preventDefault();
  editor.commands.setTextSelection(to);
  return true;
}
