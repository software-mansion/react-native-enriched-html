import { useEffect } from 'react';

export function usePressInteractions(
  containerRef: React.RefObject<HTMLDivElement | null>
) {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      const anchor = target.closest('a');
      if (anchor && container.contains(anchor)) {
        e.preventDefault();
      }
    };

    container.addEventListener('click', handleClick);
    return () => container.removeEventListener('click', handleClick);
  }, [containerRef]);
}
