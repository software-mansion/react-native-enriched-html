import type { Mark, MarkType, Node } from '@tiptap/pm/model';
import type { EditorState, Transaction } from '@tiptap/pm/state';

export type MentionMarkRange = { from: number; to: number; mark: Mark };

export function removeMentionMarksIfSpansResized(
  transactions: readonly Transaction[],
  oldState: EditorState,
  newState: EditorState,
  removeContent: boolean
): Transaction | null {
  if (!transactions.some((tr) => tr.docChanged)) return null;

  const mentionType = newState.schema.marks.mention;
  if (!mentionType) return null;

  const merged = mergeContiguousSameMarkRanges(
    collectMentionMarkRanges(oldState.doc, mentionType)
  );

  const tr = newState.tr;
  let changed = false;

  for (const { from, to, mark } of merged) {
    const origLen = to - from;
    let newFrom = from;
    let newTo = to;

    for (const t of transactions) {
      newFrom = t.mapping.map(newFrom, 1);
      newTo = t.mapping.map(newTo, -1);
    }

    const resized = newTo - newFrom !== origLen;
    const edited =
      removeContent &&
      newState.doc.textBetween(newFrom, newTo) !==
        oldState.doc.textBetween(from, to);

    if (resized || edited) {
      if (removeContent) {
        // earlier deletions in this transaction shift the positions
        tr.delete(tr.mapping.map(newFrom), tr.mapping.map(newTo));
      } else {
        tr.removeMark(newFrom, newTo, mark.type);
      }
      changed = true;
    }
  }

  return changed ? tr : null;
}

function collectMentionMarkRanges(
  doc: Node,
  mentionType: MarkType
): MentionMarkRange[] {
  const ranges: MentionMarkRange[] = [];
  doc.descendants((node, pos) => {
    if (!node.isText) return;
    const m = mentionType.isInSet(node.marks);
    if (m) ranges.push({ from: pos, to: pos + node.nodeSize, mark: m });
  });
  return ranges;
}

function mergeContiguousSameMarkRanges(
  ranges: MentionMarkRange[]
): MentionMarkRange[] {
  const merged: MentionMarkRange[] = [];
  for (const range of ranges) {
    const prev = merged[merged.length - 1];
    if (prev && prev.mark === range.mark && prev.to === range.from) {
      prev.to = range.to;
    } else {
      merged.push({ ...range });
    }
  }
  return merged;
}
