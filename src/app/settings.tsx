import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { API_BASE_URL } from '@/constants/api';
import { apiFetch, apiFetchChecked } from '@/utils/api';
import { unregisterPush } from '@/utils/push';
import { disconnectSocket } from '@/utils/socket';
import { router, useFocusEffect } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useCallback, useState } from 'react';
import { Alert, Button, Pressable, StyleSheet, Switch, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';


export default function SettingsScreen() {
  const [globalDiscovery, setGlobalDiscovery] = useState(false);
  const [pushMode, setPushMode] = useState<"off" | "name" | "full">("name");

  useFocusEffect(
    useCallback(() => {
    async function loadSettings() {
      const [me, push] = await Promise.all([
        apiFetch("/me"),
        apiFetch("/me/push-mode"),
      ]);
      if (me) setGlobalDiscovery(me.global_discovery);
      if (push?.mode) setPushMode(push.mode);
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
    await unregisterPush(); //antes de borrar el JWT el endpoint necesita estar autenticado
    const refreshToken = await SecureStore.getItemAsync("refresh_token");
    try {
      await fetch(API_BASE_URL + "/logout", {
        method: "POST",
        headers: { Authorization: "Bearer " + refreshToken },
      });
    } catch (error) {

    }
    disconnectSocket();   //cortar la línea antes de borrar la sesión
    await SecureStore.deleteItemAsync("token");
    await SecureStore.deleteItemAsync("refresh_token");
    await SecureStore.deleteItemAsync("my_user_id");
    router.replace("/login");
  }
  
  async function changePushMode(mode: "off" | "name" | "full") {
    const { ok, data } = await apiFetchChecked("/me/push-mode", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode }),
    });
    if (!ok) {
      Alert.alert("No se pudo guardar", data?.error || "Intentá de nuevo");
      return;
    }
    setPushMode(mode);
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
        <ThemedText type="subtitle">Notificaciones</ThemedText>
          {[
            { value: "off", label: "No recibir notificaciones" },
            { value: "name", label: "Avisar sin mostrar el mensaje" },
            { value: "full", label: "Mostrar el texto del mensaje" },
          ].map((opt) => (
            <Button
              key={opt.value}
              title={(pushMode === opt.value ? "✓ " : "") + opt.label}
              onPress={() => changePushMode(opt.value as "off" | "name" | "full")}
            />
          ))}
        <Pressable style={styles.row} onPress={() => router.push("/blocked-users")}>
          <ThemedText style={{ flex: 1 }}>Usuarios bloqueados</ThemedText>
          <ThemedText>›</ThemedText>
        </Pressable>
        <Pressable style={styles.row} onPress={() => router.push("/change-password")}>
          <ThemedText style={{ flex: 1 }}>Cambiar contraseña</ThemedText>
          <ThemedText>›</ThemedText>
        </Pressable>
        <Button title="Cerrar sesión" onPress={handleLogout} />
          <Pressable style={styles.row} onPress={() => router.push("/delete-account")}>
            <ThemedText style={{ flex: 1, color: '#ff4d4d' }}>Eliminar cuenta</ThemedText>
            <ThemedText>›</ThemedText>
          </Pressable>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
});