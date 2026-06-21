import { useEffect, type RefObject } from 'react';

/*
 * Flag images that fail to load so CSS can swap in a broken-image placeholder.
 */
export const useImageErrorFallback = (
  containerRef: RefObject<HTMLElement | null>,
  html: string
) => {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const images = container.querySelectorAll<HTMLImageElement>('img');
    const cleanups: (() => void)[] = [];

    images.forEach((img) => {
      const handleImageError = () => img.classList.add('error');

      img.addEventListener('error', handleImageError);
      cleanups.push(() => img.removeEventListener('error', handleImageError));

      // Catch images that already failed before the listener attached
      if (img.complete && img.naturalHeight === 0) {
        handleImageError();
      }
    });

    return () => cleanups.forEach((cleanup) => cleanup());
  }, [containerRef, html]);
};
