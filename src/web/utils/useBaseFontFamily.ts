import { useLayoutEffect, useState } from 'react';

// without a fontFamily in style, the element inherits its font from the DOM
export const useBaseFontFamily = (
  getElement: () => HTMLElement | null,
  fontFamily?: string
): string | undefined => {
  const [inheritedFontFamily, setInheritedFontFamily] = useState<string>();

  useLayoutEffect(() => {
    if (fontFamily) return;
    try {
      const element = getElement();
      if (element) {
        setInheritedFontFamily(getComputedStyle(element).fontFamily);
      }
    } catch {
      // element isn't mounted yet
    }
  }, [getElement, fontFamily]);

  return fontFamily ?? inheritedFontFamily;
};
