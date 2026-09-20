import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { apiFetch } from '@/utils/api';
import { Link, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Button, FlatList, StyleSheet, TextInput } from 'react-native';

export default function ChatScreen() {
  const { chatID } = useLocalSearchParams();
  const [messages, setMessages] = useState<any[]>([]);
  const [content, setContent] = useState("");
  const [chatName, setChatName] = useState("Chat");
  const [nicknameInput, setNicknameInput] = useState("");
  const [otherUserID, setOtherUserID] = useState("");

  async function fetchMessages() {
    const data = await apiFetch("/chats/" + chatID + "/messages");
    if (data) setMessages(data);
  }

  async function handleSendMessage() {
    await apiFetch("/chats/" + chatID + "/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    setContent("");
    fetchMessages();
  }

  async function fetchCard() {
    const data = await apiFetch("/chats/" + chatID + "/card");
    if (!data) return;

    setOtherUserID(data.subject_id);

    if (data.nickname && data.nickname.Valid) {
      setChatName(data.nickname.String);
    } else {
      setChatName("anon-" + data.subject_id.slice(0, 8));
    }
  }

  async function handleSetNickname() {
    await apiFetch("/chats/" + chatID + "/card/nickname", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nickname: nicknameInput }),
    });
    setNicknameInput("");
    fetchCard();
  }

  async function handleBlockUser() {
    await apiFetch("/me/block/" + otherUserID, {
      method: "POST",
    });
    router.replace("/(tabs)");
  }

  const [reportDetails, setReportDetails] = useState("");

  async function handleReport(reason: string) {
    await apiFetch("/me/report/" + otherUserID, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason, details: reportDetails }),
    });
    setReportDetails("");
  }

  useEffect(() => {
    fetchMessages();
    fetchCard();
  }, []);

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">{chatName}</ThemedText>
      <Link
        href={{
          pathname: "/chats/[chatID]/card",
          params: { chatID: chatID as string },
        }}
      >
        <ThemedText>Ver ficha</ThemedText>
      </Link>
      <TextInput
        value={nicknameInput}
        onChangeText={setNicknameInput}
        placeholder="Ponerle un apodo..."
        style={{ color: '#ffffff', borderWidth: 1, borderColor: '#555555', padding: 8 }}
      />
      <Button title="Guardar apodo" onPress={handleSetNickname} />
      <FlatList
        data={messages}
        keyExtractor={(item) => item.message_id}
        renderItem={({ item }) => (
          <ThemedText>{item.content}</ThemedText>
        )}
        ListEmptyComponent={
          <ThemedText>Todavía no hay mensajes. ¡Escribí el primero!</ThemedText>
        }
      />
      <TextInput
        value={content}
        onChangeText={setContent}
        placeholder="Escribí un mensaje..."
        style={{ color: '#ffffff', borderWidth: 1, borderColor: '#555555', padding: 8 }}
      />
      <Button title="Enviar" onPress={handleSendMessage} />
      <Button title="Bloquear usuario" onPress={handleBlockUser} />

      <ThemedText type="subtitle">Reportar</ThemedText>
      <TextInput
        value={reportDetails}
        onChangeText={setReportDetails}
        placeholder="Detalles (obligatorio si elegís 'otro')"
        style={{ color: '#ffffff', borderWidth: 1, borderColor: '#555555', padding: 8 }}
      />
      <Button title="Reportar: Spam" onPress={() => handleReport("spam")} />
      <Button title="Reportar: Acoso" onPress={() => handleReport("acoso")} />
      <Button title="Reportar: Contenido inapropiado" onPress={() => handleReport("contenido_inapropiado")} />
      <Button title="Reportar: Otro" onPress={() => handleReport("otro")} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});