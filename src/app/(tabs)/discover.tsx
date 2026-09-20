import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { apiFetch } from '@/utils/api';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet } from 'react-native';

export default function DiscoverScreen() {
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    async function fetchDiscoverUsers() {
      const data = await apiFetch("/users/discover");
      if (data) setUsers(data);
    }
    fetchDiscoverUsers();
  }, []);

  async function handlePressUser(user: any) {
    const data = await apiFetch("/chats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ other_user_id: user.user_id }),
    });
    if (data) router.push("/chats/" + data.chat_id);
  }

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={users}
        keyExtractor={(item) => item.user_id}
        renderItem={({ item }) => (
          <Pressable onPress={() => handlePressUser(item)}>
            <ThemedText>{item.display_name}</ThemedText>
          </Pressable>
        )}
        ListEmptyComponent={
          <ThemedText>No hay nadie para descubrir todavía.</ThemedText>
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