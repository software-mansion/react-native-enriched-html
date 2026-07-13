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

export function usePressInteractions(
  containerRef: RefObject<HTMLDivElement | null>,
  onImagePressRef: OnImagePressEventRef
) {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleInteraction = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      const anchor = target.closest('a');
      if (anchor && container.contains(anchor)) {
        e.preventDefault();
      }

      const image = target.closest('img');
      if (image && container.contains(image)) {
        e.preventDefault();

        const imageAttributes = parseImageAttributes(image);

        if (imageAttributes) {
          onImagePressRef.current?.({
            image: imageAttributes,
          });
        }
      }
    };

    container.addEventListener('click', handleInteraction);
    return () => container.removeEventListener('click', handleInteraction);
  }, [containerRef, onImagePressRef]);
}

function parseImageAttributes(image: HTMLElement): ImageAttributes | undefined {
  const uri = image.getAttribute('src');
  const rawWidth = image.getAttribute('width');
  const rawHeight = image.getAttribute('height');

  if (uri && rawWidth && rawHeight) {
    const width = parseInt(rawWidth, 10);
    const height = parseInt(rawHeight, 10);

    if (!isNaN(width) && !isNaN(height)) {
      return {
        uri,
        width,
        height,
      };
    }
  }

  return undefined;
}
