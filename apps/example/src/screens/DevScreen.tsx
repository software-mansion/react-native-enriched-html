import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  type LayoutRectangle,
} from 'react-native';
import { EnrichedTextInput, type TextRect } from 'react-native-enriched-html';
import { Button } from '../components/Button';
import { Toolbar } from '../components/Toolbar';
import { LinkModal } from '../components/LinkModal';
import { ValueModal } from '../components/ValueModal';
import { MentionPopup } from '../components/MentionPopup';
import { HtmlSection } from '../components/HtmlSection';
import { ImageModal } from '../components/ImageModal';
import { useEditorState } from '../hooks/useEditorState';
import {
  LINK_REGEX,
  htmlStyle,
  ANDROID_EXPERIMENTAL_SYNCHRONOUS_EVENTS,
} from '../constants/editorConfig';
import { useEffect, useState } from 'react';
import { TextRenderer } from '../components/TextRenderer';

interface DevScreenProps {
  onSwitch: () => void;
}

export function DevScreen({ onSwitch }: DevScreenProps) {
  const editor = useEditorState();
  const [textNodes, setTextNodes] = useState<Array<string>>([]);
  const [inputLayout, setInputLayout] = useState<LayoutRectangle>();
  const [selectionRects, setSelectionRects] = useState<TextRect[]>([]);

  // Draws an overlay over the current selection, the way another user's
  // cursor or selection could be drawn
  useEffect(() => {
    if (!editor.selection) return;
    editor.ref.current
      ?.measureRanges([editor.selection])
      .then(([rects]) => setSelectionRects(rects ?? []))
      .catch(() => {});
  }, [editor.ref, editor.selection, inputLayout]);

  const handlePushTextNode = async () => {
    const currentText = await editor.ref.current?.getHTML();
    if (currentText) {
      setTextNodes((prevTextNodes) => [...prevTextNodes, currentText]);
    }

    editor.ref.current?.setValue('');
  };

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
      >
        <Text style={styles.label}>Enriched Text Input</Text>
        <View style={styles.editor} testID="editor-container">
          <EnrichedTextInput
            ref={editor.ref}
            mentionIndicators={['@', '#']}
            style={styles.editorInput}
            htmlStyle={htmlStyle}
            placeholder="Type something here..."
            placeholderTextColor="rgb(0, 26, 114)"
            selectionColor="deepskyblue"
            cursorColor="dodgerblue"
            autoCapitalize="sentences"
            linkRegex={LINK_REGEX}
            onChangeText={(e) => editor.handleChangeText(e.nativeEvent)}
            onChangeHtml={(e) => editor.handleChangeHtml(e.nativeEvent)}
            onChangeState={(e) => editor.handleChangeState(e.nativeEvent)}
            onLinkDetected={editor.handleLinkDetected}
            onMentionDetected={console.log}
            onStartMention={editor.handleStartMention}
            onChangeMention={editor.handleChangeMention}
            onEndMention={editor.handleEndMention}
            onFocus={editor.handleFocusEvent}
            onBlur={editor.handleBlurEvent}
            onChangeSelection={(e) =>
              editor.handleSelectionChangeEvent(e.nativeEvent)
            }
            onSubmitEditing={(e) =>
              editor.handleSubmitEditingEvent(e.nativeEvent)
            }
            onKeyPress={(e) => editor.handleKeyPress(e.nativeEvent)}
            androidExperimentalSynchronousEvents={
              ANDROID_EXPERIMENTAL_SYNCHRONOUS_EVENTS
            }
            onPasteImages={(e) => editor.handlePasteImagesEvent(e.nativeEvent)}
            onLayout={(e) => setInputLayout(e.nativeEvent.layout)}
            testID="editor-input"
          />
          {inputLayout &&
            selectionRects.map((rect, index) => (
              <View
                key={index}
                pointerEvents="none"
                style={[
                  styles.selectionRect,
                  {
                    left: inputLayout.x + rect.x,
                    top: inputLayout.y + rect.y,
                    width: Math.max(rect.width, 2),
                    height: rect.height,
                  },
                ]}
              />
            ))}
          <Toolbar
            stylesState={editor.stylesState}
            editorRef={editor.ref}
            onOpenLinkModal={editor.openLinkModal}
            onSelectImage={editor.openImageModal}
            layout="horizontal"
          />
        </View>
        <HtmlSection currentHtml={editor.currentHtml} />
        <View style={styles.buttonStack}>
          <Button
            title="Set input's value"
            onPress={editor.openValueModal}
            style={styles.button}
          />
          <Button
            title="Push text"
            onPress={handlePushTextNode}
            style={styles.button}
          />
        </View>
        <Button
          title="Test Screen"
          onPress={onSwitch}
          style={styles.valueButton}
          testID="toggle-screen-button"
        />
        <TextRenderer nodes={textNodes} />
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
        onSubmit={editor.selectImage}
        onClose={editor.closeImageModal}
      />
      <ValueModal
        isOpen={editor.isValueModalOpen}
        onSubmit={editor.submitSetValue}
        onClose={editor.closeValueModal}
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
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  content: {
    flexGrow: 1,
    padding: 16,
    paddingTop: 100,
    alignItems: 'center',
  },
  editor: {
    width: '100%',
  },
  label: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    color: 'rgb(0, 26, 114)',
  },
  buttonStack: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  button: {
    width: '45%',
  },
  valueButton: {
    width: '100%',
  },
  selectionRect: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 140, 0, 0.35)',
  },
  editorInput: {
    marginTop: 24,
    width: '100%',
    maxHeight: 180,
    backgroundColor: 'gainsboro',
    fontSize: 18,
    fontFamily: 'Nunito-Regular',
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  scrollPlaceholder: {
    marginTop: 24,
    width: '100%',
    height: 1000,
    backgroundColor: 'rgb(0, 26, 114)',
  },
});
