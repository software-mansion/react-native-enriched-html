import { useEffect, type RefObject } from 'react';
import type { OnLinkPressEvent, OnMentionPressEvent } from '../types';

type OnLinkPressEventRef = RefObject<
  ((event: OnLinkPressEvent) => void) | undefined
>;

type OnMentionPressEventRef = RefObject<
  ((event: OnMentionPressEvent) => void) | undefined
>;

export function usePressInteractions(
  containerRef: React.RefObject<HTMLDivElement | null>,
  onLinkPressRef: OnLinkPressEventRef,
  onMentionPressRef: OnMentionPressEventRef
) {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleInteraction = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      const checkbox = target.closest("input[type='checkbox']");
      if (checkbox && container.contains(checkbox)) {
        e.preventDefault();
      }

      const anchor = target.closest('a');
      if (anchor && container.contains(anchor)) {
        const url = anchor.getAttribute('href');
        if (url && onLinkPressRef.current) {
          e.preventDefault();
          onLinkPressRef.current({ url });
        }
      }

      const mention = target.closest('mention');
      if (mention && container.contains(mention)) {
        if (onMentionPressRef.current) {
          e.preventDefault();

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
  }, [containerRef, onLinkPressRef, onMentionPressRef]);
}
