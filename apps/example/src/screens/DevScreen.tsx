import { View, StyleSheet, Text, ScrollView } from 'react-native';
import { EnrichedTextInput } from 'react-native-enriched-html';
import { Button } from '../components/Button';
import {
  LINK_REGEX,
  htmlStyle,
  ANDROID_EXPERIMENTAL_SYNCHRONOUS_EVENTS,
} from '../constants/editorConfig';
import { useState } from 'react';

interface DevScreenProps {
  onSwitch: () => void;
}

export function DevScreen({}: DevScreenProps) {
  const [showEditor, setShowEditor] = useState(false);

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
      >
        <Text style={styles.label}>Enriched Text Input</Text>
        <Button
          title="Toggle editor's presence"
          onPress={() => setShowEditor((prev) => !prev)}
          style={styles.valueButton}
          testID="toggle-screen-button"
        />
        <View style={styles.editor} testID="editor-container">
          {showEditor && (
            <EnrichedTextInput
              style={styles.editorInput}
              htmlStyle={htmlStyle}
              placeholder="Type something here..."
              placeholderTextColor="rgb(0, 26, 114)"
              selectionColor="deepskyblue"
              cursorColor="dodgerblue"
              autoCapitalize="sentences"
              linkRegex={LINK_REGEX}
              androidExperimentalSynchronousEvents={
                ANDROID_EXPERIMENTAL_SYNCHRONOUS_EVENTS
              }
              defaultValue={`<html><h4>heading</h4><ul><li>list1</li><li>list2</li><li><code>codelist</code></li></ul><h3><code>codeheading</code></h3></html>`}
              testID="editor-input"
            />
          )}
        </View>
      </ScrollView>
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
  editorInput: {
    marginTop: 24,
    width: '100%',
    backgroundColor: 'gainsboro',
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
