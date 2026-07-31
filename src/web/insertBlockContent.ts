import {
  Fragment,
  type Attrs,
  type Mark,
  type Node as PmNode,
  type NodeType,
} from '@tiptap/pm/model';
import { TextSelection, type Transaction } from '@tiptap/pm/state';

function applyMarksToNode(node: PmNode, marks: readonly Mark[]): PmNode {
  if (node.isText) {
    let set = node.marks;
    for (const mark of marks) set = mark.addToSet(set);
    return node.mark(set);
  }
  if (node.isLeaf || node.childCount === 0) return node;
  const children: PmNode[] = [];
  node.forEach((child) => children.push(applyMarksToNode(child, marks)));
  return node.copy(Fragment.fromArray(children));
}

/**
 * Unions the given marks into every text node of the inline content, so inserted text inherits
 * the editor's active inline styles (toggled marks or the marks at the caret), matching the
 * native platforms. Marks that end up illegal for their context (e.g. inside a code block) are
 * cleaned up afterwards by the existing strip plugins.
 */
export function applyMarksToContent(
  content: Fragment,
  marks: readonly Mark[]
): Fragment {
  if (marks.length === 0) return content;
  const mapped: PmNode[] = [];
  content.forEach((node) => mapped.push(applyMarksToNode(node, marks)));
  return Fragment.fromArray(mapped);
}

function hasLeadingTextblock(block: PmNode): boolean {
  if (block.isTextblock) return true;
  if (block.childCount === 0) return false;
  return hasLeadingTextblock(block.child(0));
}

function hasTrailingTextblock(block: PmNode): boolean {
  if (block.isTextblock) return true;
  if (block.childCount === 0) return false;
  return hasTrailingTextblock(block.child(block.childCount - 1));
}

// Prepends inline content into the first leaf textblock of a block, descending through
// wrappers (blockquote, codeblock) so the text joins the line rather than the wrapper.
function prependInline(block: PmNode, inline: Fragment): PmNode {
  if (inline.size === 0) return block;
  if (block.isTextblock) {
    return block.copy(inline.append(block.content));
  }
  const children: PmNode[] = [];
  block.forEach((child) => children.push(child));
  children[0] = prependInline(children[0]!, inline);
  return block.copy(Fragment.fromArray(children));
}

function appendInline(block: PmNode, inline: Fragment): PmNode {
  if (inline.size === 0) return block;
  if (block.isTextblock) {
    return block.copy(block.content.append(inline));
  }
  const children: PmNode[] = [];
  block.forEach((child) => children.push(child));
  const lastIdx = children.length - 1;
  children[lastIdx] = appendInline(children[lastIdx]!, inline);
  return block.copy(Fragment.fromArray(children));
}

// A default paragraph carries no block styling, so it is "transparent" and should not override
// the line it merges into (heading level, alignment, etc.), matching the native platforms.
function isPlainParagraph(block: PmNode): boolean {
  return (
    block.type.name === 'paragraph' && block.sameMarkup(block.type.create())
  );
}

/**
 * True when the document is a single unstyled empty paragraph. Only then may an insert replace
 * the document wholesale
 */
export function isPlainEmptyDoc(doc: PmNode): boolean {
  return (
    doc.childCount === 1 &&
    doc.firstChild!.content.size === 0 &&
    isPlainParagraph(doc.firstChild!)
  );
}

// A styled incoming block keeps its own type but inherits the line's alignment when it doesn't
// specify one, so inserting e.g. a heading into a centered line stays centered. Wrapper blocks
// (blockquote, code block) carry no alignment attribute themselves, so it is applied to their
// descendants at the outermost level that supports it, mirroring where toggling puts it.
function alignStyledBlock(block: PmNode, align: string | null): PmNode {
  if (!align) return block;
  if ('textAlign' in block.attrs) {
    if (block.attrs.textAlign) return block;
    return block.type.create(
      { ...block.attrs, textAlign: align },
      block.content,
      block.marks
    );
  }
  if (block.isLeaf || block.childCount === 0) return block;
  const children: PmNode[] = [];
  block.forEach((child) => children.push(alignStyledBlock(child, align)));
  return block.copy(Fragment.fromArray(children));
}

/**
 * Inserts block-level content at the range [from, to) so the incoming blocks merge with the
 * current line the way the native platforms do: the text before the caret joins the first
 * incoming block, the text after the caret joins the last incoming block, and each incoming
 * block keeps its own type.
 *
 * Block context is matched to the target line's flat-model behaviour:
 * - Incoming wrappers of the same type as an ancestor (a code block pasted into a code block)
 *   are unwrapped so their lines merge into the existing wrapper rather than nesting/breaking it.
 * - A transparent (plain) edge that joins the line adopts the line's block style - including its
 *   wrapper (code block/blockquote/list) and alignment — while a trailing plain block with no
 *   text after it stays a plain paragraph.
 * - A block that can't live in the current wrapper (a heading inside a code block, a code block
 *   inside a blockquote, …) lifts the line out by splitting the wrapper, leaving siblings wrapped.
 *
 * Returns false without meaningfully mutating when the structure can't accept the reconstructed
 * blocks, so the caller can fall back to TipTap's default insertion.
 */
export function insertBlockContent(
  tr: Transaction,
  from: number,
  to: number,
  blocks: PmNode[]
): boolean {
  if (blocks.length === 0) return false;

  try {
    if (from !== to) {
      tr.delete(from, to);
    }

    const $pos = tr.doc.resolve(from);
    const depth = $pos.depth;
    const line = $pos.parent;

    if (depth < 1 || !line.isTextblock) return false;

    const offset = from - $pos.start(depth);
    const before = line.content.cut(0, offset);
    const after = line.content.cut(offset);

    // The line's block context: its wrapper chain (innermost first) and inner textblock. Used to
    // keep inserted content in the line's block style (code block, blockquote, list, alignment…).
    const wrappers: { type: NodeType; attrs: Attrs }[] = [];
    for (let d = depth - 1; d >= 1; d--) {
      const w = $pos.node(d);
      wrappers.push({ type: w.type, attrs: w.attrs });
    }
    const wrapperNames = new Set(wrappers.map((w) => w.type.name));

    // The alignment governing the line: its own attribute or the nearest wrapper's (lists
    // carry alignment on the list node rather than the inner paragraph).
    const lineAlign = (line.attrs.textAlign ??
      wrappers.find((w) => w.attrs.textAlign)?.attrs.textAlign ??
      null) as string | null;

    const wrapInLineContext = (
      content: Fragment,
      marks: readonly Mark[]
    ): PmNode => {
      let node = line.type.create(line.attrs, content, marks);
      for (const w of wrappers) {
        node = w.type.create(w.attrs, Fragment.from(node));
      }
      return node;
    };

    // Same-type wrappers coming in (e.g. a code block pasted into a code block) are unwrapped so
    // their lines merge into the existing wrapper instead of nesting or breaking out of it.
    const flatten = (block: PmNode): PmNode[] => {
      if (block.isTextblock) return [block];
      if (wrapperNames.has(block.type.name)) {
        const out: PmNode[] = [];
        block.forEach((child) => out.push(...flatten(child)));
        return out;
      }
      return [block];
    };
    const flatBlocks: PmNode[] = [];
    for (const b of blocks) flatBlocks.push(...flatten(b));
    if (flatBlocks.length === 0) return false;

    const firstBlock = flatBlocks[0]!;
    const lastBlock = flatBlocks[flatBlocks.length - 1]!;

    // Bail out if the edge blocks can't absorb the surrounding text (would silently drop it).
    if (before.size > 0 && !hasLeadingTextblock(firstBlock)) return false;
    if (after.size > 0 && !hasTrailingTextblock(lastBlock)) return false;

    const single = flatBlocks.length === 1;
    // A transparent (plain) edge adopts the line's block style only when it actually joins the
    // line: the sole block replacing the line, or an edge that absorbs surrounding text. A
    // trailing plain block with nothing after it stays a plain paragraph (a genuinely new line).
    const firstInherits =
      isPlainParagraph(firstBlock) && (single || before.size > 0);
    const lastInherits =
      isPlainParagraph(lastBlock) && (single || after.size > 0);

    const buildBlocks = (rewrap: boolean): PmNode[] => {
      const makeEdge = (block: PmNode, inherits: boolean): PmNode => {
        if (!inherits) return alignStyledBlock(block, lineAlign);
        // Rewrap keeps the wrapper (blockquote/list) around content that is being lifted out;
        // in place the inner textblock is enough since it stays inside the existing wrapper.
        if (rewrap) return wrapInLineContext(block.content, block.marks);
        return line.type.create(line.attrs, block.content, block.marks);
      };

      const first = makeEdge(firstBlock, firstInherits);
      const out: PmNode[] = [];
      if (single) {
        out.push(appendInline(prependInline(first, before), after));
      } else {
        const last = makeEdge(lastBlock, lastInherits);
        out.push(prependInline(first, before));
        for (let i = 1; i < flatBlocks.length - 1; i++) {
          out.push(flatBlocks[i]!);
        }
        out.push(appendInline(last, after));
      }
      return out;
    };

    // Shallowest ancestor whose parent can hold the blocks: the line itself means they fit in
    // place, otherwise the wrappers between are split so the line is lifted out to that level.
    const fitDepth = (candidate: PmNode[]): number => {
      const frag = Fragment.fromArray(candidate);
      let d = depth;
      while (d > 1) {
        const parent = $pos.node(d - 1);
        const index = $pos.index(d - 1);
        if (parent.canReplace(index, index + 1, frag)) break;
        d--;
      }
      return d;
    };

    // Build assuming the content stays in place; if it must be lifted out of a wrapper, rebuild
    // the transparent edges wrapped in the line's context so they keep the wrapper's style.
    let newBlocks = buildBlocks(false);
    let childDepth = fitDepth(newBlocks);
    if (childDepth < depth && depth > 1) {
      newBlocks = buildBlocks(true);
      childDepth = fitDepth(newBlocks);
    }

    if (depth - childDepth > 0) {
      // Only split on a side that actually has sibling lines within the wrapper(s); otherwise
      // we'd leave empty wrappers behind. Check each wrapper level.
      let isFirst = true;
      let isLast = true;
      for (let d = depth; d > childDepth; d--) {
        const index = $pos.index(d - 1);
        if (index > 0) isFirst = false;
        if (index < $pos.node(d - 1).childCount - 1) isLast = false;
      }

      // A split can't pass through a wrapper level it would leave empty on one side (e.g. a
      // list item holds exactly one paragraph, so cutting at the paragraph's edge must happen
      // at the list-item boundary instead). Raise the cut while the line's chain sits at the
      // relevant edge of its parent, then split the remaining levels down to childDepth.
      if (!isLast) {
        let cutDepth = depth;
        while (
          cutDepth > childDepth + 1 &&
          $pos.index(cutDepth - 1) === $pos.node(cutDepth - 1).childCount - 1
        ) {
          cutDepth--;
        }
        tr.split($pos.after(cutDepth), cutDepth - childDepth);
      }
      if (!isFirst) {
        let cutDepth = depth;
        while (cutDepth > childDepth + 1 && $pos.index(cutDepth - 1) === 0) {
          cutDepth--;
        }
        tr.split($pos.before(cutDepth), cutDepth - childDepth);
      }
    }

    const $inner = tr.doc.resolve(tr.mapping.map(from));
    tr.replaceWith(
      $inner.before(childDepth),
      $inner.after(childDepth),
      newBlocks
    );

    // Place the caret just before the trailing (absorbed) text; near() snaps into the textblock.
    const insertionEnd = tr.mapping.map(from, 1);
    const caretPos = Math.max(
      0,
      Math.min(insertionEnd - after.size, tr.doc.content.size)
    );
    tr.setSelection(TextSelection.near(tr.doc.resolve(caretPos), -1));

    return true;
  } catch {
    return false;
  }
}
