import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { apiFetch } from '@/utils/api';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { FlatList, Image, Modal, Pressable, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function DiscoverScreen() {
  const [users, setUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [zoomedPhoto, setZoomedPhoto] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<any[]>([]);

  async function fetchDiscoverUsers() {
    const data = await apiFetch("/users/discover");
    if (data) setUsers(data);
  }

  useFocusEffect(
    useCallback(() => {
      fetchDiscoverUsers();
    }, [])
  );

  useEffect(() => {
    const q = searchQuery.trim();
    if (q === "") {
      setSearchResults([]);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      const data = await apiFetch("/users/search?q=" + encodeURIComponent(q));
      if (!cancelled && Array.isArray(data)) setSearchResults(data);
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [searchQuery]);

  function handlePressUser(user: any) {
    router.push({
      pathname: "/chats/new",
      params: { userID: user.user_id, name: user.display_name ?? user.username },
    });
  }

  const isSearching = searchQuery.trim() !== "";
  const listData = isSearching ? searchResults : users;

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['left', 'right']}>
      <ThemedView style={styles.container}>
        <ThemedView style={styles.topBar}>
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Buscar por nombre..."
            placeholderTextColor="#888"
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.search}
          />
          {!isSearching && (
            <Pressable style={styles.shuffle} onPress={fetchDiscoverUsers}>
              <ThemedText style={styles.shuffleText}>🔀 Mezclar</ThemedText>
            </Pressable>
          )}
        </ThemedView>

        <FlatList
          data={listData}
          keyExtractor={(item) => item.user_id}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 16 }}
          renderItem={({ item }) => (
            <Pressable style={styles.row} onPress={() => handlePressUser(item)}>
              <Pressable onPress={() => setZoomedPhoto(item.photo_url)} hitSlop={6}>
                {item.photo_url ? (
                  <Image source={{ uri: item.photo_url }} style={styles.avatar} />
                ) : (
                  <ThemedView style={[styles.avatar, styles.avatarEmpty]}>
                    <ThemedText style={styles.avatarLetter}>
                      {(item.display_name ?? item.username ?? "?").charAt(0).toUpperCase()}
                    </ThemedText>
                  </ThemedView>
                )}
              </Pressable>
              <ThemedText style={styles.name} numberOfLines={1}>
                {item.display_name ?? item.username}
              </ThemedText>
            </Pressable>
          )}
          ListEmptyComponent={
            <ThemedText style={styles.empty}>
              {isSearching
                ? "No se encontraron resultados."
                : "No hay nadie para descubrir todavía."}
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
  container: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  search: {
    flex: 1,
    color: '#ffffff',
    borderWidth: 1,
    borderColor: '#555',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
  },
  shuffle: {
    backgroundColor: '#3c87f7',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  shuffleText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#333',
  },
  avatar: { width: 50, height: 50, borderRadius: 25 },
  name: { flex: 1, fontSize: 17 },
  empty: { textAlign: 'center', marginTop: 32, opacity: 0.7 },
  avatarEmpty: { backgroundColor: '#444', alignItems: 'center', justifyContent: 'center' },
  avatarLetter: { fontSize: 22, fontWeight: '600', color: '#fff' },
});