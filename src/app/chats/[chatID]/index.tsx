import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { API_BASE_URL } from '@/constants/api';
import { useLocalSearchParams } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useEffect, useState } from 'react';
import { Button, FlatList, StyleSheet, TextInput } from 'react-native';


export default function ChatScreen() {
  const { chatID } = useLocalSearchParams();
  const [messages, setMessages] = useState<any[]>([]);
  const [content, setContent] = useState("");
  const [chatName, setChatName] = useState("Chat");
  const [nicknameInput, setNicknameInput] = useState("")

  async function fetchMessages() {
    const token = await SecureStore.getItemAsync("token");
    const response = await fetch(API_BASE_URL + "/chats/" + chatID + "/messages", {
      headers: { Authorization: "Bearer " + token },
    });
    const data = await response.json();
    setMessages(data);
  }
  async function handleSendMessage() {
    const token = await SecureStore.getItemAsync("token");
    await fetch(API_BASE_URL + "/chats/" + chatID + "/messages", {
        method: "POST",
        headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
        },
        body: JSON.stringify({ content }),
    });
    setContent("");
    fetchMessages();
  }
  async function fetchCard() {
    const token = await SecureStore.getItemAsync("token");
    const response = await fetch(API_BASE_URL + "/chats/" + chatID + "/card", {
      headers: { Authorization: "Bearer " + token },
    });
    const data = await response.json();

    if (data.nickname && data.nickname.Valid) {
      setChatName(data.nickname.String);
    } else {
      setChatName("anon-" + data.subject_id.slice(0, 8));
    }
  }
  async function handleSetNickname() {
    const token = await SecureStore.getItemAsync("token");
    await fetch(API_BASE_URL + "/chats/" + chatID + "/card/nickname", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
      body: JSON.stringify({ nickname: nicknameInput }),
    });
    setNicknameInput("");
    fetchCard();
  }

  useEffect(() => {
    fetchMessages();
    fetchCard();
  }, []);

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">{chatName}</ThemedText>
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
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});