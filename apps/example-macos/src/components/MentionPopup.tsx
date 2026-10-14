import type { FC } from 'react';
import {
  FlatList,
  type ListRenderItemInfo,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

export interface MentionItem {
  id: string;
  name: string;
}

export type MentionData = MentionItem[];

interface MentionPopupProps {
  variant: 'user' | 'channel';
  data: MentionData;
  isOpen: boolean;
  onItemPress: (item: MentionItem) => void;
}

export const MentionPopup: FC<MentionPopupProps> = ({
  variant,
  data,
  isOpen,
  onItemPress,
}) => {
  if (!isOpen || !data.length) return null;

  const renderItem = ({ item }: ListRenderItemInfo<MentionItem>) => (
    <Pressable
      style={({ pressed }) => [
        styles.itemContainer,
        pressed && styles.itemContainerPressed,
      ]}
      onPress={() => onItemPress(item)}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarLabel}>{variant === 'user' ? '@' : '#'}</Text>
      </View>
      <Text style={styles.itemLabel}>{item.name}</Text>
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={data}
        style={styles.scrollView}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: '100%',
    zIndex: 100,
    top: 400,
  },
  scrollView: {
    flex: 1,
    borderRadius: 8,
    maxHeight: 200,
    borderWidth: 1,
    borderColor: 'grey',
    backgroundColor: 'white',
  },
  content: {
    flexGrow: 1,
    paddingVertical: 16,
  },
  itemContainer: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  itemContainerPressed: {
    backgroundColor: 'rgba(0, 26, 114, 0.1)',
  },
  itemLabel: {
    fontSize: 16,
    color: '#000',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
    backgroundColor: 'gainsboro',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'rgb(0, 26, 114)',
  },
});
