import { Fragment } from '@tiptap/pm/model';
import type { Node } from '@tiptap/pm/model';

// Drops the mention mark from pasted text that doesn't match the mention, or
// with removeContent the text as well
export function stripPartialMentionMarks(
  fragment: Fragment,
  removeContent = false
): Fragment {
  const nodes: Node[] = [];
  fragment.forEach((node) => {
    if (!node.isText) {
      nodes.push(
        node.copy(stripPartialMentionMarks(node.content, removeContent))
      );
      return;
    }
    const isPartialMention = node.marks.some(
      (m) => m.type.name === 'mention' && node.text !== (m.attrs.text as string)
    );
    if (!isPartialMention) {
      nodes.push(node);
    } else if (!removeContent) {
      nodes.push(
        node.mark(node.marks.filter((m) => m.type.name !== 'mention'))
      );
    }
  });
  return Fragment.from(nodes);
}
