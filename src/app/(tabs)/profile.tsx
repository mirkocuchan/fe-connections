import { StyleSheet } from 'react-native';


import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { Button } from 'react-native';
import { useEffect } from 'react';
import { API_BASE_URL } from '@/constants/api';

export default function ProfileScreen() {
  useEffect(() => { 
    async function fetchProfile() {
      const token = await SecureStore.getItemAsync("token");
      const response = await fetch(API_BASE_URL + "/me", {
        headers: {
          Authorization: "Bearer " + token,
        },
      });
      const data = await response.json();
      console.log(data);
    }
    fetchProfile();
  }, []);
  async function handleLogout() {
    await SecureStore.deleteItemAsync("token");
    await SecureStore.deleteItemAsync("refresh_token");
    router.replace("/login");
  }
  
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>
        Welcome to Profile
      </ThemedText>

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
