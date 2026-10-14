import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { EnrichedText, EnrichedTextInput } from 'react-native-enriched-html';
import { ImageModal } from './components/ImageModal';
import { LinkModal } from './components/LinkModal';
import { MentionPopup } from './components/MentionPopup';
import { useEditorState } from './hooks/useEditorState';

interface ToolbarButtonProps {
  label: string;
  active?: boolean;
  onPress: () => void;
}

function ToolbarButton({ label, active, onPress }: ToolbarButtonProps) {
  return (
    <Pressable
      style={[styles.button, active && styles.buttonActive]}
      onPress={onPress}
    >
      <Text style={styles.buttonLabel}>{label}</Text>
    </Pressable>
  );
}

export const LINK_REGEX =
  /^(?:enriched:\/\/\S+|(?:https?:\/\/)?(?:www\.)?swmansion\.com(?:\/\S*)?)$/i;

export default function App() {
  const editor = useEditorState();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.heading}>EnrichedTextInput</Text>
        <View style={styles.toolbar}>
          <ToolbarButton
            label="B"
            active={editor.stylesState?.bold.isActive}
            onPress={() => editor.ref.current?.toggleBold()}
          />
          <ToolbarButton
            label="I"
            active={editor.stylesState?.italic.isActive}
            onPress={() => editor.ref.current?.toggleItalic()}
          />
          <ToolbarButton
            label="U"
            active={editor.stylesState?.underline.isActive}
            onPress={() => editor.ref.current?.toggleUnderline()}
          />
          <ToolbarButton
            label="S"
            active={editor.stylesState?.strikeThrough.isActive}
            onPress={() => editor.ref.current?.toggleStrikeThrough()}
          />
          <ToolbarButton
            label="Code"
            active={editor.stylesState?.inlineCode.isActive}
            onPress={() => editor.ref.current?.toggleInlineCode()}
          />
          <ToolbarButton
            label="H1"
            active={editor.stylesState?.h1.isActive}
            onPress={() => editor.ref.current?.toggleH1()}
          />
          <ToolbarButton
            label="H4"
            active={editor.stylesState?.h4.isActive}
            onPress={() => editor.ref.current?.toggleH4()}
          />
          <ToolbarButton
            label="Quote"
            active={editor.stylesState?.blockQuote.isActive}
            onPress={() => editor.ref.current?.toggleBlockQuote()}
          />
          <ToolbarButton
            label="Code block"
            active={editor.stylesState?.codeBlock.isActive}
            onPress={() => editor.ref.current?.toggleCodeBlock()}
          />
          <ToolbarButton
            label="1."
            active={editor.stylesState?.orderedList.isActive}
            onPress={() => editor.ref.current?.toggleOrderedList()}
          />
          <ToolbarButton
            label="•"
            active={editor.stylesState?.unorderedList.isActive}
            onPress={() => editor.ref.current?.toggleUnorderedList()}
          />
          <ToolbarButton
            label="☑"
            active={editor.stylesState?.checkboxList.isActive}
            onPress={() => editor.ref.current?.toggleCheckboxList(false)}
          />
          <ToolbarButton
            label="Link"
            active={editor.stylesState?.link.isActive}
            onPress={editor.openLinkModal}
          />
          <ToolbarButton
            label="Image"
            active={editor.stylesState?.image.isActive}
            onPress={editor.openImageModal}
          />
          <ToolbarButton
            label="@"
            active={editor.stylesState?.mention.isActive}
            onPress={() => editor.ref.current?.startMention('@')}
          />
          <ToolbarButton
            label="<-"
            active={editor.stylesState?.alignment === 'left'}
            onPress={() => editor.ref.current?.setTextAlignment('left')}
          />
          <ToolbarButton
            label="<->"
            active={editor.stylesState?.alignment === 'center'}
            onPress={() => editor.ref.current?.setTextAlignment('center')}
          />
          <ToolbarButton
            label="->"
            active={editor.stylesState?.alignment === 'right'}
            onPress={() => editor.ref.current?.setTextAlignment('right')}
          />
          <ToolbarButton
            label="< - >"
            active={editor.stylesState?.alignment === 'justify'}
            onPress={() => editor.ref.current?.setTextAlignment('justify')}
          />
          <ToolbarButton label="Refresh" onPress={editor.refresh} />
        </View>
        <View style={styles.editorContainer}>
          <EnrichedTextInput
            ref={editor.ref}
            mentionIndicators={['@', '#']}
            style={styles.input}
            placeholder="Type something rich..."
            onChangeState={(e) => editor.handleChangeState(e.nativeEvent)}
            onChangeHtml={(e) => editor.handleChangeHtml(e.nativeEvent.value)}
            onChangeSelection={(e) =>
              editor.handleSelectionChange(e.nativeEvent)
            }
            onPasteImages={(e) => editor.handlePasteImagesEvent(e.nativeEvent)}
            onLinkDetected={editor.handleLinkDetected}
            onStartMention={editor.handleStartMention}
            onChangeMention={editor.handleChangeMention}
            onEndMention={editor.handleEndMention}
            linkRegex={LINK_REGEX}
          />
          <MentionPopup
            variant="user"
            data={editor.userMention.data}
            isOpen={editor.isUserPopupOpen}
            onItemPress={editor.handleUserMentionSelected}
          />
          <MentionPopup
            variant="channel"
            data={editor.channelMention.data}
            isOpen={editor.isChannelPopupOpen}
            onItemPress={editor.handleChannelMentionSelected}
          />
        </View>
        <Text style={styles.heading}>HTML output</Text>
        <Text style={styles.html}>{editor.currentHtml}</Text>
        <Text style={styles.heading}>EnrichedText</Text>
        <EnrichedText style={styles.text}>{editor.currentHtml}</EnrichedText>
      </ScrollView>
      <LinkModal
        isOpen={editor.isLinkModalOpen}
        editedText={
          editor.insideCurrentLink
            ? editor.currentLink.text
            : (editor.selection?.text ?? '')
        }
        editedUrl={editor.insideCurrentLink ? editor.currentLink.url : ''}
        onSubmit={editor.submitLink}
        onClose={editor.closeLinkModal}
      />
      <ImageModal
        isOpen={editor.isImageModalOpen}
        onSubmit={editor.submitImage}
        onClose={editor.closeImageModal}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // Explicit colors: the RN root window is white regardless of the system
    // appearance, while Text defaults to the semantic labelColor (white in
    // dark mode), which would make all labels invisible.
    backgroundColor: '#fff',
  },
  content: {
    padding: 16,
    gap: 12,
  },
  heading: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  toolbar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  button: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#8888',
  },
  buttonActive: {
    backgroundColor: '#4444',
  },
  buttonLabel: {
    fontSize: 14,
    color: '#000',
  },
  editorContainer: {
    width: 400,
  },
  input: {
    minHeight: 120,
    width: '100%',
    borderWidth: 1,
    borderColor: '#8888',
    borderRadius: 8,
    padding: 8,
    fontSize: 16,
  },
  html: {
    fontFamily: 'Menlo',
    fontSize: 12,
    color: '#000',
  },
  text: {
    fontSize: 16,
  },
});
