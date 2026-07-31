import { getSchema, createNodeFromContent } from '@tiptap/core';
import { EditorState } from '@tiptap/pm/state';
import type { Fragment, Node as PmNode } from '@tiptap/pm/model';
import Document from '@tiptap/extension-document';
import Paragraph from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';
import { EnrichedBold } from '../formats/EnrichedBold';
import { EnrichedItalic } from '../formats/EnrichedItalic';
import { EnrichedUnderline } from '../formats/EnrichedUnderline';
import { EnrichedStrike } from '../formats/EnrichedStrike';
import { EnrichedCode } from '../formats/EnrichedCode';
import { EnrichedLink } from '../formats/EnrichedLink';
import { EnrichedImage } from '../formats/EnrichedImage';
import { EnrichedMention } from '../formats/EnrichedMention';
import { EnrichedHeading } from '../formats/EnrichedHeading';
import { EnrichedBlockquote } from '../formats/EnrichedBlockquote';
import { EnrichedCodeBlock } from '../formats/EnrichedCodeBlock';
import { EnrichedListItem } from '../formats/EnrichedListItem';
import { EnrichedUnorderedList } from '../formats/EnrichedUnorderedList';
import { EnrichedOrderedList } from '../formats/EnrichedOrderedList';
import { EnrichedCheckboxItem } from '../formats/EnrichedCheckboxItem';
import { EnrichedCheckboxList } from '../formats/EnrichedCheckboxList';
import { EnrichedTextAlign } from '../formats/EnrichedTextAlign';
import { insertBlockContent, isPlainEmptyDoc } from '../insertBlockContent';
import { prepareHtmlForTiptap } from '../normalization/tiptapHtmlNormalizer';
import { nativePosToTiptapPos } from '../positionMapping';

const schema = getSchema([
  Document,
  Paragraph,
  Text,
  EnrichedBold,
  EnrichedItalic,
  EnrichedUnderline,
  EnrichedStrike,
  EnrichedCode,
  EnrichedLink.configure({ getLinkRegex: () => undefined }),
  EnrichedImage,
  EnrichedMention,
  EnrichedHeading,
  EnrichedBlockquote,
  EnrichedCodeBlock,
  EnrichedListItem,
  EnrichedCheckboxItem,
  EnrichedUnorderedList,
  EnrichedOrderedList,
  EnrichedCheckboxList,
  EnrichedTextAlign,
]);

function makeDoc(html: string): PmNode {
  return createNodeFromContent(prepareHtmlForTiptap(html, false), schema, {
    slice: false,
    parseOptions: { preserveWhitespace: 'full' },
  }) as PmNode;
}

function parseValue(value: string): PmNode[] {
  const content = prepareHtmlForTiptap(value, false);
  const parsed = createNodeFromContent(content, schema, {
    parseOptions: { preserveWhitespace: 'full' },
  }) as Fragment;
  const blocks: PmNode[] = [];
  parsed.forEach((node) => blocks.push(node));
  return blocks;
}

/** Runs insertBlockContent at a native (plain-text) caret position, like insertValue does. */
function runInsert(
  docHtml: string,
  value: string,
  nativeStart: number,
  nativeEnd = nativeStart
): { ok: boolean; doc: PmNode } {
  const doc = makeDoc(docHtml);
  const state = EditorState.create({ schema, doc });
  const from = nativePosToTiptapPos(doc, nativeStart);
  const to = nativePosToTiptapPos(doc, nativeEnd);
  const tr = state.tr;
  const ok = insertBlockContent(tr, from, to, parseValue(value));
  return { ok, doc: ok ? tr.doc : doc };
}

const CODEBLOCK_WORLD = '<html><codeblock>World</codeblock></html>';

describe('insertBlockContent', () => {
  describe('block content into list items', () => {
    it('merges a codeblock into the middle item, keeping the other items listed', () => {
      const { ok, doc } = runInsert(
        '<ul><li>one</li><li>asdfgh</li><li>two</li></ul>',
        CODEBLOCK_WORLD,
        4 + 3 // "one\n" + "asd"
      );
      expect(ok).toBe(true);
      expect(doc.toString()).toBe(
        'doc(unorderedList(listItem(paragraph("one"))), codeBlock(paragraph("asdWorldfgh")), unorderedList(listItem(paragraph("two"))))'
      );
    });

    it('merges a codeblock into the first item without leaving an empty list', () => {
      const { ok, doc } = runInsert(
        '<ul><li>asdfgh</li><li>two</li></ul>',
        CODEBLOCK_WORLD,
        3
      );
      expect(ok).toBe(true);
      expect(doc.toString()).toBe(
        'doc(codeBlock(paragraph("asdWorldfgh")), unorderedList(listItem(paragraph("two"))))'
      );
    });

    it('merges a codeblock into the last item without leaving an empty list', () => {
      const { ok, doc } = runInsert(
        '<ul><li>one</li><li>asdfgh</li></ul>',
        CODEBLOCK_WORLD,
        4 + 3
      );
      expect(ok).toBe(true);
      expect(doc.toString()).toBe(
        'doc(unorderedList(listItem(paragraph("one"))), codeBlock(paragraph("asdWorldfgh")))'
      );
    });

    it('replaces a single-item list when its only line absorbs the codeblock', () => {
      const { ok, doc } = runInsert(
        '<ul><li>asdfgh</li></ul>',
        CODEBLOCK_WORLD,
        3
      );
      expect(ok).toBe(true);
      expect(doc.toString()).toBe('doc(codeBlock(paragraph("asdWorldfgh")))');
    });

    it('merges at the start and end edges of a middle item', () => {
      const atStart = runInsert(
        '<ul><li>one</li><li>asdfgh</li><li>two</li></ul>',
        CODEBLOCK_WORLD,
        4
      );
      expect(atStart.ok).toBe(true);
      expect(atStart.doc.toString()).toBe(
        'doc(unorderedList(listItem(paragraph("one"))), codeBlock(paragraph("Worldasdfgh")), unorderedList(listItem(paragraph("two"))))'
      );

      const atEnd = runInsert(
        '<ul><li>one</li><li>asdfgh</li><li>two</li></ul>',
        CODEBLOCK_WORLD,
        4 + 6
      );
      expect(atEnd.ok).toBe(true);
      expect(atEnd.doc.toString()).toBe(
        'doc(unorderedList(listItem(paragraph("one"))), codeBlock(paragraph("asdfghWorld")), unorderedList(listItem(paragraph("two"))))'
      );
    });

    it('keeps a transparent paragraph inside the list item it merges into', () => {
      const { ok, doc } = runInsert(
        '<ul><li>one</li><li>asdfgh</li><li>two</li></ul>',
        '<html><p>World</p></html>',
        4 + 3
      );
      expect(ok).toBe(true);
      expect(doc.toString()).toBe(
        'doc(unorderedList(listItem(paragraph("one")), listItem(paragraph("asdWorldfgh")), listItem(paragraph("two"))))'
      );
    });

    it('splits multi-paragraph content into list items (later joined by the merge plugin)', () => {
      const { ok, doc } = runInsert(
        '<ul><li>one</li><li>asdfgh</li><li>two</li></ul>',
        '<html><p>AA</p><p>BB</p></html>',
        4 + 3
      );
      expect(ok).toBe(true);
      // Adjacent unorderedLists are joined back into one list by
      // MergeAdjacentSameKindBlocksPlugin when dispatched through the editor.
      expect(doc.toString()).toBe(
        'doc(unorderedList(listItem(paragraph("one"))), unorderedList(listItem(paragraph("asdAA"))), unorderedList(listItem(paragraph("BBfgh"))), unorderedList(listItem(paragraph("two"))))'
      );
    });
  });

  describe('block content into blockquote', () => {
    it('lifts the affected line out, keeping siblings quoted', () => {
      const { ok, doc } = runInsert(
        '<blockquote><p>one</p><p>asdfgh</p><p>two</p></blockquote>',
        CODEBLOCK_WORLD,
        4 + 3
      );
      expect(ok).toBe(true);
      expect(doc.toString()).toBe(
        'doc(blockquote(paragraph("one")), codeBlock(paragraph("asdWorldfgh")), blockquote(paragraph("two")))'
      );
    });
  });

  describe('alignment preservation', () => {
    it('keeps the alignment of the line a transparent paragraph merges into', () => {
      const { ok, doc } = runInsert(
        '<p style="text-align: center">asdfgh</p>',
        '<html><p>World</p></html>',
        3
      );
      expect(ok).toBe(true);
      expect(doc.childCount).toBe(1);
      expect(doc.firstChild!.textContent).toBe('asdWorldfgh');
      expect(doc.firstChild!.attrs.textAlign).toBe('center');
    });

    it('keeps the alignment of an aligned list receiving plain text', () => {
      const { ok, doc } = runInsert(
        '<ul style="text-align: center"><li>asdfgh</li></ul>',
        '<html><p>World</p></html>',
        3
      );
      expect(ok).toBe(true);
      expect(doc.toString()).toBe(
        'doc(unorderedList(listItem(paragraph("asdWorldfgh"))))'
      );
      expect(doc.firstChild!.attrs.textAlign).toBe('center');
    });

    it('codeblock inserted into an aligned line inherits the alignment on its inner paragraph', () => {
      const { ok, doc } = runInsert(
        '<p style="text-align: center">asdfgh</p>',
        CODEBLOCK_WORLD,
        3
      );
      expect(ok).toBe(true);
      expect(doc.firstChild!.type.name).toBe('codeBlock');
      expect(doc.firstChild!.firstChild!.textContent).toBe('asdWorldfgh');
      expect(doc.firstChild!.firstChild!.attrs.textAlign).toBe('center');
    });

    it('blockquote inserted into an aligned line inherits the alignment on its inner paragraph', () => {
      const { ok, doc } = runInsert(
        '<p style="text-align: center">asdfgh</p>',
        '<html><blockquote><p>World</p></blockquote></html>',
        3
      );
      expect(ok).toBe(true);
      expect(doc.firstChild!.type.name).toBe('blockquote');
      expect(doc.firstChild!.firstChild!.textContent).toBe('asdWorldfgh');
      expect(doc.firstChild!.firstChild!.attrs.textAlign).toBe('center');
    });

    it('codeblock inserted into an aligned list item inherits the list alignment', () => {
      const { ok, doc } = runInsert(
        '<ul style="text-align: center"><li>asdfgh</li></ul>',
        CODEBLOCK_WORLD,
        3
      );
      expect(ok).toBe(true);
      expect(doc.firstChild!.type.name).toBe('codeBlock');
      expect(doc.firstChild!.firstChild!.attrs.textAlign).toBe('center');
    });

    it('an incoming block with its own alignment keeps it', () => {
      const { ok, doc } = runInsert(
        '<p style="text-align: center">asdfgh</p>',
        '<html><h1 style="text-align: right">World</h1></html>',
        3
      );
      expect(ok).toBe(true);
      expect(doc.firstChild!.type.name).toBe('heading');
      expect(doc.firstChild!.attrs.textAlign).toBe('right');
    });

    it('spreads alignment onto both halves of a multi-block insert', () => {
      const { ok, doc } = runInsert(
        '<p style="text-align: center">asdfgh</p>',
        '<html><p>AA</p><p>BB</p></html>',
        3
      );
      expect(ok).toBe(true);
      expect(doc.childCount).toBe(2);
      expect(doc.child(0).attrs.textAlign).toBe('center');
      expect(doc.child(1).attrs.textAlign).toBe('center');
    });
  });

  describe('other block styles', () => {
    it('converts the line when a heading is inserted into a paragraph', () => {
      const { ok, doc } = runInsert(
        '<p>asdfgh</p>',
        '<html><h1>World</h1></html>',
        3
      );
      expect(ok).toBe(true);
      expect(doc.toString()).toBe('doc(heading("asdWorldfgh"))');
    });
  });
});

describe('isPlainEmptyDoc', () => {
  it('is true for a single unstyled empty paragraph', () => {
    expect(isPlainEmptyDoc(makeDoc('<p></p>'))).toBe(true);
  });

  it('is false for an empty but aligned paragraph', () => {
    expect(isPlainEmptyDoc(makeDoc('<p style="text-align: center"></p>'))).toBe(
      false
    );
  });

  it('is false for an empty heading', () => {
    expect(isPlainEmptyDoc(makeDoc('<h1></h1>'))).toBe(false);
  });

  it('is false for an empty list item', () => {
    expect(isPlainEmptyDoc(makeDoc('<ul><li></li></ul>'))).toBe(false);
  });

  it('is false for a non-empty paragraph', () => {
    expect(isPlainEmptyDoc(makeDoc('<p>hi</p>'))).toBe(false);
  });
});
