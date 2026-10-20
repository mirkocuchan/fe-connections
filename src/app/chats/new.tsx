import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { apiFetchChecked } from '@/utils/api';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Pressable, StyleSheet, TextInput } from 'react-native';
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

  const canSend = content.trim() !== "" && !sending;

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        <ThemedView style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="chevron-back" size={26} color="#ffffff" />
          </Pressable>
          <ThemedText style={styles.headerTitle} numberOfLines={1}>
            {name}
          </ThemedText>
        </ThemedView>

        <ThemedView style={styles.body}>
          <ThemedText style={styles.hint}>
            Todavía no hay mensajes. ¡Escribí el primero!
          </ThemedText>
        </ThemedView>

        <ThemedView style={styles.inputBar}>
          <TextInput
            value={content}
            onChangeText={setContent}
            placeholder="Escribí un mensaje..."
            placeholderTextColor="#888"
            multiline
            autoFocus
            style={styles.input}
          />
          <Pressable
            onPress={handleSend}
            disabled={!canSend}
            style={[styles.sendButton, !canSend && { opacity: 0.4 }]}
          >
            <Ionicons name="send" size={18} color="#ffffff" />
          </Pressable>
        </ThemedView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#333",
  },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: "600" },
  body: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 24 },
  hint: { textAlign: "center", opacity: 0.6 },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    padding: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#333",
  },
  input: {
    flex: 1,
    maxHeight: 120,
    color: "#ffffff",
    borderWidth: 1,
    borderColor: "#555",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: "#3c87f7",
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
});