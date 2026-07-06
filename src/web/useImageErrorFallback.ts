import { useEffect, type RefObject } from 'react';

/*
 * Flag images that fail to load so CSS can swap in a broken-image placeholder.
 */
export const useImageErrorFallback = (
  containerRef: RefObject<HTMLElement | null>
) => {
  // listen for errors
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleImageError = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target && target.tagName && target.tagName.toLowerCase() === 'img') {
        target.classList.add('error');
      }
    };

    container.addEventListener('error', handleImageError, true);

    // handle <img> elements that emitted an error event before we could set up a listener
    const images =
      container.querySelectorAll<HTMLImageElement>('img:not(.error)');

    images.forEach((img) => {
      if (img.complete && img.naturalHeight === 0) {
        img.classList.add('error');
      }
    });

    return () => {
      container.removeEventListener('error', handleImageError, true);
    };
  }, [containerRef]);
};
