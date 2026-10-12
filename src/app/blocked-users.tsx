import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { apiFetch, apiFetchChecked } from '@/utils/api';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Button, FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function BlockedUsersScreen() {
  const [blockedUsers, setBlockedUsers] = useState<any[]>([]);

  async function fetchBlockedUsers() {
    const data = await apiFetch("/me/blocked");
    if (data) setBlockedUsers(data);
  }

  async function handleUnblock(item: any) {
    const path = item.chat_id
      ? "/chats/" + item.chat_id + "/block"
      : "/me/unblock/" + item.blocked_id;
    const { ok, data } = await apiFetchChecked(path, { method: "DELETE" });
    if (!ok) {
      Alert.alert("No se pudo desbloquear", data?.error || "Intentá de nuevo");
      return;
    }
    fetchBlockedUsers();
  }

  useEffect(() => {
    fetchBlockedUsers();
  }, []);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ThemedView style={styles.container}>
        <Button title="← Volver" onPress={() => router.back()} />
        <ThemedText type="title">Usuarios bloqueados</ThemedText>
        <FlatList
          data={blockedUsers}
          keyExtractor={(item, index) => item.chat_id ?? item.blocked_id ?? String(index)}
          renderItem={({ item }) => (
            <ThemedView style={styles.row}>
              <ThemedText style={{ flex: 1 }}>{item.username}</ThemedText>
              <Button title="Desbloquear" onPress={() => handleUnblock(item)} />
            </ThemedView>
          )}
          ListEmptyComponent={<ThemedText>No bloqueaste a nadie.</ThemedText>}
        />
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 4 },
});