import { type FC, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { ModalShell } from './ModalShell';

interface LinkModalProps {
  isOpen: boolean;
  editedText: string;
  editedUrl: string;
  onClose: () => void;
  onSubmit: (text: string, url: string) => void;
}

export const LinkModal: FC<LinkModalProps> = ({
  isOpen,
  editedText,
  editedUrl,
  onClose,
  onSubmit,
}) => {
  const [text, setText] = useState('');
  const [url, setUrl] = useState('');

  useEffect(() => {
    setText(editedText);
    setUrl(editedUrl);
  }, [editedText, editedUrl]);

  const handleSave = () => {
    onSubmit(text, url);
  };

  return (
    <ModalShell isOpen={isOpen}>
      <View style={styles.modal}>
        <View style={styles.header}>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeLabel}>✕</Text>
          </Pressable>
        </View>
        <View style={styles.content}>
          <TextInput
            placeholder="Text"
            defaultValue={editedText}
            style={styles.input}
            onChangeText={setText}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TextInput
            placeholder="Link"
            defaultValue={editedUrl}
            style={styles.input}
            onChangeText={setUrl}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Pressable
            onPress={handleSave}
            disabled={url.length === 0}
            style={[styles.saveButton, url.length === 0 && styles.disabled]}
          >
            <Text style={styles.saveButtonLabel}>Save</Text>
          </Pressable>
        </View>
      </View>
    </ModalShell>
  );
};

const styles = StyleSheet.create({
  modal: {
    width: 300,
    height: 240,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
  },
  header: {
    width: '100%',
    alignItems: 'flex-end',
  },
  closeButton: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 24,
    height: 24,
  },
  closeLabel: {
    fontSize: 16,
    color: 'rgb(0, 26, 114)',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    fontSize: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'grey',
    width: '100%',
    marginVertical: 10,
    color: '#000',
  },
  saveButton: {
    width: '75%',
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgb(0, 26, 114)',
    alignItems: 'center',
  },
  disabled: {
    backgroundColor: 'darkgray',
  },
  saveButtonLabel: {
    color: 'white',
    fontWeight: 'bold',
  },
});
