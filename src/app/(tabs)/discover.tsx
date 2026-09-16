import { StyleSheet, FlatList } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '@/constants/api';
import { Pressable } from 'react-native';
import { router } from 'expo-router';

export default function DiscoverScreen() {
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    async function fetchDiscoverUsers() {
      const token = await SecureStore.getItemAsync("token");
      const response = await fetch(API_BASE_URL + "/users/discover", {
        headers: { Authorization: "Bearer " + token },
      });
      const data = await response.json();
      setUsers(data);
    }
    fetchDiscoverUsers();
  }, []);

  async function handlePressUser(user: any) {
    const token = await SecureStore.getItemAsync("token");
    const response = await fetch(API_BASE_URL + "/chats", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
      body: JSON.stringify({ other_user_id: user.user_id }),
    });
    const data = await response.json();
    router.push("/chats/" + data.chat_id);
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
  title: {
    textAlign: 'center',
  },
});
