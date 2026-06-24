import { isTextSelection } from '@tiptap/core';
import { TextAlign } from '@tiptap/extension-text-align';

export const EnrichedTextAlign = TextAlign.extend({
  addCommands() {
    return {
      ...this.parent?.(),
      setTextAlign: (alignment) => (props) => {
        const { state, dispatch, tr } = props;

        if (!this.options.alignments.includes(alignment)) {
          return false;
        }

        const { $from } = state.selection;
        let listNode = null;
        let listPos = -1;

        // Walk up the tree to see if the cursor is inside a list wrapper
        for (let depth = $from.depth; depth > 0; depth--) {
          const node = $from.node(depth);
          if (
            ['orderedList', 'unorderedList', 'checkboxList'].includes(
              node.type.name
            )
          ) {
            listNode = node;
            listPos = $from.before(depth);
            break;
          }
        }

        // If in a list, manually apply the alignment to the parent wrapper
        if (listNode) {
          if (dispatch) {
            tr.setNodeMarkup(listPos, undefined, {
              ...listNode.attrs,
              textAlign: alignment,
            });
          }
          return true;
        }

        // If not in a list, fire the original Tiptap command
        return this.parent?.()?.setTextAlign?.(alignment)(props);
      },
    };
  },

  addKeyboardShortcuts() {
    return {
      ...this.parent?.(),
      Backspace: () => {
        const { selection } = this.editor.state;

        if (!selection.empty || !isTextSelection(selection)) {
          return false;
        }

        const { $cursor } = selection;

        if (!$cursor || !this.editor.isEmpty) {
          return false;
        }

        const currentAlignment = $cursor.parent.attrs.textAlign;
        const hasAlignment = currentAlignment && currentAlignment !== 'auto';

        // If the input is empty and has an alignment, clear the alignment
        if (hasAlignment) {
          return this.editor.commands.unsetTextAlign();
        }

        return false;
      },
    };
  },
}).configure({
  types: [
    'paragraph',
    'heading',
    'orderedList',
    'unorderedList',
    'checkboxList',
  ],
  defaultAlignment: null,
  alignments: ['left', 'center', 'right', 'justify'],
});
