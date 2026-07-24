import { type CommandProps } from '@tiptap/core';
import { BulletList } from '@tiptap/extension-list';

import { applyWrappingListToSelection } from './applyWrappingListToSelection';
import { withPreservedAlignment } from './formatRules';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    unorderedList: {
      toggleUnorderedList: () => ReturnType;
    };
  }
}

export const EnrichedUnorderedList = BulletList.extend({
  name: 'unorderedList',

  addInputRules() {
    return [];
  },

  addKeyboardShortcuts() {
    return {};
  },

  addCommands() {
    return {
      toggleUnorderedList:
        () =>
        ({ editor, chain }: CommandProps) => {
          if (editor.isActive('unorderedList')) {
            return withPreservedAlignment(editor, chain(), (c) =>
              c.clearNodes().setParagraph()
            );
          }

          return applyWrappingListToSelection(
            editor,
            chain,
            'unorderedList',
            'listItem'
          );
        },
    };
  },
});
