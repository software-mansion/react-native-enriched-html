import { type FC, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { ModalShell } from './ModalShell';

interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    width: number | undefined,
    height: number | undefined,
    url: string
  ) => void;
}

export const ImageModal: FC<ImageModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [url, setUrl] = useState('');

  const resetState = () => {
    setWidth('');
    setHeight('');
    setUrl('');
  };

  const closeModal = () => {
    onClose();
    resetState();
  };

  const handleSave = () => {
    if (url.trim().length === 0) return;

    const parsedWidth = parseFloat(width);
    const parsedHeight = parseFloat(height);
    const finalWidth = isNaN(parsedWidth) ? undefined : parsedWidth;
    const finalHeight = isNaN(parsedHeight) ? undefined : parsedHeight;

    onSubmit(finalWidth, finalHeight, url.trim());
    closeModal();
  };

  return (
    <ModalShell isOpen={isOpen}>
      <View style={styles.modal}>
        <View style={styles.header}>
          <Pressable onPress={closeModal} style={styles.closeButton}>
            <Text style={styles.closeLabel}>✕</Text>
          </Pressable>
        </View>
        <View style={styles.content}>
          <TextInput
            placeholder="Width"
            placeholderTextColor="gray"
            style={styles.input}
            value={width}
            onChangeText={setWidth}
          />
          <TextInput
            placeholder="Height"
            placeholderTextColor="gray"
            style={styles.input}
            value={height}
            onChangeText={setHeight}
          />
          <TextInput
            placeholder="Remote URL"
            placeholderTextColor="gray"
            style={styles.input}
            value={url}
            autoCapitalize="none"
            onChangeText={setUrl}
            autoCorrect={false}
          />
          <Pressable
            onPress={handleSave}
            disabled={url.trim().length === 0}
            style={[
              styles.saveButton,
              url.trim().length === 0 && styles.disabled,
            ]}
          >
            <Text style={styles.saveButtonLabel}>Insert Image</Text>
          </Pressable>
        </View>
      </View>
    </ModalShell>
  );
};

const styles = StyleSheet.create({
  modal: {
    width: 300,
    height: 320,
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
