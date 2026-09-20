import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { apiFetch } from '@/utils/api';
import { useEffect, useState } from 'react';
import { FlatList, StyleSheet } from 'react-native';

export default function ChatsScreen() {
  const [chats, setChats] = useState<any[]>([]);

  useEffect(() => {
    async function fetchChats() {
      const data = await apiFetch("/chats");
      if (data) setChats(data);
    }
    fetchChats();
  }, []);

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={chats}
        keyExtractor={(item) => item.chat_id}
        renderItem={({ item }) => (
          <ThemedText>{item.nickname}</ThemedText>
        )}
        ListEmptyComponent={
          <ThemedText>¡Iniciá alguna conversación para ver algo acá!</ThemedText>
        }
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});