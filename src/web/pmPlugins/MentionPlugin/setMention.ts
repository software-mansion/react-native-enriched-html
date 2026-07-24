import { Fragment } from '@tiptap/pm/model';
import { TextSelection } from '@tiptap/pm/state';
import type { Editor } from '@tiptap/react';
import { isCaretInBlockedContext } from './isCaretInBlockedContext';
import { mentionPluginKey } from './mentionPluginKey';

// Insert a mention mark at the current active trigger range.
export function setMention(
  editor: Editor,
  indicator: string,
  text: string,
  attributes?: Record<string, string>
): void {
  const { state } = editor;
  const triggerState = mentionPluginKey.getState(state);

  if (!triggerState?.active) {
    console.warn(
      '[EnrichedMention] setMention called but there is no active mention trigger'
    );
    return;
  }

  const mentionType = state.schema.marks.mention;
  if (!mentionType) return;

  const $from = state.selection.$from;
  if (isCaretInBlockedContext($from, state.schema)) {
    console.warn(
      '[EnrichedMention] setMention called but caret is inside a blocked context'
    );
    return;
  }

  const { from, to } = triggerState;

  // avoid inserting a space if there already is one
  const parentEnd = state.doc.resolve(to).end();
  let hasSpaceAfter = false;
  if (to < parentEnd) {
    const charAfter = state.doc.textBetween(to, to + 1, '');
    hasSpaceAfter = /\s/.test(charAfter);
  }

  const mentionMark = mentionType.create({
    indicator,
    text,
    attributes: attributes ?? {},
  });
  const baseMarks = state.doc
    .resolve(from)
    .marks()
    .filter((m) => m.type.name !== 'mention');

  const nodes = [state.schema.text(text, mentionMark.addToSet(baseMarks))];
  if (!hasSpaceAfter) {
    nodes.push(state.schema.text(' ', baseMarks));
  }
  const fragment = Fragment.fromArray(nodes);

  editor
    .chain()
    .focus()
    .command(({ tr }) => {
      tr.replaceWith(from, to, fragment);

      const targetPos = from + fragment.size + (hasSpaceAfter ? 1 : 0);
      tr.setSelection(TextSelection.create(tr.doc, targetPos));

      return true;
    })
    .run();
}
