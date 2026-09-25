import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { apiFetch } from '@/utils/api';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, FlatList, Image, Modal, Pressable, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ChatsScreen() {
  const [chats, setChats] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [zoomedPhoto, setZoomedPhoto] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      async function fetchChats() {
        const data = await apiFetch("/chats");
        if (data) setChats(data);
      }
      fetchChats();
    }, [])
  );

  async function handleRefresh() {
    setRefreshing(true);
    const data = await apiFetch("/chats");
    if (data) setChats(data);
    setRefreshing(false);
  }

  async function handleDeleteChat(chatID: string) {
    await apiFetch("/chats/" + chatID, { method: "DELETE" });
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
    <SafeAreaView style={{ flex: 1 }}>
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
          refreshing={refreshing}
          onRefresh={handleRefresh}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => router.push({ pathname: "/chats/[chatID]", params: { chatID: item.chat_id } })}
              onLongPress={() => showChatOptions(item)}
            >
              <ThemedView style={{ flexDirection: 'row', alignItems: 'center', padding: 8, gap: 8 }}>
                <Pressable onPress={() => setZoomedPhoto(item.photo_url)}>
                  <Image
                    source={item.photo_url ? { uri: item.photo_url } : require('@/assets/images/icon.png')}
                    style={{ width: 50, height: 50, borderRadius: 25 }}
                  />
                </Pressable>
                <ThemedView>
                  <ThemedText>{item.nickname}</ThemedText>
                  <ThemedText>{item.last_message}</ThemedText>
                </ThemedView>
              </ThemedView>
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
        <Modal visible={!!zoomedPhoto} transparent={true} onRequestClose={() => setZoomedPhoto(null)}>
          <Pressable
            style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' }}
            onPress={() => setZoomedPhoto(null)}
          >
            <Image
              source={{ uri: zoomedPhoto || undefined }}
              style={{ width: '90%', height: '60%' }}
              resizeMode="contain"
            />
          </Pressable>
        </Modal>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});