import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { apiFetch, apiFetchChecked } from '@/utils/api';
import { Link, router, useLocalSearchParams } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useEffect, useState } from 'react';
import { Alert, Button, FlatList, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';


export default function ChatScreen() {
  const { chatID, nickname, otherUserID: otherParam, blocked: blockedParam } = useLocalSearchParams();
  const iBlocked = blockedParam === "1";
  const [readOnly, setReadOnly] = useState(iBlocked);
  const [chatName, setChatName] = useState((nickname as string) || "Chat");
  const [otherUserID, setOtherUserID] = useState((otherParam as string) || "");
  const [messages, setMessages] = useState<any[]>([]);
  const [content, setContent] = useState("");
  const [nicknameInput, setNicknameInput] = useState("");
  const [reportDetails, setReportDetails] = useState("");
  const [myUserID, setMyUserID] = useState("");
  const [isInitiator, setIsInitiator] = useState(false);

  async function fetchMessages() {
    const data = await apiFetch("/chats/" + chatID + "/messages");
    if (data) setMessages(data);
  }

  async function handleSendMessage() {
    const { ok, data } = await apiFetchChecked("/chats/" + chatID + "/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    if (!ok) {
      Alert.alert("No se pudo enviar", data?.error || "Intentá de nuevo");
      return;
    }
    setContent("");
    fetchMessages();
  }

  async function fetchCard() {
    const { ok, data } = await apiFetchChecked("/chats/" + chatID + "/card");
    if (!ok) {
      setReadOnly(true);
      return;
    }
    if (!data) return;

    setOtherUserID(data.subject_id);

    const myUserID = await SecureStore.getItemAsync("my_user_id");
    const isInitiator = myUserID === data.user_one_id;
    setIsInitiator(isInitiator);

    if (data.nickname && data.nickname.Valid && data.nickname.String !== "") {
      setChatName(data.nickname.String);
    } else if (isInitiator) {
      const profile = await apiFetch("/users/" + data.subject_id + "/profile");
      if (profile) setChatName(profile.username);
    } else {
      setChatName("anon-" + data.subject_id.slice(0, 8));
    }
  }

  async function handleSetNickname() {
    const { ok, data } = await apiFetchChecked("/chats/" + chatID + "/card/nickname", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nickname: nicknameInput }),
    });
    if (!ok) {
      Alert.alert("No se pudo guardar el apodo", data?.error || "Intentá de nuevo");
      return;
    }
    setNicknameInput("");
    fetchCard();
  }

  async function handleBlockUser() {
    const { ok, data } = await apiFetchChecked("/me/block/" + otherUserID, {
      method: "POST",
    });
    if (!ok) {
      Alert.alert("No se pudo bloquear", data?.error || "Intentá de nuevo");
      return;
    }
    router.replace("/(tabs)");
  }

  async function handleReport(reason: string) {
    const { ok, data } = await apiFetchChecked("/me/report/" + otherUserID, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason, details: reportDetails }),
    });
    if (!ok) {
      Alert.alert("No se pudo reportar", data?.error || "Intentá de nuevo");
      return;
    }
    Alert.alert("Reportado", "Gracias, vamos a revisarlo.");
    setReportDetails("");
  }
  
  async function loadMyID() {
    const id = await SecureStore.getItemAsync("my_user_id");
    setMyUserID(id || "");
  }

  useEffect(() => {
    loadMyID();
    fetchMessages();
    fetchCard();
  }, []);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ThemedView style={styles.container}>
        {readOnly && !isInitiator ? (
          <ThemedText type="title">{chatName}</ThemedText>
        ) : (
          <>
            <Link href={{ pathname: "/users/[userID]", params: { userID: otherUserID } }}>
              <ThemedText type="title">{chatName}</ThemedText>
            </Link>
            <Link href={{ pathname: "/chats/[chatID]/card", params: { chatID: chatID as string } }}>
              <ThemedText>Ver ficha</ThemedText>
            </Link>
            <TextInput
              value={nicknameInput}
              onChangeText={setNicknameInput}
              placeholder="Ponerle un apodo..."
              style={{ color: '#ffffff', borderWidth: 1, borderColor: '#555555', padding: 8 }}
            />
            <Button title="Guardar apodo" onPress={handleSetNickname} />
          </>
        )}
        {readOnly && (
          <ThemedText>
            {iBlocked
              ? "Bloqueaste a este usuario. Podés leer la conversación, pero no enviar mensajes."
              : "No se pueden enviar mensajes en este chat."}
          </ThemedText>
        )}
        <FlatList
          data={messages}
          keyExtractor={(item) => item.message_id}
          renderItem={({ item }) => (
            <ThemedView
              style={{
                alignSelf: item.sender_id === myUserID ? 'flex-end' : 'flex-start',
                backgroundColor: item.sender_id === myUserID ? '#2b5278' : '#333',
                padding: 8,
                borderRadius: 8,
                marginVertical: 4,
                maxWidth: '80%',
              }}
            >
              <ThemedText>{item.content}</ThemedText>
            </ThemedView>
          )}
          ListEmptyComponent={
            <ThemedText>Todavía no hay mensajes. ¡Escribí el primero!</ThemedText>
          }
        />
        {!readOnly && (
          <>
            <TextInput
              value={content}
              onChangeText={setContent}
              placeholder="Escribí un mensaje..."
              style={{ color: '#ffffff', borderWidth: 1, borderColor: '#555555', padding: 8 }}
            />
            <Button title="Enviar" onPress={handleSendMessage} />
            <Button title="Bloquear usuario" onPress={handleBlockUser} />
          </>
        )}

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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});