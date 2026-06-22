import { Mark } from '@tiptap/core';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    customStyle: {
      setCustomStyle: (attrs: {
        foregroundColor?: string | null;
        backgroundColor?: string | null;
      }) => ReturnType;
      unsetCustomStyle: () => ReturnType;
    };
  }
}

export const EnrichedCustomStyle = Mark.create({
  name: 'customStyle',

  // Priority must be higher than inline marks (code: 1000, mention: 1000) so
  // the inline marks will override the customStyle.
  priority: 1001,

  addAttributes() {
    return {
      foregroundColor: {
        default: null,
        parseHTML: (el: HTMLElement) => el.style.color || null,
      },
      backgroundColor: {
        default: null,
        parseHTML: (el: HTMLElement) => el.style.backgroundColor || null,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span',
        getAttrs: (el: HTMLElement) => {
          if (!el.style.color && !el.style.backgroundColor) {
            return false;
          }
          // let addAttributes handle the actual parsing
          return null;
        },
      },
    ];
  },

  renderHTML({ mark }) {
    const parts: string[] = [];
    if (mark.attrs.foregroundColor) {
      parts.push(`color: ${mark.attrs.foregroundColor}`);
    }
    if (mark.attrs.backgroundColor) {
      parts.push(`background-color: ${mark.attrs.backgroundColor}`);
    }
    return ['span', { style: parts.join('; ') }, 0];
  },

  addCommands() {
    return {
      setCustomStyle:
        (attrs) =>
        ({ chain, editor }) => {
          const current = editor.getAttributes('customStyle');
          const resolvedColor =
            'foregroundColor' in attrs
              ? attrs.foregroundColor
              : current.foregroundColor;
          const resolvedBg =
            'backgroundColor' in attrs
              ? attrs.backgroundColor
              : current.backgroundColor;

          if (!resolvedColor && !resolvedBg) {
            return chain().unsetMark('customStyle').run();
          }

          return chain()
            .setMark('customStyle', {
              foregroundColor: resolvedColor ?? null,
              backgroundColor: resolvedBg ?? null,
            })
            .run();
        },

      unsetCustomStyle:
        () =>
        ({ chain }) =>
          chain().unsetMark('customStyle').run(),
    };
  },
});
