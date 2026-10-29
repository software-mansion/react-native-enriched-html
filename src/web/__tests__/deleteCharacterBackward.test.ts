import { Schema, type Node as PMNode } from '@tiptap/pm/model';
import { EditorState, TextSelection } from '@tiptap/pm/state';
import {
  deleteCharacterBackward,
  lastGraphemeLength,
} from '../utils/deleteCharacterBackward';

const schema = new Schema({
  nodes: {
    doc: { content: 'paragraph+' },
    paragraph: { content: 'inline*', group: 'block' },
    text: { group: 'inline' },
    mention: { inline: true, group: 'inline', atom: true },
  },
});

// initialize tiptap's state and place the cursor at its end
function stateWith(...content: PMNode[]) {
  const doc = schema.node('doc', null, [
    schema.node('paragraph', null, content),
  ]);
  const state = EditorState.create({ doc });
  return state.apply(
    state.tr.setSelection(
      TextSelection.create(state.doc, state.doc.content.size - 1)
    )
  );
}

describe('lastGraphemeLength', () => {
  test.each([
    ['abc', 1],
    ['a😀', 2],
    ['a👨‍👩‍👧', '👨‍👩‍👧'.length],
    ['a🇵🇱', 4],
    ['aé', 2],
    ['', 0],
  ])('%j -> %i', (text, expected) => {
    expect(lastGraphemeLength(text)).toBe(expected);
  });
});

describe('deleteCharacterBackward', () => {
  test('deletes a whole emoji', () => {
    const state = stateWith(schema.text('a😀'));
    const tr = deleteCharacterBackward(state);
    expect(tr?.doc.textContent).toBe('a');
  });

  test('deletes a base letter together with its combining mark', () => {
    const state = stateWith(schema.text('aé'));
    expect(deleteCharacterBackward(state)?.doc.textContent).toBe('a');
  });

  test('deletes a non-text inline node as a whole', () => {
    const state = stateWith(schema.text('a'), schema.node('mention'));
    const tr = deleteCharacterBackward(state);
    expect(tr?.doc.firstChild?.childCount).toBe(1);
    expect(tr?.doc.textContent).toBe('a');
  });

  test('returns null at the start of a paragraph', () => {
    const state = stateWith();
    expect(deleteCharacterBackward(state)).toBeNull();
  });

  test('returns null for a non-empty selection', () => {
    const base = stateWith(schema.text('abc'));
    const state = base.apply(
      base.tr.setSelection(TextSelection.create(base.doc, 1, 3))
    );
    expect(deleteCharacterBackward(state)).toBeNull();
  });
});
