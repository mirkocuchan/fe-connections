import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { apiFetch, apiFetchChecked } from '@/utils/api';
import { getActiveChat } from '@/utils/push';
import { onSocketEvent } from '@/utils/socket';
import { setUnreadTotal } from '@/utils/unread';
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
        const isOpen = getActiveChat() === ev.chat_id;
        setChats((prev) => {
          const idx = prev.findIndex((c) => c.chat_id === ev.chat_id);
          if (idx === -1) return prev;
          const updated = {
            ...prev[idx],
            last_message: ev.message.content,
            unread_count: isOpen ? 0 : (prev[idx].unread_count ?? 0) + 1,
          };
          return [updated, ...prev.slice(0, idx), ...prev.slice(idx + 1)];
        });
      }
    });
  }, [fetchChats]);
  
  useEffect(() => {
    setUnreadTotal(chats.filter((c) => c.unread_count > 0).length);
  }, [chats]);

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
    <SafeAreaView style={{ flex: 1 }} edges={['left', 'right']}>
      <ThemedView style={styles.container}>
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Buscar..."
          placeholderTextColor="#888"
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.search}
        />
        <FlatList
          data={filteredChats}
          keyExtractor={(item) => item.chat_id}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          renderItem={({ item }) => {
            const unread = item.unread_count > 0;
            const initial = item.nickname?.startsWith("anon-")
              ? "?"
              : (item.nickname ?? "?").charAt(0).toUpperCase();
            return (
              <Pressable
                style={styles.row}
                onPress={() => openChat(item)}
                onLongPress={() => showChatOptions(item)}
              >
                <Pressable
                  onPress={() => item.photo_url && setZoomedPhoto(item.photo_url)}
                  hitSlop={6}
                >
                  {item.photo_url ? (
                    <Image source={{ uri: item.photo_url }} style={styles.avatar} />
                  ) : (
                    <ThemedView style={[styles.avatar, styles.avatarEmpty]}>
                      <ThemedText style={styles.avatarLetter}>{initial}</ThemedText>
                    </ThemedView>
                  )}
                </Pressable>
                <ThemedView style={styles.info}>
                  <ThemedText style={[styles.name, unread && { fontWeight: '700' }]} numberOfLines={1}>
                    {item.nickname}
                  </ThemedText>
                  <ThemedText style={[styles.last, unread && { opacity: 1 }]} numberOfLines={1}>
                    {item.blocked ? "Bloqueado · " : ""}{item.last_message}
                  </ThemedText>
                </ThemedView>
                {unread && (
                  <ThemedView style={styles.badge}>
                    <ThemedText style={styles.badgeText}>
                      {item.unread_count > 99 ? "99+" : item.unread_count}
                    </ThemedText>
                  </ThemedView>
                )}
              </Pressable>
            );
          }}
          ListEmptyComponent={
            <ThemedText style={styles.empty}>
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
  },
  badge: {
    backgroundColor: '#3c87f7',
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
  },
  search: {
    marginHorizontal: 12,
    marginVertical: 10,
    color: '#ffffff',
    borderWidth: 1,
    borderColor: '#555',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  avatar: { width: 50, height: 50, borderRadius: 25 },
  avatarEmpty: { backgroundColor: '#444', alignItems: 'center', justifyContent: 'center' },
  avatarLetter: { fontSize: 22, fontWeight: '600', color: '#fff' },
  info: { flex: 1 },
  name: { fontSize: 17 },
  last: { fontSize: 14, opacity: 0.6, marginTop: 2 },
  empty: { textAlign: 'center', marginTop: 32, opacity: 0.6 },
});