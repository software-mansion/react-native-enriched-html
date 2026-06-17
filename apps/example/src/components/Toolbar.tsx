import { useState } from 'react';
import {
  FlatList,
  type ListRenderItemInfo,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ToolbarButton } from './ToolbarButton';
import { ColorPickerRow } from './ColorPickerRow';
import type {
  OnChangeStateEvent,
  EnrichedTextInputInstance,
} from 'react-native-enriched-html';
import type { FC } from 'react';

const GRID_COLUMNS = 8;

const COLORS = [
  '#000000',
  '#FFFFFF',
  '#808080',
  '#FF0000',
  '#FF6600',
  '#FFFF00',
  '#00FF00',
  '#008000',
  '#00FFFF',
  '#0000FF',
  '#800080',
  '#FF00FF',
  '#FF69B4',
  '#A52A2A',
  '#FFA500',
  '#ADD8E6',
];

const STYLE_ITEMS = [
  {
    name: 'bold',
    icon: 'bold',
  },
  {
    name: 'italic',
    icon: 'italic',
  },
  {
    name: 'underline',
    icon: 'underline',
  },
  {
    name: 'strikethrough',
    icon: 'strikethrough',
  },
  {
    name: 'inline-code',
    icon: 'code',
  },
  {
    name: 'heading-1',
    text: 'H1',
  },
  {
    name: 'heading-2',
    text: 'H2',
  },
  {
    name: 'heading-3',
    text: 'H3',
  },
  {
    name: 'heading-4',
    text: 'H4',
  },
  {
    name: 'heading-5',
    text: 'H5',
  },
  {
    name: 'heading-6',
    text: 'H6',
  },
  {
    name: 'quote',
    icon: 'quote-right',
  },
  {
    name: 'code-block',
    icon: 'file-code-o',
  },
  {
    name: 'image',
    icon: 'image',
  },
  {
    name: 'link',
    icon: 'link',
  },
  {
    name: 'mention',
    icon: 'at',
  },
  {
    name: 'unordered-list',
    icon: 'list-ul',
  },
  {
    name: 'ordered-list',
    icon: 'list-ol',
  },
  {
    name: 'checkbox-list',
    icon: 'check-square-o',
  },
  {
    name: 'align-left',
    icon: 'align-left',
  },
  {
    name: 'align-center',
    icon: 'align-center',
  },
  {
    name: 'align-right',
    icon: 'align-right',
  },
  {
    name: 'text-color',
    text: 'A',
  },
  {
    name: 'bg-color',
    text: 'BG',
  },
] as const;

type Item = (typeof STYLE_ITEMS)[number];
type StylesState = OnChangeStateEvent;
type OpenPicker = 'text-color' | 'bg-color' | null;

export interface ToolbarProps {
  stylesState: StylesState;
  editorRef?: React.RefObject<EnrichedTextInputInstance | null>;
  onOpenLinkModal: () => void;
  onSelectImage: () => void;
  layout?: 'horizontal' | 'grid';
}

export const Toolbar: FC<ToolbarProps> = ({
  stylesState,
  editorRef,
  onOpenLinkModal,
  onSelectImage,
  layout = 'horizontal',
}) => {
  const [openPicker, setOpenPicker] = useState<OpenPicker>(null);

  const activeFgColor = stylesState.customStyle?.foregroundColor ?? '';
  const activeBgColor = stylesState.customStyle?.backgroundColor ?? '';

  const fgIndicatorColor =
    activeFgColor.length > 0 ? activeFgColor : 'transparent';
  const fgIndicatorBorder =
    activeFgColor.length > 0 ? activeFgColor : 'rgba(255,255,255,0.4)';
  const bgIndicatorColor =
    activeBgColor.length > 0 ? activeBgColor : 'transparent';
  const bgIndicatorBorder =
    activeBgColor.length > 0 ? activeBgColor : 'rgba(255,255,255,0.4)';

  const handlePress = (item: Item) => {
    const currentRef = editorRef?.current;
    if (!currentRef) return;

    switch (item.name) {
      case 'bold':
        editorRef.current?.toggleBold();
        break;
      case 'italic':
        editorRef.current?.toggleItalic();
        break;
      case 'underline':
        editorRef.current?.toggleUnderline();
        break;
      case 'strikethrough':
        editorRef.current?.toggleStrikeThrough();
        break;
      case 'inline-code':
        editorRef?.current?.toggleInlineCode();
        break;
      case 'heading-1':
        editorRef.current?.toggleH1();
        break;
      case 'heading-2':
        editorRef.current?.toggleH2();
        break;
      case 'heading-3':
        editorRef.current?.toggleH3();
        break;
      case 'heading-4':
        editorRef.current?.toggleH4();
        break;
      case 'heading-5':
        editorRef.current?.toggleH5();
        break;
      case 'heading-6':
        editorRef.current?.toggleH6();
        break;
      case 'code-block':
        editorRef?.current?.toggleCodeBlock();
        break;
      case 'quote':
        editorRef?.current?.toggleBlockQuote();
        break;
      case 'unordered-list':
        editorRef.current?.toggleUnorderedList();
        break;
      case 'ordered-list':
        editorRef.current?.toggleOrderedList();
        break;
      case 'checkbox-list':
        editorRef.current?.toggleCheckboxList(true);
        break;
      case 'link':
        onOpenLinkModal();
        break;
      case 'image':
        onSelectImage();
        break;
      case 'mention':
        editorRef.current?.startMention('@');
        break;
      case 'align-left':
        editorRef.current?.setTextAlignment('left');
        break;
      case 'align-center':
        editorRef.current?.setTextAlignment('center');
        break;
      case 'align-right':
        editorRef.current?.setTextAlignment('right');
        break;
    }
  };

  const isDisabled = (item: Item) => {
    switch (item.name) {
      case 'bold':
        return stylesState.bold.isBlocking;
      case 'italic':
        return stylesState.italic.isBlocking;
      case 'underline':
        return stylesState.underline.isBlocking;
      case 'strikethrough':
        return stylesState.strikeThrough.isBlocking;
      case 'inline-code':
        return stylesState.inlineCode.isBlocking;
      case 'heading-1':
        return stylesState.h1.isBlocking;
      case 'heading-2':
        return stylesState.h2.isBlocking;
      case 'heading-3':
        return stylesState.h3.isBlocking;
      case 'heading-4':
        return stylesState.h4.isBlocking;
      case 'heading-5':
        return stylesState.h5.isBlocking;
      case 'heading-6':
        return stylesState.h6.isBlocking;
      case 'code-block':
        return stylesState.codeBlock.isBlocking;
      case 'quote':
        return stylesState.blockQuote.isBlocking;
      case 'unordered-list':
        return stylesState.unorderedList.isBlocking;
      case 'ordered-list':
        return stylesState.orderedList.isBlocking;
      case 'link':
        return stylesState.link.isBlocking;
      case 'image':
        return stylesState.image.isBlocking;
      case 'mention':
        return stylesState.mention.isBlocking;
      case 'checkbox-list':
        return stylesState.checkboxList.isBlocking;
      default:
        return false;
    }
  };

  const isActive = (item: Item) => {
    switch (item.name) {
      case 'bold':
        return stylesState.bold.isActive;
      case 'italic':
        return stylesState.italic.isActive;
      case 'underline':
        return stylesState.underline.isActive;
      case 'strikethrough':
        return stylesState.strikeThrough.isActive;
      case 'inline-code':
        return stylesState.inlineCode.isActive;
      case 'heading-1':
        return stylesState.h1.isActive;
      case 'heading-2':
        return stylesState.h2.isActive;
      case 'heading-3':
        return stylesState.h3.isActive;
      case 'heading-4':
        return stylesState.h4.isActive;
      case 'heading-5':
        return stylesState.h5.isActive;
      case 'heading-6':
        return stylesState.h6.isActive;
      case 'code-block':
        return stylesState.codeBlock.isActive;
      case 'quote':
        return stylesState.blockQuote.isActive;
      case 'unordered-list':
        return stylesState.unorderedList.isActive;
      case 'ordered-list':
        return stylesState.orderedList.isActive;
      case 'link':
        return stylesState.link.isActive;
      case 'image':
        return stylesState.image.isActive;
      case 'mention':
        return stylesState.mention.isActive;
      case 'checkbox-list':
        return stylesState.checkboxList.isActive;
      case 'align-left':
        return stylesState.alignment === 'left';
      case 'align-center':
        return stylesState.alignment === 'center';
      case 'align-right':
        return stylesState.alignment === 'right';
      default:
        return false;
    }
  };

  const renderItem = ({ item }: ListRenderItemInfo<Item>) => {
    if (item.name === 'text-color') {
      return (
        <Pressable
          testID="toolbar-text-color"
          onPress={() =>
            setOpenPicker((prev) =>
              prev === 'text-color' ? null : 'text-color'
            )
          }
          style={[
            styles.colorButton,
            layout === 'grid' ? styles.gridItem : undefined,
            openPicker === 'text-color' && styles.colorButtonActive,
          ]}
        >
          <Text style={styles.colorButtonLabel}>A</Text>
          <View
            style={[
              styles.colorIndicator,
              {
                backgroundColor: fgIndicatorColor,
                borderColor: fgIndicatorBorder,
              },
            ]}
          />
        </Pressable>
      );
    }

    if (item.name === 'bg-color') {
      return (
        <Pressable
          testID="toolbar-bg-color"
          onPress={() =>
            setOpenPicker((prev) => (prev === 'bg-color' ? null : 'bg-color'))
          }
          style={[
            styles.colorButton,
            layout === 'grid' ? styles.gridItem : undefined,
            openPicker === 'bg-color' && styles.colorButtonActive,
          ]}
        >
          <Text style={styles.colorButtonLabel}>BG</Text>
          <View
            style={[
              styles.colorIndicator,
              {
                backgroundColor: bgIndicatorColor,
                borderColor: bgIndicatorBorder,
              },
            ]}
          />
        </Pressable>
      );
    }

    return (
      <ToolbarButton
        {...item}
        testID={`toolbar-${item.name}`}
        isActive={isActive(item)}
        isDisabled={isDisabled(item)}
        onPress={() => handlePress(item)}
        containerStyle={layout === 'grid' ? styles.gridItem : undefined}
      />
    );
  };

  const keyExtractor = (item: Item) => item.name;

  const handleSelectFgColor = (color: string) => {
    editorRef?.current?.setStyle({ foregroundColor: color });
    setOpenPicker(null);
  };

  const handleClearFgColor = () => {
    editorRef?.current?.setStyle({ foregroundColor: null });
    setOpenPicker(null);
  };

  const handleSelectBgColor = (color: string) => {
    editorRef?.current?.setStyle({ backgroundColor: color });
    setOpenPicker(null);
  };

  const handleClearBgColor = () => {
    editorRef?.current?.setStyle({ backgroundColor: null });
    setOpenPicker(null);
  };

  return (
    <View style={styles.wrapper}>
      <FlatList
        key={layout}
        numColumns={layout === 'grid' ? GRID_COLUMNS : undefined}
        horizontal={layout === 'horizontal'}
        scrollEnabled={layout === 'horizontal'}
        data={STYLE_ITEMS}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        style={styles.list}
        testID="toolbar"
      />
      {openPicker === 'text-color' && (
        <ColorPickerRow
          colors={COLORS}
          activeColor={activeFgColor}
          onSelectColor={handleSelectFgColor}
          onClear={handleClearFgColor}
        />
      )}
      {openPicker === 'bg-color' && (
        <ColorPickerRow
          colors={COLORS}
          activeColor={activeBgColor}
          onSelectColor={handleSelectBgColor}
          onClear={handleClearBgColor}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  list: {
    width: '100%',
  },
  gridItem: {
    flexBasis: `${100 / GRID_COLUMNS}%`,
    aspectRatio: 1,
  },
  colorButton: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 56,
    height: 56,
    backgroundColor: 'rgba(0, 26, 114, 0.8)',
    gap: 2,
  },
  colorButtonActive: {
    backgroundColor: 'rgb(0, 26, 114)',
  },
  colorButtonLabel: {
    color: 'white',
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 17,
  },
  colorIndicator: {
    width: 20,
    height: 5,
    borderRadius: 2,
    borderWidth: 1,
  },
});
