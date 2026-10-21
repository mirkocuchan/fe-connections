import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { API_BASE_URL } from '@/constants/api';
import { apiFetch, apiFetchChecked } from '@/utils/api';
import { unregisterPush } from '@/utils/push';
import { disconnectSocket } from '@/utils/socket';
import { setUnreadTotal } from '@/utils/unread';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type PushMode = "off" | "name" | "full";

const PUSH_OPTIONS: { value: PushMode; label: string }[] = [
  { value: "off", label: "No recibir notificaciones" },
  { value: "name", label: "Avisar sin mostrar el mensaje" },
  { value: "full", label: "Mostrar el texto del mensaje" },
];

function Row({
  label,
  onPress,
  danger,
  chevron = true,
}: {
  label: string;
  onPress: () => void;
  danger?: boolean;
  chevron?: boolean;
}) {
  return (
    <Pressable style={styles.row} onPress={onPress}>
      <ThemedText style={[styles.rowText, danger && { color: '#ff4d4d' }]}>{label}</ThemedText>
      {chevron && <Ionicons name="chevron-forward" size={18} color="#888" />}
    </Pressable>
  );
}

export default function SettingsScreen() {
  const [globalDiscovery, setGlobalDiscovery] = useState(false);
  const [pushMode, setPushMode] = useState<PushMode>("name");

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
    setUnreadTotal(0);   //borra la pizarra de la cuenta anterior con los chats sin leer
    await SecureStore.deleteItemAsync("token");
    await SecureStore.deleteItemAsync("refresh_token");
    await SecureStore.deleteItemAsync("my_user_id");
    router.replace("/login");
  }

  async function changePushMode(mode: PushMode) {
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
      <ThemedView style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={26} color="#ffffff" />
        </Pressable>
        <ThemedText style={styles.headerTitle}>Configuración</ThemedText>
      </ThemedView>

      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText style={styles.section}>Descubrir</ThemedText>
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <ThemedText style={styles.rowText}>Recomendaciones globales</ThemedText>
            <ThemedText style={styles.sub}>Ver gente de cualquier país en Descubrir</ThemedText>
          </View>
          <Switch value={globalDiscovery} onValueChange={handleToggleGlobal} />
        </View>

        <ThemedText style={styles.section}>Notificaciones</ThemedText>
        {PUSH_OPTIONS.map((opt) => (
          <Pressable key={opt.value} style={styles.row} onPress={() => changePushMode(opt.value)}>
            <ThemedText style={styles.rowText}>{opt.label}</ThemedText>
            <Ionicons
              name={pushMode === opt.value ? "radio-button-on" : "radio-button-off"}
              size={22}
              color={pushMode === opt.value ? "#3c87f7" : "#888"}
            />
          </Pressable>
        ))}
        <ThemedText style={styles.section}>Legal</ThemedText>
        <Row label="Términos y condiciones" onPress={() => router.push("/terms")} />
        <Row label="Reglas de la comunidad" onPress={() => router.push("/community-rules")} />
        <Row label="Política de privacidad" onPress={() => router.push("/privacy")} />
        <ThemedText style={styles.section}>Cuenta</ThemedText>
        <Row label="Usuarios bloqueados" onPress={() => router.push("/blocked-users")} />
        <Row label="Cambiar contraseña" onPress={() => router.push("/change-password")} />
        <Row label="Cerrar sesión" chevron={false} onPress={handleLogout} />
        <Row label="Eliminar cuenta" danger onPress={() => router.push("/delete-account")} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#333',
  },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  content: { paddingHorizontal: 16, paddingBottom: 32 },
  section: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    opacity: 0.6,
    marginTop: 24,
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#333',
  },
  rowText: { flex: 1, fontSize: 16 },
  sub: { fontSize: 12, opacity: 0.6, marginTop: 2 },
});