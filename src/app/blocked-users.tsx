import { ScreenHeader } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { apiFetch, apiFetchChecked } from '@/utils/api';
import { useEffect, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet } from 'react-native';
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
      <ScreenHeader title="Usuarios bloqueados" />
      <ThemedView style={styles.container}>
        <FlatList
          data={blockedUsers}
          keyExtractor={(item, index) => item.chat_id ?? item.blocked_id ?? String(index)}
          renderItem={({ item }) => (
            <ThemedView style={styles.row}>
              <ThemedText style={styles.name} numberOfLines={1}>{item.username}</ThemedText>
              <Pressable style={styles.unblock} onPress={() => handleUnblock(item)}>
                <ThemedText style={styles.unblockText}>Desbloquear</ThemedText>
              </Pressable>
            </ThemedView>
          )}
          ListEmptyComponent={
            <ThemedText style={styles.empty}>No bloqueaste a nadie.</ThemedText>
          }
        />
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#333',
  },
  name: { flex: 1, fontSize: 16 },
  unblock: {
    borderWidth: 1,
    borderColor: '#3c87f7',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  unblockText: { color: '#3c87f7', fontSize: 14, fontWeight: '600' },
  empty: { textAlign: 'center', marginTop: 32, opacity: 0.6 },
});