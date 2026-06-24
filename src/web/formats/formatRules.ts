import type { Editor } from '@tiptap/core';
import type { HtmlStyle } from '../../types';
import { HEADING_LEVELS, HEADING_TAGS } from './EnrichedHeading';

type ChainedCommands = ReturnType<Editor['chain']>;

export function isAnyParagraphFormatActive(editor: Editor): boolean {
  return (
    editor.isActive('blockquote') ||
    editor.isActive('codeBlock') ||
    HEADING_LEVELS.some((level) => editor.isActive('heading', { level })) ||
    editor.isActive('orderedList') ||
    editor.isActive('unorderedList') ||
    editor.isActive('checkboxList')
  );
}

export function isLinkBlocked(editor: Editor): boolean {
  return (
    editor.isActive('code') ||
    editor.isActive('codeBlock') ||
    editor.isActive('mention') ||
    editor.isActive('image')
  );
}
function isMentionBlocked(editor: Editor): boolean {
  return (
    editor.isActive('code') ||
    editor.isActive('codeBlock') ||
    editor.isActive('link') ||
    editor.isActive('image')
  );
}

export function isImageBlocked(editor: Editor): boolean {
  return (
    editor.isActive('code') ||
    editor.isActive('link') ||
    editor.isActive('mention')
  );
}

export function isFormatBlocked(
  tiptapName: string,
  editor: Editor,
  htmlStyle: Required<HtmlStyle>
): boolean {
  if (tiptapName === 'image') {
    return isImageBlocked(editor);
  }
  if (tiptapName === 'link') {
    return isLinkBlocked(editor);
  }
  if (tiptapName === 'code' && editor.isActive('image')) {
    return true;
  }

  if (tiptapName === 'mention') {
    return isMentionBlocked(editor);
  }

  if (editor.isActive('codeBlock')) {
    return ['bold', 'italic', 'underline', 'strike', 'code'].includes(
      tiptapName
    );
  }
  for (const level of HEADING_LEVELS) {
    if (editor.isActive('heading', { level })) {
      const key = HEADING_TAGS[level - 1]!;
      if (tiptapName === 'bold' && htmlStyle[key].bold) return true;
    }
  }
  return false;
}

export function toggleParagraphFormat(
  isActive: () => boolean,
  deactivate: () => boolean,
  activate: (c: ChainedCommands) => ChainedCommands,
  chain: () => ChainedCommands,
  editor: Editor
): boolean {
  if (isActive()) return deactivate();

  return withPreservedAlignment(editor, chain(), (c) =>
    activate(c.clearNodes())
  );
}

export function getCurrentAlignment(editor: Editor): string | null {
  const { $from } = editor.state.selection;
  for (let depth = $from.depth; depth >= 0; depth--) {
    const node = $from.node(depth);
    if (node.attrs.textAlign) {
      return node.attrs.textAlign;
    }
  }
  return null;
}

export function withPreservedAlignment(
  editor: Editor,
  chain: ChainedCommands,
  mutateChain: (c: ChainedCommands) => ChainedCommands
): boolean {
  const currentAlignment = getCurrentAlignment(editor);

  const c = mutateChain(chain);

  if (currentAlignment && currentAlignment !== 'auto') {
    c.setTextAlign(currentAlignment);
  }

  return c.run();
}
