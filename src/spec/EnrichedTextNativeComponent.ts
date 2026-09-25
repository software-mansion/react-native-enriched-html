import { codegenNativeComponent, type ColorValue } from 'react-native';
import type { CodegenTypes, HostComponent, ViewProps } from 'react-native';

type BaseStyle = {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
};

type Heading = {
  fontSize?: CodegenTypes.Float;
} & BaseStyle;

export interface EnrichedTextHtmlStyleInternal {
  bold?: BaseStyle;
  italic?: BaseStyle;
  underline?: BaseStyle;
  strikethrough?: BaseStyle;
  h1?: Heading;
  h2?: Heading;
  h3?: Heading;
  h4?: Heading;
  h5?: Heading;
  h6?: Heading;
  blockquote?: {
    borderColor?: ColorValue;
    borderWidth?: CodegenTypes.Float;
    gapWidth?: CodegenTypes.Float;
    color?: ColorValue;
  } & BaseStyle;
  codeblock?: {
    color?: ColorValue;
    borderRadius?: CodegenTypes.Float;
    backgroundColor?: ColorValue;
  } & BaseStyle;
  code?: {
    color?: ColorValue;
    backgroundColor?: ColorValue;
  } & BaseStyle;
  a?: {
    color?: ColorValue;
    textDecorationLine?: string;
    pressColor?: ColorValue;
    pressTextDecorationLine?: string;
  } & BaseStyle;
  // This is a workaround for the fact that codegen does not support Records.
  // On native Android side this will become a ReadableMap, on native iOS we can work with a folly::dynamic object.
  mention?: CodegenTypes.UnsafeMixed;
  ol?: {
    gapWidth?: CodegenTypes.Float;
    marginLeft?: CodegenTypes.Float;
    markerFontWeight?: string;
    markerColor?: ColorValue;
  } & BaseStyle;
  ul?: {
    bulletColor?: ColorValue;
    bulletSize?: CodegenTypes.Float;
    marginLeft?: CodegenTypes.Float;
    gapWidth?: CodegenTypes.Float;
  } & BaseStyle;
  ulCheckbox?: {
    gapWidth?: CodegenTypes.Float;
    boxSize?: CodegenTypes.Float;
    marginLeft?: CodegenTypes.Float;
    boxColor?: ColorValue;
  } & BaseStyle;
}

export interface OnLinkPressEvent {
  url: string;
}

export interface OnMentionPressEventInternal {
  text: string;
  indicator: string;
  attributes: CodegenTypes.UnsafeMixed;
}

export interface OnMentionPressEvent {
  text: string;
  indicator: string;
  attributes: Record<string, string>;
}

export interface OnImagePressEvent {
  image: {
    uri: string;
    width: CodegenTypes.Float;
    height: CodegenTypes.Float;
  };
}

export interface NativeProps extends ViewProps {
  // Custom props
  text: string;
  htmlStyle?: EnrichedTextHtmlStyleInternal;
  useHtmlNormalizer: boolean;
  allowFontScaling?: boolean;

  // ReactNative TextProps
  ellipsizeMode: string;
  numberOfLines: CodegenTypes.Int32;
  selectable: boolean;
  selectionColor?: ColorValue;

  // Events
  onLinkPress?: CodegenTypes.DirectEventHandler<OnLinkPressEvent>;
  onMentionPress?: CodegenTypes.DirectEventHandler<OnMentionPressEventInternal>;
  onImagePress?: CodegenTypes.DirectEventHandler<OnImagePressEvent>;

  // Style related props - used for generating proper setters in component's manager
  // These should not be passed as regular props
  color?: ColorValue;
  fontSize?: CodegenTypes.Float;
  lineHeight?: CodegenTypes.Float;
  fontFamily?: string;
  fontWeight?: string;
  fontStyle?: string;
}

export default codegenNativeComponent<NativeProps>('EnrichedTextView', {
  interfaceOnly: true,
}) as HostComponent<NativeProps>;
