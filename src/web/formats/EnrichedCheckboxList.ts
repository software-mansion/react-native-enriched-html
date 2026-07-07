import { type CommandProps } from '@tiptap/core';
import { TaskList } from '@tiptap/extension-list';

import { applyWrappingListToSelection } from './applyWrappingListToSelection';
import { withPreservedAlignment } from './formatRules';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    checkboxList: {
      toggleCheckboxList: (checked: boolean) => ReturnType;
    };
  }
}

export const EnrichedCheckboxList = TaskList.extend({
  name: 'checkboxList',

  addOptions() {
    return {
      itemTypeName: 'checkboxItem',
      HTMLAttributes: {},
    };
  },

  addCommands() {
    return {
      toggleCheckboxList: (checked: boolean) => {
        return ({ editor, chain }: CommandProps): boolean => {
          if (editor.isActive('checkboxList')) {
            return withPreservedAlignment(editor, chain(), (c) =>
              c.clearNodes().setParagraph()
            );
          }

          return applyWrappingListToSelection(
            editor,
            chain,
            'checkboxList',
            'checkboxItem',
            { checked }
          );
        };
      },
    };
  },

  addKeyboardShortcuts() {
    return {};
  },
});
