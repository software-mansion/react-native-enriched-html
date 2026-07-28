import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

// Finds the ordered list markers with the largest values,
// exposing the digit count as --et-ol-digits per <ol>.
export const OrderedListMarkerWidthPlugin = Extension.create({
  name: 'orderedListMarkerWidth',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('orderedListMarkerWidth'),
        props: {
          decorations: (state) => {
            const decorations: Decoration[] = [];

            state.doc.descendants((node, pos) => {
              if (node.type.name !== 'orderedList') {
                return true;
              }

              const maxNumber = Math.max(0, node.childCount);
              const digits = String(maxNumber).length;

              decorations.push(
                Decoration.node(pos, pos + node.nodeSize, {
                  style: `--et-ol-digits:${digits}`,
                })
              );

              return false;
            });

            return DecorationSet.create(state.doc, decorations);
          },
        },
      }),
    ];
  },
});
