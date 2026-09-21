import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { apiFetch } from '@/utils/api';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet } from 'react-native';

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
          <Pressable onPress={() => router.push("/chats/" + item.chat_id)}>
            <ThemedText>{item.nickname}</ThemedText>
          </Pressable>
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