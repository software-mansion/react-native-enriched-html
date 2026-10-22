import { Editor } from '@tiptap/core';
import type { EditorView } from '@tiptap/pm/view';
import { runFocused } from '../utils/runFocused';

export function handleCheckboxPress(
  event: MouseEvent,
  editor: Editor,
  view: EditorView
): boolean {
  const target = event.target;
  if (target instanceof HTMLInputElement && target.type === 'checkbox') {
    const position = view.posAtDOM(target, 0);
    const node = view.state.doc.nodeAt(position);
    if (!node) return false;
    runFocused(editor, (c) => c.setTextSelection(position + node.nodeSize - 1));
    return true;
  }
  return false;
}
