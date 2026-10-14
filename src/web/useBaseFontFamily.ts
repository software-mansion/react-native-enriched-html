import { useLayoutEffect, useState } from 'react';
import { type Editor } from '@tiptap/react';

// Without a fontFamily in style, the editor inherits its font from the DOM
export const useBaseFontFamily = (
  editor: Editor,
  fontFamily?: string
): string | undefined => {
  const [inheritedFontFamily, setInheritedFontFamily] = useState<string>();

  useLayoutEffect(() => {
    if (fontFamily) return;
    try {
      setInheritedFontFamily(getComputedStyle(editor.view.dom).fontFamily);
    } catch {
      // editor view isn't mounted yet
    }
  }, [editor, fontFamily]);

  return fontFamily ?? inheritedFontFamily;
};
