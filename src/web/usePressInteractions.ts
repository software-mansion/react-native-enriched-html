import { useEffect, type RefObject } from 'react';
import type { OnImagePressEvent } from '../types';

type OnImagePressEventRef = RefObject<
  ((event: OnImagePressEvent) => void) | undefined
>;

type ImageAttributes = {
  uri: string;
  width: number;
  height: number;
};

import type { OnLinkPressEvent, OnMentionPressEvent } from '../types';

type OnLinkPressEventRef = RefObject<
  ((event: OnLinkPressEvent) => void) | undefined
>;

type OnMentionPressEventRef = RefObject<
  ((event: OnMentionPressEvent) => void) | undefined
>;

export function usePressInteractions(
  containerRef: RefObject<HTMLDivElement | null>,
  onLinkPressRef: OnLinkPressEventRef,
  onMentionPressRef: OnMentionPressEventRef,
  onImagePressRef: OnImagePressEventRef
) {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleInteraction = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      const image = target.closest('img');
      if (image && container.contains(image)) {
        e.preventDefault();

        const imageAttributes = getImageAttributes(image);

        if (imageAttributes) {
          onImagePressRef.current?.({
            image: imageAttributes,
          });
        }
      }

      const checkbox = target.closest("input[type='checkbox']");
      if (checkbox && container.contains(checkbox)) {
        e.preventDefault();
      }

      const anchor = target.closest('a');
      if (anchor && container.contains(anchor)) {
        e.preventDefault();
        const url = anchor.getAttribute('href');
        if (url && onLinkPressRef.current) {
          onLinkPressRef.current({ url });
        }
      }

      const mention = target.closest('mention');
      if (mention && container.contains(mention)) {
        if (onMentionPressRef.current) {
          const customAttributes: Record<string, string> = {};
          for (const attr of Array.from(mention.attributes)) {
            if (attr.name !== 'text' && attr.name !== 'indicator') {
              customAttributes[attr.name] = attr.value;
            }
          }

          onMentionPressRef.current({
            text: mention.getAttribute('text') ?? '',
            indicator: mention.getAttribute('indicator') ?? '',
            attributes: customAttributes,
          });
        }
      }
    };

    container.addEventListener('click', handleInteraction);
    return () => container.removeEventListener('click', handleInteraction);
  }, [containerRef, onLinkPressRef, onMentionPressRef, onImagePressRef]);
}

function getImageAttributes(
  image: HTMLImageElement
): ImageAttributes | undefined {
  const uri = image.getAttribute('src');

  if (!uri) {
    return undefined;
  }

  const { width, height } = getImageDimensions(image);

  return {
    uri,
    width,
    height,
  };
}

function getImageDimensions(image: HTMLImageElement): {
  width: number;
  height: number;
} {
  const rawWidth = image.getAttribute('width');
  const rawHeight = image.getAttribute('height');

  if (rawWidth && rawHeight) {
    const width = parseInt(rawWidth, 10);
    const height = parseInt(rawHeight, 10);

    if (!isNaN(width) && !isNaN(height)) {
      return { width, height };
    }
  }

  const rect = image.getBoundingClientRect();

  return { width: rect.width, height: rect.height };
}
