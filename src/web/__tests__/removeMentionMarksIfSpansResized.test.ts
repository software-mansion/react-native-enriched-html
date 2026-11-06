import { Schema } from '@tiptap/pm/model';
import { EditorState, type Transaction } from '@tiptap/pm/state';
import { removeMentionMarksIfSpansResized } from '../pmPlugins/MentionPlugin/removeMentionMarksIfSpansResized';

const schema = new Schema({
  nodes: {
    doc: { content: 'paragraph+' },
    paragraph: { content: 'text*' },
    text: {},
  },
  marks: {
    mention: { attrs: { text: {} }, inclusive: false },
  },
});

const mention = (text: string) =>
  schema.text(text, [schema.marks.mention!.create({ text })]);

// "Hi @Jane and @John " with both names as mentions
function initialState() {
  const doc = schema.node('doc', null, [
    schema.node('paragraph', null, [
      schema.text('Hi '),
      mention('@Jane'),
      schema.text(' and '),
      mention('@John'),
      schema.text(' '),
    ]),
  ]);
  return EditorState.create({ doc });
}

function run(
  edit: (state: EditorState) => Transaction,
  removeContent: boolean
) {
  const oldState = initialState();
  const tr = edit(oldState);
  const newState = oldState.apply(tr);
  const fix = removeMentionMarksIfSpansResized(
    [tr],
    oldState,
    newState,
    removeContent
  );
  const finalState = fix ? newState.apply(fix) : newState;
  return { fix, doc: finalState.doc };
}

const mentionTexts = (doc: EditorState['doc']) => {
  const texts: string[] = [];
  doc.descendants((node) => {
    if (node.isText && schema.marks.mention!.isInSet(node.marks)) {
      texts.push(node.text!);
    }
  });
  return texts;
};

// positions: paragraph starts at 1, so "@Jane" covers 4..9 and "@John" 14..19
const typeInsideJane = (state: EditorState) => state.tr.insertText('x', 6);

describe('removeMentionMarksIfSpansResized', () => {
  test('keeps the text and drops the mark by default', () => {
    const { doc } = run(typeInsideJane, false);

    expect(doc.textContent).toBe('Hi @Jxane and @John ');
    expect(mentionTexts(doc)).toEqual(['@John']);
  });

  test('removes the whole mention with removeContent', () => {
    const { doc } = run(typeInsideJane, true);

    expect(doc.textContent).toBe('Hi  and @John ');
    expect(mentionTexts(doc)).toEqual(['@John']);
  });

  test('removes the mention when a character inside it is deleted', () => {
    const { doc } = run((state) => state.tr.delete(6, 7), true);

    expect(doc.textContent).toBe('Hi  and @John ');
  });

  test('ignores typing right after a mention', () => {
    const { fix } = run((state) => state.tr.insertText('x', 9), true);

    expect(fix).toBeNull();
  });

  test('removes two changed mentions in one edit', () => {
    const { doc } = run((state) => state.tr.delete(8, 16), true);

    expect(doc.textContent).toBe('Hi  ');
    expect(mentionTexts(doc)).toEqual([]);
  });
});
