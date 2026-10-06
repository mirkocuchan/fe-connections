import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { API_BASE_URL } from '@/constants/api';
import { apiFetch, apiFetchChecked } from '@/utils/api';
import { router, useFocusEffect } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useCallback, useState } from 'react';
import { Alert, Button, Pressable, StyleSheet, Switch, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';


export default function SettingsScreen() {
  const [globalDiscovery, setGlobalDiscovery] = useState(false);

  useFocusEffect(
    useCallback(() => {
      async function loadSettings() {
        const data = await apiFetch("/me");
        if (data) setGlobalDiscovery(data.global_discovery);
      }
      loadSettings();
    }, [])
  );

  async function handleToggleGlobal(value: boolean) {
    setGlobalDiscovery(value); // se actualiza al instante
    const { ok } = await apiFetchChecked("/me/discovery-settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ global_discovery: value }),
    });
    if (!ok) {
      setGlobalDiscovery(!value); // si falló, vuelve atrás
      Alert.alert("Error", "No se pudo guardar el cambio");
    }
  }

  async function handleLogout() {
    const refreshToken = await SecureStore.getItemAsync("refresh_token");
    try {
      await fetch(API_BASE_URL + "/logout", {
        method: "POST",
        headers: { Authorization: "Bearer " + refreshToken },
      });
    } catch (error) {

    }
    await SecureStore.deleteItemAsync("token");
    await SecureStore.deleteItemAsync("refresh_token");
    await SecureStore.deleteItemAsync("my_user_id");
    router.replace("/login");
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ThemedView style={styles.container}>
        <Button title="← Volver" onPress={() => router.back()} />
        <ThemedText type="title">Configuración</ThemedText>

        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <ThemedText>Recomendaciones globales</ThemedText>
            <ThemedText style={{ fontSize: 12, opacity: 0.6 }}>
              Ver gente de cualquier país en Discover
            </ThemedText>
          </View>
          <Switch value={globalDiscovery} onValueChange={handleToggleGlobal} />
        </View>
        <Pressable style={styles.row} onPress={() => router.push("/blocked-users")}>
          <ThemedText style={{ flex: 1 }}>Usuarios bloqueados</ThemedText>
          <ThemedText>›</ThemedText>
        </Pressable>
        <Button title="Cerrar sesión" onPress={handleLogout} />
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
});