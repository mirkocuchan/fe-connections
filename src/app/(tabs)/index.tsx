import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { apiFetch, apiFetchChecked } from '@/utils/api';
import { onSocketEvent } from '@/utils/socket';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, FlatList, Image, Modal, Pressable, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ChatsScreen() {
  const [chats, setChats] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [zoomedPhoto, setZoomedPhoto] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchChats = useCallback(async () => {
    const data = await apiFetch("/chats");
    if (data) setChats(data);
  }, []);

  //siempre tenemos a mano la lista actual para consultarla dentro del handler del socket
  const chatsRef = useRef<any[]>([]);
  chatsRef.current = chats;

  useFocusEffect(
    useCallback(() => {
      fetchChats();
    }, [fetchChats])
  );

  useEffect(() => {
    return onSocketEvent((ev) => {
      if (ev.type === "resync") {
        fetchChats();
      } else if (ev.type === "new_message") {
        const known = chatsRef.current.some((c) => c.chat_id === ev.chat_id);
        if (!known) {
          fetchChats(); //chat nuevo: lo pedimos al servidor, que calcula el nombre anónimo
          return;
        }
        setChats((prev) => {
          const idx = prev.findIndex((c) => c.chat_id === ev.chat_id);
          if (idx === -1) return prev;
          const updated = { ...prev[idx], last_message: ev.message.content };
          return [updated, ...prev.slice(0, idx), ...prev.slice(idx + 1)];
        });
      }
    });
  }, [fetchChats]);

  async function handleRefresh() {
    setRefreshing(true);
    await fetchChats();
    setRefreshing(false);
  }

  async function handleDeleteChat(chatID: string) {
    const { ok, data } = await apiFetchChecked("/chats/" + chatID, { method: "DELETE" });
    if (!ok) {
      Alert.alert("No se pudo borrar", data?.error || "Intentá de nuevo");
      return;
    }
    await fetchChats();
  }

  async function handleBlockUser(chatID: string) {
    const { ok, data } = await apiFetchChecked("/chats/" + chatID + "/block", { method: "POST" });
    if (!ok) {
      Alert.alert("No se pudo bloquear", data?.error || "Intentá de nuevo");
      return;
    }
    await fetchChats();
  }

  async function handleUnblockUser(chatID: string) {
    const { ok, data } = await apiFetchChecked("/chats/" + chatID + "/block", { method: "DELETE" });
    if (!ok) {
      Alert.alert("No se pudo desbloquear", data?.error || "Intentá de nuevo");
      return;
    }
    await fetchChats();
  }

  function openChat(item: any) {
    router.push({
      pathname: "/chats/[chatID]",
      params: {
        chatID: item.chat_id,
        nickname: item.nickname,
        blocked: item.blocked ? "1" : "0",
      },
    });
  }
  
  function showChatOptions(item: any) {
    Alert.alert(
      "Opciones",
      "¿Qué querés hacer con este chat?",
      [
        { text: "Borrar", onPress: () => handleDeleteChat(item.chat_id), style: "destructive" },
        item.blocked
          ? { text: "Desbloquear", onPress: () => handleUnblockUser(item.chat_id) }
          : { text: "Bloquear", onPress: () => handleBlockUser(item.chat_id) },
        { text: "Reportar", onPress: () => openChat(item) },
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
              onPress={() => openChat(item)}
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
                  {item.blocked && <ThemedText>Bloqueado</ThemedText>}
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