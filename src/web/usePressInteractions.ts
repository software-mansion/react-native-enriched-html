import { useEffect, useRef } from 'react';
import type { OnLinkPressEvent, OnMentionPressEvent } from '../types';

export function usePressInteractions(
  containerRef: React.RefObject<HTMLDivElement | null>,
  onLinkPress?: (event: OnLinkPressEvent) => void,
  onMentionPress?: (event: OnMentionPressEvent) => void
) {
  const linkPressRef = useRef(onLinkPress);
  const mentionPressRef = useRef(onMentionPress);

  useEffect(() => {
    linkPressRef.current = onLinkPress;
    mentionPressRef.current = onMentionPress;
  }, [onLinkPress, onMentionPress]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleInteraction = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      const anchor = target.closest('a');
      if (anchor && container.contains(anchor)) {
        const url = anchor.getAttribute('href');
        if (url && linkPressRef.current) {
          e.preventDefault();
          linkPressRef.current({ url });
        }
      }

      const mention = target.closest('mention');
      if (mention && container.contains(mention)) {
        if (mentionPressRef.current) {
          e.preventDefault();

          const customAttributes: Record<string, string> = {};
          for (const attr of Array.from(mention.attributes)) {
            if (attr.name !== 'text' && attr.name !== 'indicator') {
              customAttributes[attr.name] = attr.value;
            }
          }

          mentionPressRef.current({
            text: mention.getAttribute('text') ?? '',
            indicator: mention.getAttribute('indicator') ?? '',
            attributes: customAttributes,
          });
        }
      }
    };

    container.addEventListener('click', handleInteraction);
    return () => container.removeEventListener('click', handleInteraction);
  }, [containerRef]);
}
