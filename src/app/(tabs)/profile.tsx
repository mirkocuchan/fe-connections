import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { apiFetch } from '@/utils/api';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useEffect, useState } from 'react';
import { Button, FlatList, StyleSheet, TextInput } from 'react-native';

export default function ProfileScreen() {
  const [profile, setProfile] = useState<any>(null);
  const [bio, setBio] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [blockedUsers, setBlockedUsers] = useState<any[]>([]);

  async function fetchProfile() {
    const data = await apiFetch("/me");
    if (data) {
      setProfile(data);
      setBio(data.bio || "");
      setCity(data.city || "");
      setCountry(data.country || "");
    }
  }

  async function handleUpdateProfile() {
    const data = await apiFetch("/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bio, city, country }),
    });
    if (data) setProfile(data);
  }

  async function handleLogout() {
    await SecureStore.deleteItemAsync("token");
    await SecureStore.deleteItemAsync("refresh_token");
    router.replace("/login");
  }
  async function fetchBlockedUsers() {
    const data = await apiFetch("/me/blocked");
    if (data) setBlockedUsers(data);
  }

  async function handleUnblock(userID: string) {
    await apiFetch("/me/unblock/" + userID, {
      method: "DELETE",
    });
    fetchBlockedUsers();
  }

  useEffect(() => {
    fetchProfile();
    fetchBlockedUsers();
  }, []);

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>
        Welcome to Profile
      </ThemedText>
      {profile && <ThemedText>{profile.username}</ThemedText>}
      <TextInput
        value={bio}
        onChangeText={setBio}
        placeholder="Bio"
        style={{ color: '#ffffff', borderWidth: 1, borderColor: '#555555', padding: 8 }}
      />
      <TextInput
        value={city}
        onChangeText={setCity}
        placeholder="Ciudad"
        style={{ color: '#ffffff', borderWidth: 1, borderColor: '#555555', padding: 8 }}
      />
      <TextInput
        value={country}
        onChangeText={setCountry}
        placeholder="País"
        style={{ color: '#ffffff', borderWidth: 1, borderColor: '#555555', padding: 8 }}
      />
      <ThemedText type="subtitle">Usuarios bloqueados</ThemedText>
        <FlatList
          data={blockedUsers}
          keyExtractor={(item) => item.blocked_id}
          renderItem={({ item }) => (
            <ThemedView>
              <ThemedText>{item.blocked_id}</ThemedText>
              <Button title="Desbloquear" onPress={() => handleUnblock(item.blocked_id)} />
            </ThemedView>
          )}
        />
      <Button title="Guardar perfil" onPress={handleUpdateProfile} />

      <Button title="Cerrar sesión" onPress={handleLogout} />
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