import { NodeViewWrapper, type ReactNodeViewProps } from '@tiptap/react';
import type { CSSProperties } from 'react';
import { useState } from 'react';
import { BROKEN_IMAGE_PATH_D } from '../constants/brokenImageGlyph';

const IMAGE_FALLBACK_SIZE = 80;

function BrokenImageGlyph() {
  return (
    <svg
      viewBox="0 0 960 960"
      width="100%"
      height="100%"
      preserveAspectRatio="none"
      aria-hidden
      focusable="false"
      className="eti-inline-image-broken-glyph"
    >
      <path fill="currentColor" d={BROKEN_IMAGE_PATH_D} />
    </svg>
  );
}

function dim(value: unknown): number | undefined {
  if (value == null) return undefined;
  if (typeof value === 'number' && !Number.isNaN(value)) return value;
  const n = parseFloat(String(value));
  return Number.isNaN(n) ? undefined : n;
}

export function EnrichedImageNodeView({ node }: ReactNodeViewProps) {
  const src = ((node.attrs.src as string | null | undefined) ?? '').trim();
  const rawW = dim(node.attrs.width);
  const rawH = dim(node.attrs.height);
  const [errored, setErrored] = useState(false);
  const showPlaceholder = src.length === 0 || errored;

  const placeholderW = rawW ?? IMAGE_FALLBACK_SIZE;
  const placeholderH = rawH ?? IMAGE_FALLBACK_SIZE;

  const sizeStyle: CSSProperties = {
    width: placeholderW,
    height: placeholderH,
  };

  if (showPlaceholder) {
    return (
      <NodeViewWrapper
        as="span"
        className="eti-inline-image eti-inline-image--placeholder"
        style={sizeStyle}
        data-eti-image-placeholder=""
      >
        <BrokenImageGlyph />
      </NodeViewWrapper>
    );
  }

  let imgDims: { width?: number; height?: number };
  let imgStyle: CSSProperties | undefined;

  if (rawW != null && rawH != null) {
    imgDims = { width: rawW, height: rawH };
    imgStyle = undefined;
  } else if (rawH != null) {
    imgDims = { height: rawH };
    imgStyle = { width: 'auto' };
  } else {
    imgDims = { width: rawW ?? IMAGE_FALLBACK_SIZE };
    imgStyle = { height: 'auto' };
  }

  return (
    <NodeViewWrapper as="span" className="eti-inline-image">
      <img
        {...imgDims}
        src={src}
        alt=""
        className="eti-inline-image-img"
        style={imgStyle}
        contentEditable={false}
        draggable={false}
        onError={() => setErrored(true)}
      />
    </NodeViewWrapper>
  );
}
