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

  test('removes a mention when a character is replaced, like autocorrect', () => {
    const { doc } = run((state) => state.tr.insertText('k', 7, 8), true);

    expect(doc.textContent).toBe('Hi  and @John ');
  });

  test('ignores typing right after a mention', () => {
    const { fix } = run((state) => state.tr.insertText('x', 9), true);

    expect(fix).toBeNull();
  });

  test('leaves text that replaced a whole mention alone', () => {
    // select "i @Jane a" and type "Z"
    const { doc } = run((state) => state.tr.insertText('Z', 2, 11), true);

    expect(doc.textContent).toBe('HZnd @John ');
    expect(mentionTexts(doc)).toEqual(['@John']);
  });

  test('keeps text typed over exactly a mention, without the mark', () => {
    // select "@Jane" and type "Z"
    const { doc } = run((state) => state.tr.insertText('Z', 4, 9), true);

    expect(doc.textContent).toBe('Hi Z and @John ');
    expect(mentionTexts(doc)).toEqual(['@John']);
  });

  test('keeps a mention set again with the same content', () => {
    const { doc } = run(
      (state) =>
        state.tr.replaceWith(0, state.doc.content.size, state.doc.content),
      true
    );

    expect(mentionTexts(doc)).toEqual(['@Jane', '@John']);
  });

  test('leaves text that replaced the whole document alone', () => {
    // select all and type "x"
    const { doc } = run(
      (state) => state.tr.insertText('x', 1, state.doc.content.size - 1),
      true
    );

    expect(doc.textContent).toBe('x');
  });

  test('keeps new content set over the old mentions as is', () => {
    const newContent = schema.node('doc', null, [
      schema.node('paragraph', null, [schema.text('New text')]),
    ]).content;
    const { doc } = run(
      (state) => state.tr.replaceWith(0, state.doc.content.size, newContent),
      true
    );

    expect(doc.textContent).toBe('New text');
  });

  test('removes a mention set with text that does not match it', () => {
    const newContent = schema.node('doc', null, [
      schema.node('paragraph', null, [
        schema.text('Hi '),
        schema.text('@Jake', [schema.marks.mention!.create({ text: '@Jane' })]),
        schema.text(' and '),
        mention('@John'),
      ]),
    ]).content;
    const set = (state: EditorState) =>
      state.tr.replaceWith(0, state.doc.content.size, newContent);

    expect(run(set, true).doc.textContent).toBe('Hi  and @John');
    expect(run(set, false).fix).toBeNull();
  });

  test('keeps a mention split into two text nodes with equal marks', () => {
    const newContent = schema.node('doc', null, [
      schema.node('paragraph', null, [
        schema.text('@Ja', [schema.marks.mention!.create({ text: '@Jane' })]),
        schema.text('ne', [schema.marks.mention!.create({ text: '@Jane' })]),
      ]),
    ]).content;
    const { fix } = run(
      (state) => state.tr.replaceWith(0, state.doc.content.size, newContent),
      true
    );

    expect(fix).toBeNull();
  });

  test('keeps a mention whose spaces were collapsed by the HTML parser', () => {
    const newContent = schema.node('doc', null, [
      schema.node('paragraph', null, [
        schema.text('@John Doe', [
          schema.marks.mention!.create({ text: '@John  Doe' }),
        ]),
      ]),
    ]).content;
    const { fix } = run(
      (state) => state.tr.replaceWith(0, state.doc.content.size, newContent),
      true
    );

    expect(fix).toBeNull();
  });

  test('removes two changed mentions in one edit', () => {
    const { doc } = run((state) => state.tr.delete(8, 16), true);

    expect(doc.textContent).toBe('Hi  ');
    expect(mentionTexts(doc)).toEqual([]);
  });
});
