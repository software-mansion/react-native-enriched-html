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

    // the edit replaced the whole mention, so nothing of it is left; deleting
    // an inverted range would insert a copy of the replaced text instead
    if (
      newFrom >= newTo ||
      (removeContent && wholeRangeReplaced(transactions, from, to))
    ) {
      if (removeContent) {
        stripInheritedMark(
          tr,
          tr.mapping.map(Math.min(newFrom, newTo)),
          tr.mapping.map(Math.max(newFrom, newTo)),
          mark
        );
      }
      continue;
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

  // mentions that came in with text that doesn't match them (setValue,
  // defaultValue, paste) have no old version to compare with
  if (removeContent) {
    const mismatched = mergeContiguousSameMarkRanges(
      collectMentionMarkRanges(tr.doc, mentionType)
    ).filter(
      ({ from, to, mark }) =>
        collapseSpaces(tr.doc.textBetween(from, to)) !==
        collapseSpaces(mark.attrs.text as string)
    );
    // from the end, so earlier positions stay valid
    for (const { from, to } of mismatched.reverse()) {
      tr.delete(from, to);
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
    if (prev && prev.mark.eq(range.mark) && prev.to === range.from) {
      prev.to = range.to;
    } else {
      merged.push({ ...range });
    }
  }
  return merged;
}

// HTML parsing collapses runs of spaces, which the text attribute keeps
function collapseSpaces(text: string): string {
  return text.replace(/\s+/g, ' ');
}

// whether one step replaced the whole range, e.g. text typed over a selected
// mention or a new value set over it
function wholeRangeReplaced(
  transactions: readonly Transaction[],
  from: number,
  to: number
): boolean {
  let currentFrom = from;
  let currentTo = to;
  for (const t of transactions) {
    for (const map of t.mapping.maps) {
      let replaced = false;
      map.forEach((oldStart, oldEnd) => {
        if (oldStart <= currentFrom && oldEnd >= currentTo) replaced = true;
      });
      if (replaced) return true;
      currentFrom = map.map(currentFrom, 1);
      currentTo = map.map(currentTo, -1);
    }
  }
  return false;
}

// text typed over a whole mention reuses the mention's mark instance, while
// new content (setValue, paste) comes with its own instances
function stripInheritedMark(
  tr: Transaction,
  from: number,
  to: number,
  mark: Mark
): void {
  const inherited = mergeContiguousSameMarkRanges(
    collectMentionMarkRanges(tr.doc, mark.type)
  ).filter(
    (range) =>
      range.from >= from &&
      range.to <= to &&
      range.mark === mark &&
      collapseSpaces(tr.doc.textBetween(range.from, range.to)) !==
        collapseSpaces(mark.attrs.text as string)
  );
  for (const range of inherited) {
    tr.removeMark(range.from, range.to, mark);
  }
}
