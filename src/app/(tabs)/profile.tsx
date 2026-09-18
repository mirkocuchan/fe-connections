import { StyleSheet, TextInput } from 'react-native';


import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { API_BASE_URL } from '@/constants/api';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useEffect, useState } from 'react';
import { Button } from 'react-native';

export default function ProfileScreen() {
  const [profile, setProfile] = useState<any>(null);
  const [bio, setBio] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  
  async function fetchProfile() {
    const token = await SecureStore.getItemAsync("token");
    const response = await fetch(API_BASE_URL + "/me", {
      headers: { Authorization: "Bearer " + token },
    });
    const data = await response.json();
    setProfile(data);
    setBio(data.bio || "");
    setCity(data.city || "");
    setCountry(data.country || "");
  }

  async function handleUpdateProfile() {
    const token = await SecureStore.getItemAsync("token");
    const response = await fetch(API_BASE_URL + "/me", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
      body: JSON.stringify({ bio, city, country }),
    });
    const data = await response.json();
    setProfile(data);
  }
  
  async function handleLogout() {
    await SecureStore.deleteItemAsync("token");
    await SecureStore.deleteItemAsync("refresh_token");
    router.replace("/login");
  }

  useEffect(() => {
    fetchProfile();
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
