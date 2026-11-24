import { Fragment, Schema } from '@tiptap/pm/model';
import { stripPartialMentionMarks } from '../pmPlugins/MentionPlugin/stripPartialMentionMarks';

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

const mentioned = (text: string, attrText: string) =>
  schema.text(text, [schema.marks.mention!.create({ text: attrText })]);

// "Hi @Jake and @John", where "@Jake" claims to be "@Jane"
const pasted = Fragment.from(
  schema.node('paragraph', null, [
    schema.text('Hi '),
    mentioned('@Jake', '@Jane'),
    schema.text(' and '),
    mentioned('@John', '@John'),
  ])
);

const mentionTexts = (fragment: Fragment) => {
  const texts: string[] = [];
  fragment.descendants((node) => {
    if (node.isText && schema.marks.mention!.isInSet(node.marks)) {
      texts.push(node.text!);
    }
  });
  return texts;
};

describe('stripPartialMentionMarks', () => {
  test('keeps the text of a pasted mismatched mention by default', () => {
    const result = stripPartialMentionMarks(pasted);

    expect(result.firstChild!.textContent).toBe('Hi @Jake and @John');
    expect(mentionTexts(result)).toEqual(['@John']);
  });

  test('drops the text of a pasted mismatched mention with removeContent', () => {
    const result = stripPartialMentionMarks(pasted, true);

    expect(result.firstChild!.textContent).toBe('Hi  and @John');
    expect(mentionTexts(result)).toEqual(['@John']);
  });
});
