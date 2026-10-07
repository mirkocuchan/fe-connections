import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { apiFetch } from '@/utils/api';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Button, FlatList, Image, Modal, Pressable, StyleSheet, TextInput } from 'react-native';
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
    <SafeAreaView style={{ flex: 1 }}>
      <ThemedView style={styles.container}>
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Buscar..."
          style={{ color: '#ffffff', borderWidth: 1, borderColor: '#555555', padding: 8 }}
        />
        <Button title="🔀 Reshuffle" onPress={fetchDiscoverUsers} />
        <FlatList
          data={listData}
          keyExtractor={(item) => item.user_id}
          renderItem={({ item }) => (
            <Pressable onPress={() => handlePressUser(item)}>
              <ThemedView style={{ flexDirection: 'row', alignItems: 'center', padding: 8, gap: 8 }}>
                <Pressable onPress={() => setZoomedPhoto(item.photo_url)}>
                  <Image
                    source={item.photo_url ? { uri: item.photo_url } : require('@/assets/images/icon.png')}
                    style={{ width: 50, height: 50, borderRadius: 25 }}
                  />
                </Pressable>
                <ThemedText>{item.display_name ?? item.username}</ThemedText>
              </ThemedView>
            </Pressable>
          )}
          ListEmptyComponent={
            <ThemedText>
              {searchQuery
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
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});