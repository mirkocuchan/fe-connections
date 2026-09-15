import { Link } from 'expo-router';
import { StyleSheet, FlatList } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '@/constants/api';

export default function ChatsScreen() {
  const [chats, setChats] = useState<any[]>([]);
  useEffect(() => {
    async function fetchChats() {
      const token = await SecureStore.getItemAsync("token");
      const response = await fetch(API_BASE_URL + "/chats", {
        headers: { Authorization: "Bearer " + token },
      });
      const data = await response.json();
      setChats(data);
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
      />
      <Link href="/register"><ThemedText>Ir a registro</ThemedText></Link>
      <Link href="/login"><ThemedText>Ir a login</ThemedText></Link>

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
