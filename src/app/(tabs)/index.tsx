import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { apiFetch } from '@/utils/api';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, TextInput } from 'react-native';

export default function ChatsScreen() {
  const [chats, setChats] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function fetchChats() {
      const data = await apiFetch("/chats");
      if (data) setChats(data);
    }
    fetchChats();
  }, []);

  async function handleDeleteChat(chatID: string) {
    await apiFetch("/chats/" + chatID, {
      method: "DELETE",
    });
    const data = await apiFetch("/chats");
    if (data) setChats(data);
  }

  async function handleBlockUser(userID: string) {
    await apiFetch("/me/block/" + userID, { method: "POST" });
    const data = await apiFetch("/chats");
    if (data) setChats(data);
  }

  function handleReportUser(chatID: string) {
    router.push({ pathname: "/chats/[chatID]", params: { chatID } });
  }
  function showChatOptions(item: any) {
    Alert.alert(
      "Opciones",
      "¿Qué querés hacer con este chat?",
      [
        { text: "Borrar", onPress: () => handleDeleteChat(item.chat_id), style: "destructive" },
        { text: "Bloquear", onPress: () => handleBlockUser(item.other_user_id) },
        { text: "Reportar", onPress: () => handleReportUser(item.chat_id) },
        { text: "Cancelar", style: "cancel" },
      ]
    );
  }  
  
  const filteredChats = chats.filter((chat) =>
    chat.nickname.toLowerCase().includes(searchQuery.toLowerCase())
  );
  return (
    <ThemedView style={styles.container}>
      <TextInput
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Buscar..."
        style={{ color: '#ffffff', borderWidth: 1, borderColor: '#555555', padding: 8 }}
      />
      <FlatList
        data={filteredChats}
        keyExtractor={(item) => item.chat_id}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push({ pathname: "/chats/[chatID]", params: { chatID: item.chat_id } })}
            onLongPress={() => showChatOptions(item)}
          >
            <ThemedText>{item.nickname}</ThemedText>
          </Pressable>
        )}
        ListEmptyComponent={
          <ThemedText>
            {searchQuery
              ? "No se encontraron chats con ese nombre."
              : "¡Iniciá alguna conversación para ver algo acá!"}
          </ThemedText>
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