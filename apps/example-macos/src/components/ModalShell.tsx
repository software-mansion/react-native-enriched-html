import { type FC, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

interface ModalShellProps {
  isOpen: boolean;
  children: ReactNode;
}

// react-native-macos doesn't implement the native Modal host component
// (RCTModalHostView is compiled out on macOS), so RN's <Modal> throws
// "exception in hostfunction" there. Render a plain absolutely-positioned
// overlay instead, matching apps/example-web/src/components/BaseModal.tsx.
export const ModalShell: FC<ModalShellProps> = ({ isOpen, children }) => {
  if (!isOpen) return null;

  return <View style={styles.container}>{children}</View>;
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1000,
  },
});
