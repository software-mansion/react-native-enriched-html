import { Editor, type ChainedCommands } from '@tiptap/core';
import { runSafelyInEditor } from './runSafelyInEditor';
export function runFocused(
  editor: Editor,
  apply: (chain: ChainedCommands) => ChainedCommands
) {
  runSafelyInEditor(editor, (e) => apply(e.chain().focus()).run());
}
