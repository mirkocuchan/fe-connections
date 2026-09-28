import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { apiFetch } from '@/utils/api';
import { router, useFocusEffect } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useCallback, useState } from 'react';
import { Button, FlatList, Image, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfileScreen() {
  const [profile, setProfile] = useState<any>(null);
  const [photos, setPhotos] = useState<any[]>([]);

  useFocusEffect(
    useCallback(() => {
      async function fetchProfile() {
        const data = await apiFetch("/me");
        if (data) setProfile(data);
      }
      fetchProfile();
      fetchPhotos();
    }, [])
  );

  async function handleLogout() {
    await SecureStore.deleteItemAsync("token");
    await SecureStore.deleteItemAsync("refresh_token");
    await SecureStore.deleteItemAsync("my_user_id");
    router.replace("/login");
  }

  async function fetchPhotos() {
    const data = await apiFetch("/me/photos");
    if (data) setPhotos(data);
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ThemedView style={styles.container}>
        {profile && (
          <>
            <FlatList
              data={photos}
              keyExtractor={(item) => item.photo_id}
              horizontal
              style={{ maxHeight: 110 }}
              renderItem={({ item }) => (
                <Image source={{ uri: item.photo_url }}
                  style={{ width: 80, height: 80, borderRadius: 8, marginHorizontal: 4 }} />
              )}
            />
            <ThemedText type="title">{profile.username}</ThemedText>
            <ThemedText>{profile.bio || "Sin bio todavía"}</ThemedText>
            <ThemedText>
              {[profile.city, profile.country].filter(Boolean).join(", ") || "Sin ubicación"}
            </ThemedText>
          </>
        )}
        <Button title="Editar perfil" onPress={() => router.push("/edit-profile")} />
        <Button title="Cerrar sesión" onPress={handleLogout} />
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});