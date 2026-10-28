import type { EditorState, Transaction } from '@tiptap/pm/state';

// UTF-16 length of the last user-perceived character, so that deletion
// never splits combining marks, e.g. emojis.
export function lastGraphemeLength(text: string): number {
  if (!text) return 0;

  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    let last = '';
    for (const { segment } of new Intl.Segmenter(undefined, {
      granularity: 'grapheme',
    }).segment(text)) {
      last = segment;
    }
    return last.length;
  }

  // Fallback: at least keep surrogate pairs together
  const codePoints = Array.from(text);
  return codePoints[codePoints.length - 1]?.length ?? 0;
}

// Deletes one character before the collapsed cursor. Returns null
// when there is no inline content to delete.
export function deleteCharacterBackward(
  state: EditorState
): Transaction | null {
  const { selection } = state;
  if (!selection.empty) return null;

  const { $from } = selection;
  const nodeBefore = $from.nodeBefore;
  if (!nodeBefore) return null;

  const length = nodeBefore.isText
    ? lastGraphemeLength(nodeBefore.text ?? '')
    : nodeBefore.nodeSize;
  if (length === 0) return null;

  return state.tr.delete($from.pos - length, $from.pos);
}
