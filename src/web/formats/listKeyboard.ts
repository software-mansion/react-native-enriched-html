import { isTextSelection, type Editor } from '@tiptap/core';

import { lineStartBackspace } from './wrappedBlockKeyboard';
import { withPreservedAlignment } from './formatRules';

// Enter: extend the list — splitListItem fails on an empty item (see TipTap splitListItem),
// in which case the item gets lifted out, ending the list.
export function listEnter(editor: Editor, itemName: string): boolean {
  if (!editor.isActive(itemName)) {
    return false;
  }
  if (editor.chain().focus().splitListItem(itemName).scrollIntoView().run()) {
    return true;
  }

  const { selection } = editor.state;
  if (!selection.empty || !isTextSelection(selection)) {
    return false;
  }

  const $from = selection.$from;
  if ($from.parent.content.size > 0) {
    return false;
  }

  return withPreservedAlignment(editor, editor.chain(), (c) =>
    c.focus().liftListItem(itemName)
  );
}

// Backspace: first press at line start lifts the list item; second press (paragraph below list) joins backward.
export function listBackspace(
  editor: Editor,
  itemName: string,
  wrapperNames: readonly string[]
): boolean {
  return lineStartBackspace(editor, {
    isActive: () => editor.isActive(itemName),
    lift: () => {
      return withPreservedAlignment(editor, editor.chain(), (c) =>
        c.focus().liftListItem(itemName)
      );
    },
    shouldJoinBefore: (beforeName) =>
      beforeName != null && wrapperNames.includes(beforeName),
  });
}
