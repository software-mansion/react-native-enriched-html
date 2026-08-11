import type { Fragment, Node } from '@tiptap/pm/model';
import { createNodeFromContent } from '@tiptap/core';
import type { Editor } from '@tiptap/react';

import {
  insertBlockContent,
  applyMarksToContent,
  isPlainEmptyDoc,
} from './insertBlockContent';
import { nativePosToTiptapPos, nativeLeafText } from './positionMapping';
import { prepareHtmlForTiptap } from './normalization/tiptapHtmlNormalizer';

export function insertValue(
  editor: Editor,
  value: string,
  start: number,
  end: number,
  useHtmlNormalizer: boolean | undefined
): void {
  if (!value) return;

  const doc = editor.state.doc;
  const docLength = nativeLeafText(doc, 0, doc.content.size).length;

  if (docLength === 0 && isPlainEmptyDoc(doc)) {
    editor.commands.setContent(prepareHtmlForTiptap(value, useHtmlNormalizer));
    return;
  }

  const from = nativePosToTiptapPos(doc, Math.min(start, docLength));
  const to = nativePosToTiptapPos(
    doc,
    Math.min(Math.max(start, end), docLength)
  );
  const content = prepareHtmlForTiptap(value, useHtmlNormalizer);

  const parsedRaw = createNodeFromContent(content, editor.schema, {
    parseOptions: { preserveWhitespace: 'full' as const },
  }) as Fragment;

  // Inherit active inline styles from the insertion start: toggled marks first,
  // otherwise the marks at [from], matching native selection-start semantics.
  const $from = editor.state.doc.resolve(from);
  const activeMarks = editor.state.storedMarks ?? $from.marks();
  const parsed = applyMarksToContent(parsedRaw, activeMarks);

  const blocks: Node[] = [];
  parsed.forEach((node) => blocks.push(node));

  const hasBlockContent = blocks.some((n) => n.isBlock);

  // Inline-only content (plain text, marks) inserts cleanly at the caret.
  if (!hasBlockContent) {
    editor.chain().focus().insertContentAt({ from, to }, parsed).run();
    return;
  }

  // Block content merges the incoming blocks with the current line.
  // Fall back to TipTap's insertion when the surrounding
  // structure can't accept the reconstructed blocks.
  const tr = editor.state.tr;
  if (insertBlockContent(tr, from, to, blocks)) {
    editor.view.focus();
    editor.view.dispatch(tr);
  } else {
    editor.chain().focus().insertContentAt({ from, to }, parsed).run();
  }
}
