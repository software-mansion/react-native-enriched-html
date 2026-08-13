import { Mark } from '@tiptap/core';
import type { Attrs } from '@tiptap/pm/model';

type CustomStyleAttrs = {
  foregroundColor?: string | null;
  backgroundColor?: string | null;
  fontSize?: number | null;
  fontFamily?: string | null;
};

function normalizeFontFamily(value: string | null | undefined): string | null {
  if (!value) return null;

  let fontFamily = value.trim();
  const commaIndex = fontFamily.indexOf(',');
  if (commaIndex !== -1) {
    fontFamily = fontFamily.slice(0, commaIndex).trim();
  }

  if (
    (fontFamily.startsWith("'") && fontFamily.endsWith("'")) ||
    (fontFamily.startsWith('"') && fontFamily.endsWith('"'))
  ) {
    fontFamily = fontFamily.slice(1, -1);
  }

  return fontFamily.length > 0 ? fontFamily : null;
}

function resolveFontSize(value: number | null | undefined): number | null {
  if (value == null || value <= 0) return null;
  return value;
}

function parseFontSize(value: string | null | undefined): number | null {
  if (!value) return null;
  const trimmed = value.trim();
  const match = /^([0-9.]+)\s*(?:px)?$/i.exec(trimmed);
  if (!match) return null;
  const n = parseFloat(match[1]!);
  return !Number.isNaN(n) && n > 0 ? n : null;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    customStyle: {
      setCustomStyle: (attrs: CustomStyleAttrs) => ReturnType;
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
      fontSize: {
        default: null,
        parseHTML: (el: HTMLElement) => parseFontSize(el.style.fontSize),
      },
      fontFamily: {
        default: null,
        parseHTML: (el: HTMLElement) =>
          normalizeFontFamily(el.style.fontFamily),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span',
        getAttrs: (el: HTMLElement) => {
          if (
            !el.style.color &&
            !el.style.backgroundColor &&
            !el.style.fontSize &&
            !el.style.fontFamily
          ) {
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
    if (mark.attrs.fontSize) {
      parts.push(`font-size: ${mark.attrs.fontSize}px`);
    }
    if (mark.attrs.fontFamily) {
      const fontFamily = mark.attrs.fontFamily as string;
      // if the font family contains a space, wrap it in quotes
      parts.push(
        /\s/.test(fontFamily)
          ? `font-family: '${fontFamily}'`
          : `font-family: ${fontFamily}`
      );
    }
    return ['span', { style: parts.join('; ') }, 0];
  },

  addKeyboardShortcuts() {
    return {
      Backspace: ({ editor }) => {
        const { state } = editor;
        const { selection } = state;
        if (!selection.empty) return false;

        const { $from } = selection;
        if (!$from.nodeBefore) return false;

        const markType = state.schema.marks.customStyle;
        const beforeHasMark = markType?.isInSet($from.nodeBefore.marks);
        const afterHasMark =
          $from.nodeAfter && markType?.isInSet($from.nodeAfter.marks);

        if (beforeHasMark || !afterHasMark) return false;

        // Cursor sits right at the plain-styled boundary.
        // Handle deletion ourselves so Chrome's contenteditable
        // normalization never touches the styled <span>.
        const tr = state.tr.delete($from.pos - 1, $from.pos);
        editor.view.dispatch(tr);
        return true;
      },
    };
  },

  addCommands() {
    return {
      setCustomStyle:
        (attrs) =>
        ({ state, tr, dispatch }) => {
          const markType = state.schema.marks.customStyle;
          if (!markType) return false;

          // Only the fields explicitly present in `attrs` should override.
          // Everything else must be preserved per existing inline run, so a
          // selection spanning multiple fonts/colors keeps its differences.
          const patch: CustomStyleAttrs = {};
          if ('foregroundColor' in attrs) {
            patch.foregroundColor = attrs.foregroundColor ?? null;
          }
          if ('backgroundColor' in attrs) {
            patch.backgroundColor = attrs.backgroundColor ?? null;
          }
          if ('fontSize' in attrs) {
            patch.fontSize = resolveFontSize(attrs.fontSize);
          }
          if ('fontFamily' in attrs) {
            patch.fontFamily = normalizeFontFamily(attrs.fontFamily);
          }

          const mergeAttrs = (
            existing: Attrs | undefined
          ): Required<CustomStyleAttrs> => ({
            foregroundColor: existing?.foregroundColor || null,
            backgroundColor: existing?.backgroundColor || null,
            fontSize: resolveFontSize(existing?.fontSize),
            fontFamily: normalizeFontFamily(existing?.fontFamily),
            ...patch,
          });

          const isEmpty = (a: Required<CustomStyleAttrs>) =>
            !a.foregroundColor &&
            !a.backgroundColor &&
            !a.fontSize &&
            !a.fontFamily;

          const { selection } = state;

          if (selection.empty) {
            // Cursor only: merge into the stored (typing) mark.
            const existing = markType.isInSet(
              state.storedMarks ?? selection.$from.marks()
            );
            const merged = mergeAttrs(existing?.attrs);
            if (dispatch) {
              if (isEmpty(merged)) {
                tr.removeStoredMark(markType);
              } else {
                tr.addStoredMark(markType.create(merged));
              }
              dispatch(tr);
            }
            return true;
          }

          if (dispatch) {
            selection.ranges.forEach((range) => {
              const rFrom = range.$from.pos;
              const rTo = range.$to.pos;
              state.doc.nodesBetween(rFrom, rTo, (node, pos) => {
                // Only inline runs carry the mark; block nodes are skipped so
                // per-run attributes are preserved. ProseMirror's addMark step
                // itself skips any inline node that disallows the mark type.
                if (!node.isInline) {
                  return;
                }
                const start = Math.max(pos, rFrom);
                const end = Math.min(pos + node.nodeSize, rTo);
                if (start >= end) return;

                const existing = markType.isInSet(node.marks);
                const merged = mergeAttrs(existing?.attrs);

                tr.removeMark(start, end, markType);
                if (!isEmpty(merged)) {
                  tr.addMark(start, end, markType.create(merged));
                }
              });
            });
            dispatch(tr);
          }
          return true;
        },
    };
  },
});
