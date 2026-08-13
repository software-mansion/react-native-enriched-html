import './Toolbar.css';
import type {
  EnrichedTextInputInstance,
  OnChangeStateEvent,
} from 'react-native-enriched-html';
import { useState, type RefObject } from 'react';
import { useDragScroll } from '../hooks/useDragScroll';

const COLORS = [
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

const FONT_SIZES = [12, 16, 20, 24, 28, 32, 36, 40];

const FONT_FAMILIES = [
  { label: 'Sans', value: 'Arial' },
  { label: 'Serif', value: 'Georgia' },
  { label: 'Mono', value: 'Courier New' },
  { label: 'System', value: 'system-ui' },
  { label: 'Cursive', value: 'cursive' },
] as const;

type OpenPicker =
  | 'text-color'
  | 'bg-color'
  | 'font-size'
  | 'font-family'
  | null;

interface ToolbarProps {
  editorRef: RefObject<EnrichedTextInputInstance | null>;
  state: OnChangeStateEvent | null;
  onOpenLinkModal: () => void;
  onOpenImageModal: () => void;
}

interface ToolbarButtonProps {
  label: string;
  testId: string;
  isActive: boolean;
  isDisabled?: boolean;
  variant?: string;
  onPress: () => void;
}

function ToolbarButton({
  label,
  testId,
  isActive,
  isDisabled,
  variant = 'default',
  onPress,
}: ToolbarButtonProps) {
  return (
    <button
      type="button"
      data-testid={testId}
      disabled={isDisabled}
      className={`toolbar-btn toolbar-btn--${variant} ${isActive ? 'toolbar-btn--active' : ''} ${isDisabled ? 'toolbar-btn--disabled' : ''}`}
      onPointerDown={(e) => {
        // Mouse only: keep focus in the editor. Skip touch so the strip can scroll.
        if (e.pointerType === 'mouse') {
          e.preventDefault();
        }
      }}
      onClick={() => {
        if (!isDisabled) {
          onPress();
        }
      }}
    >
      {label}
    </button>
  );
}

export function Toolbar({
  editorRef,
  state,
  onOpenLinkModal,
  onOpenImageModal,
}: ToolbarProps) {
  const s = state;
  const dragScroll = useDragScroll();
  const [openPicker, setOpenPicker] = useState<OpenPicker>(null);

  const activeFgColor = s?.customStyle.foregroundColor ?? '';
  const activeBgColor = s?.customStyle.backgroundColor ?? '';
  const activeFontSize = s?.customStyle.fontSize ?? 0;
  const activeFontFamily = s?.customStyle.fontFamily ?? '';
  const activeFontFamilyLabel =
    FONT_FAMILIES.find((family) => family.value === activeFontFamily)?.label ??
    '';

  const handleSelectFgColor = (color: string) => {
    editorRef.current?.setStyle({ foregroundColor: color });
    setOpenPicker(null);
  };
  const handleClearFgColor = () => {
    editorRef.current?.setStyle({ foregroundColor: null });
    setOpenPicker(null);
  };
  const handleSelectBgColor = (color: string) => {
    editorRef.current?.setStyle({ backgroundColor: color });
    setOpenPicker(null);
  };
  const handleClearBgColor = () => {
    editorRef.current?.setStyle({ backgroundColor: null });
    setOpenPicker(null);
  };
  const handleSelectFontSize = (size: number) => {
    editorRef.current?.setStyle({ fontSize: size });
    setOpenPicker(null);
  };
  const handleClearFontSize = () => {
    editorRef.current?.setStyle({ fontSize: null });
    setOpenPicker(null);
  };
  const handleSelectFontFamily = (family: string) => {
    editorRef.current?.setStyle({ fontFamily: family });
    setOpenPicker(null);
  };
  const handleClearFontFamily = () => {
    editorRef.current?.setStyle({ fontFamily: null });
    setOpenPicker(null);
  };

  const toolbarItems = [
    {
      key: 'bold',
      label: 'B',
      onPress: (editor) => {
        editor?.toggleBold();
      },
    },
    {
      key: 'italic',
      label: 'I',
      variant: 'italic',
      onPress: (editor) => {
        editor?.toggleItalic();
      },
    },
    {
      key: 'underline',
      label: 'U',
      variant: 'underline',
      onPress: (editor) => {
        editor?.toggleUnderline();
      },
    },
    {
      key: 'strikeThrough',
      label: 'S',
      variant: 'strikethrough',
      onPress: (editor) => {
        editor?.toggleStrikeThrough();
      },
    },
    {
      key: 'inlineCode',
      label: '</>',
      onPress: (editor) => {
        editor?.toggleInlineCode();
      },
    },
    {
      key: 'h1',
      label: 'H1',
      onPress: (editor) => {
        editor?.toggleH1();
      },
    },
    {
      key: 'h2',
      label: 'H2',
      onPress: (editor) => {
        editor?.toggleH2();
      },
    },
    {
      key: 'h3',
      label: 'H3',
      onPress: (editor) => {
        editor?.toggleH3();
      },
    },
    {
      key: 'h4',
      label: 'H4',
      onPress: (editor) => {
        editor?.toggleH4();
      },
    },
    {
      key: 'h5',
      label: 'H5',
      onPress: (editor) => {
        editor?.toggleH5();
      },
    },
    {
      key: 'h6',
      label: 'H6',
      onPress: (editor) => {
        editor?.toggleH6();
      },
    },
    {
      key: 'blockQuote',
      label: '❝',
      onPress: (editor) => {
        editor?.toggleBlockQuote();
      },
    },
    {
      key: 'codeBlock',
      label: '{ }',
      onPress: (editor) => {
        editor?.toggleCodeBlock();
      },
    },
    {
      key: 'link',
      label: '🔗',
      onPress: onOpenLinkModal,
    },
    {
      key: 'mention',
      label: '@',
      onPress: (editor) => {
        editor?.startMention('@');
      },
    },
    {
      key: 'image',
      label: '🏞️',
      onPress: onOpenImageModal,
    },
    {
      key: 'unorderedList',
      label: '•',
      onPress: (editor) => {
        editor?.toggleUnorderedList();
      },
    },
    {
      key: 'orderedList',
      label: '1.',
      onPress: (editor) => {
        editor?.toggleOrderedList();
      },
    },
    {
      key: 'checkboxList',
      label: '☑',
      onPress: (editor) => {
        editor?.toggleCheckboxList(true);
      },
    },
  ] satisfies {
    key: keyof OnChangeStateEvent;
    label: string;
    variant?: string;
    onPress: (editor: EnrichedTextInputInstance | null) => void;
  }[];

  const alignmentItems: {
    label: string;
    value: 'left' | 'center' | 'right' | 'justify';
  }[] = [
    { label: '←', value: 'left' },
    { label: '↔', value: 'center' },
    { label: '→', value: 'right' },
    { label: '≡', value: 'justify' },
  ];

  return (
    <div className="toolbar-wrapper">
      <div className="toolbar">
        <div className="toolbar-controls" {...dragScroll}>
          {toolbarItems.map((item) => (
            <ToolbarButton
              key={item.key}
              label={item.label}
              testId={`toolbar-button-${item.key}`}
              isActive={s?.[item.key].isActive ?? false}
              isDisabled={s?.[item.key].isBlocking ?? false}
              variant={item.variant}
              onPress={() => {
                item.onPress(editorRef.current);
              }}
            />
          ))}
          {alignmentItems.map((item) => (
            <ToolbarButton
              key={`alignment-${item.value}`}
              label={item.label}
              testId={`toolbar-button-alignment-${item.value}`}
              isActive={s?.alignment === item.value}
              onPress={() => {
                editorRef.current?.setTextAlignment(item.value);
              }}
            />
          ))}
          <button
            type="button"
            data-testid="toolbar-text-color"
            className={`toolbar-btn toolbar-color-btn${openPicker === 'text-color' ? ' toolbar-btn--active' : ''}`}
            onPointerDown={(e) => {
              if (e.pointerType === 'mouse') e.preventDefault();
            }}
            onClick={() => {
              setOpenPicker((prev) =>
                prev === 'text-color' ? null : 'text-color'
              );
            }}
          >
            <span className="toolbar-color-label">A</span>
            <span
              className="toolbar-color-indicator"
              style={{
                backgroundColor:
                  activeFgColor.length > 0 ? activeFgColor : 'transparent',
                borderColor:
                  activeFgColor.length > 0
                    ? activeFgColor
                    : 'rgba(255,255,255,0.4)',
              }}
            />
          </button>
          <button
            type="button"
            data-testid="toolbar-bg-color"
            className={`toolbar-btn toolbar-color-btn${openPicker === 'bg-color' ? ' toolbar-btn--active' : ''}`}
            onPointerDown={(e) => {
              if (e.pointerType === 'mouse') e.preventDefault();
            }}
            onClick={() => {
              setOpenPicker((prev) =>
                prev === 'bg-color' ? null : 'bg-color'
              );
            }}
          >
            <span className="toolbar-color-label">BG</span>
            <span
              className="toolbar-color-indicator"
              style={{
                backgroundColor:
                  activeBgColor.length > 0 ? activeBgColor : 'transparent',
                borderColor:
                  activeBgColor.length > 0
                    ? activeBgColor
                    : 'rgba(255,255,255,0.4)',
              }}
            />
          </button>
          <button
            type="button"
            data-testid="toolbar-font-size"
            className={`toolbar-btn toolbar-color-btn${
              openPicker === 'font-size' || activeFontSize > 0
                ? ' toolbar-btn--active'
                : ''
            }`}
            onPointerDown={(e) => {
              if (e.pointerType === 'mouse') e.preventDefault();
            }}
            onClick={() => {
              setOpenPicker((prev) =>
                prev === 'font-size' ? null : 'font-size'
              );
            }}
          >
            <span className="toolbar-color-label">
              {activeFontSize > 0 ? String(activeFontSize) : 'Aa'}
            </span>
          </button>
          <button
            type="button"
            data-testid="toolbar-font-family"
            className={`toolbar-btn toolbar-color-btn${
              openPicker === 'font-family' || activeFontFamily.length > 0
                ? ' toolbar-btn--active'
                : ''
            }`}
            onPointerDown={(e) => {
              if (e.pointerType === 'mouse') e.preventDefault();
            }}
            onClick={() => {
              setOpenPicker((prev) =>
                prev === 'font-family' ? null : 'font-family'
              );
            }}
          >
            <span className="toolbar-color-label">
              {activeFontFamilyLabel || 'Ff'}
            </span>
          </button>
        </div>
        <div className="toolbar-fill" aria-hidden="true" />
      </div>
      {(openPicker === 'text-color' || openPicker === 'bg-color') && (
        <div className="toolbar-color-picker">
          <button
            type="button"
            data-testid="toolbar-color-swatch-clear"
            className="toolbar-color-swatch toolbar-color-swatch--clear"
            onPointerDown={(e) => {
              if (e.pointerType === 'mouse') e.preventDefault();
            }}
            onClick={() => {
              if (openPicker === 'text-color') handleClearFgColor();
              else handleClearBgColor();
            }}
          >
            ✕
          </button>
          {COLORS.map((color) => {
            const isActive =
              openPicker === 'text-color'
                ? activeFgColor.toLowerCase() === color.toLowerCase()
                : activeBgColor.toLowerCase() === color.toLowerCase();
            return (
              <button
                key={color}
                type="button"
                data-testid={`toolbar-color-swatch-${color.replace('#', '')}`}
                className={`toolbar-color-swatch${isActive ? ' toolbar-color-swatch--active' : ''}`}
                style={{ backgroundColor: color }}
                onPointerDown={(e) => {
                  if (e.pointerType === 'mouse') e.preventDefault();
                }}
                onClick={() => {
                  if (openPicker === 'text-color') handleSelectFgColor(color);
                  else handleSelectBgColor(color);
                }}
              />
            );
          })}
        </div>
      )}
      {openPicker === 'font-size' && (
        <div className="toolbar-font-picker">
          <button
            type="button"
            data-testid="font-size-clear"
            className="toolbar-font-option toolbar-font-option--clear"
            onPointerDown={(e) => {
              if (e.pointerType === 'mouse') e.preventDefault();
            }}
            onClick={handleClearFontSize}
          >
            ✕
          </button>
          {FONT_SIZES.map((size) => (
            <button
              key={size}
              type="button"
              data-testid={`font-size-${String(size)}`}
              className={`toolbar-font-option${
                size === activeFontSize ? ' toolbar-font-option--active' : ''
              }`}
              onPointerDown={(e) => {
                if (e.pointerType === 'mouse') e.preventDefault();
              }}
              onClick={() => {
                handleSelectFontSize(size);
              }}
            >
              {size}
            </button>
          ))}
        </div>
      )}
      {openPicker === 'font-family' && (
        <div className="toolbar-font-picker">
          <button
            type="button"
            data-testid="font-family-clear"
            className="toolbar-font-option toolbar-font-option--clear"
            onPointerDown={(e) => {
              if (e.pointerType === 'mouse') e.preventDefault();
            }}
            onClick={handleClearFontFamily}
          >
            ✕
          </button>
          {FONT_FAMILIES.map(({ label, value }) => (
            <button
              key={value}
              type="button"
              data-testid={`font-family-${value}`}
              className={`toolbar-font-option${
                value === activeFontFamily ? ' toolbar-font-option--active' : ''
              }`}
              style={{ fontFamily: value }}
              onPointerDown={(e) => {
                if (e.pointerType === 'mouse') e.preventDefault();
              }}
              onClick={() => {
                handleSelectFontFamily(value);
              }}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
