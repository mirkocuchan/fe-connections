import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { apiFetchChecked } from '@/utils/api';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Button, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function NewChatScreen() {
  const { userID, name } = useLocalSearchParams();
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);

  async function handleSend() {
    if (content.trim() === "" || sending) return;
    setSending(true);
    const { ok, data } = await apiFetchChecked("/users/" + userID + "/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    setSending(false);
    if (!ok) {
      Alert.alert("No se pudo enviar", data?.error || "Intentá de nuevo");
      return;
    }
    router.replace({
      pathname: "/chats/[chatID]",
      params: {
        chatID: data.chat_id,
        nickname: name as string,
        otherUserID: userID as string,
        blocked: "0",
      },
    });
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ThemedView style={styles.container}>
        <ThemedText type="title">{name}</ThemedText>
        <ThemedText>Todavía no hay mensajes. ¡Escribí el primero!</ThemedText>
        <TextInput
          value={content}
          onChangeText={setContent}
          placeholder="Escribí un mensaje..."
          style={{ color: '#ffffff', borderWidth: 1, borderColor: '#555555', padding: 8 }}
        />
        <Button title="Enviar" onPress={handleSend} disabled={sending} />
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});