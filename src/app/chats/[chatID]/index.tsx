import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { apiFetch, apiFetchChecked } from '@/utils/api';
import { setActiveChat } from '@/utils/push';
import { onSocketEvent } from '@/utils/socket';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, KeyboardAvoidingView, Modal, Pressable, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const PAGE_SIZE = 30;

const REPORT_REASONS = [
  { key: "spam", label: "Spam" },
  { key: "acoso", label: "Acoso" },
  { key: "contenido_inapropiado", label: "Contenido inapropiado" },
  { key: "otro", label: "Otro" },
];

//qué hoja inferior está abierta (null = ninguna)
type Sheet = null | "menu" | "nickname" | "report";

function SheetOption({ label, onPress, danger }: { label: string; onPress: () => void; danger?: boolean }) {
  return (
    <Pressable onPress={onPress} style={styles.sheetOption}>
      <ThemedText style={[styles.sheetText, danger && { color: "#ff453a" }]}>{label}</ThemedText>
    </Pressable>
  );
}

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
  const [reportReason, setReportReason] = useState<string | null>(null);
  const [isInitiator, setIsInitiator] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const loadingOlderRef = useRef(false);
  const [sheet, setSheet] = useState<Sheet>(null);

  // la lista invertida necesita el más nuevo primero, nuestro estado está en orden cronológico
  const invertedMessages = useMemo(() => [...messages].reverse(), [messages]);

  // quien es receptor y está en modo lectura no puede usar la ficha ni el perfil
  const canUseCard = !(readOnly && !isInitiator);

  function markRead() {
    apiFetchChecked("/chats/" + chatID + "/read", { method: "POST" });
  }

  async function fetchMessages() {
    const data = await apiFetch("/chats/" + chatID + "/messages?limit=" + PAGE_SIZE);
    if (data) {
      setMessages(data);
      setHasMore(data.length === PAGE_SIZE);
    }
  }

  async function loadOlder() {
    if (loadingOlderRef.current || !hasMore || messages.length === 0) return;
    loadingOlderRef.current = true;
    setLoadingOlder(true);
    try {
      const oldest = messages[0].message_id;
      const data = await apiFetch(
        "/chats/" + chatID + "/messages?limit=" + PAGE_SIZE + "&before=" + oldest
      );
      if (data) {
        setMessages((prev) => {
          const known = new Set(prev.map((m) => m.message_id));
          return [...data.filter((m: any) => !known.has(m.message_id)), ...prev];
        });
        setHasMore(data.length === PAGE_SIZE);
      }
    } finally {
      loadingOlderRef.current = false;
      setLoadingOlder(false);
    }
  }

  async function handleSendMessage() {
    if (!content.trim()) return;
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
    if (data?.message_id) {
      setMessages((prev) =>
        prev.some((m) => m.message_id === data.message_id) ? prev : [...prev, data]
      );
    } else {
      fetchMessages();
    }
  }

  async function fetchCard() {
    const { ok, data } = await apiFetchChecked("/chats/" + chatID + "/card");
    if (!ok) {
      setReadOnly(true);
      return;
    }
    if (!data) return;

    setIsInitiator(data.is_initiator);
    setChatName(data.chat_name);
    setOtherUserID(data.subject_id ?? "");
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
    setSheet(null);
    fetchCard();
  }

  async function handleBlockUser() {
    const { ok, data } = await apiFetchChecked("/chats/" + chatID + "/block", {
      method: "POST",
    });
    if (!ok) {
      Alert.alert("No se pudo bloquear", data?.error || "Intentá de nuevo");
      return;
    }
    router.replace("/(tabs)");
  }

  function confirmBlock() {
    Alert.alert("Bloquear usuario", "No van a poder escribirse. ¿Querés bloquear a esta persona?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Bloquear",
        style: "destructive",
        onPress: () => {
          setSheet(null);
          handleBlockUser();
        },
      },
    ]);
  }

  async function handleReport() {
    if (!reportReason) return;
    if (reportReason === "otro" && !reportDetails.trim()) {
      Alert.alert("Falta el detalle", "Contanos qué pasó para poder revisarlo.");
      return;
    }
    const { ok, data } = await apiFetchChecked("/chats/" + chatID + "/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: reportReason, details: reportDetails }),
    });
    if (!ok) {
      Alert.alert("No se pudo reportar", data?.error || "Intentá de nuevo");
      return;
    }
    setReportDetails("");
    setReportReason(null);
    Alert.alert("Reportado", "Gracias, vamos a revisarlo.", [
      { text: "OK", onPress: () => setSheet(null) },
    ]);
  }

  function openProfile() {
    if (otherUserID && canUseCard) {
      router.push({ pathname: "/users/[userID]", params: { userID: otherUserID } });
    }
  }

  useEffect(() => {
    fetchMessages();
    fetchCard();
  }, []);

  //marcar este chat como abierto sólo mientras la pantalla tiene el foco
  useFocusEffect(
    useCallback(() => {
      setActiveChat(chatID as string);
      markRead();
      return () => setActiveChat(null);
    }, [chatID])
  );

  //mensajes en vivo
  useEffect(() => {
    return onSocketEvent((ev) => {
      if (ev.type === "resync") {
        fetchMessages();
      } else if (ev.type === "new_message" && ev.chat_id === chatID) {
        setMessages((prev) =>
          prev.some((m) => m.message_id === ev.message.message_id) ? prev : [...prev, ev.message]
        );
        markRead();
      }
    });
  }, [chatID]);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        {/* encabezado */}
        <ThemedView style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="chevron-back" size={26} color="#ffffff" />
          </Pressable>
          <Pressable style={{ flex: 1 }} onPress={openProfile} disabled={!otherUserID || !canUseCard}>
            <ThemedText style={styles.headerTitle} numberOfLines={1}>
              {chatName}
            </ThemedText>
          </Pressable>
          <Pressable onPress={() => setSheet("menu")} hitSlop={12}>
            <Ionicons name="ellipsis-vertical" size={22} color="#ffffff" />
          </Pressable>
        </ThemedView>

        {readOnly && (
          <ThemedText style={styles.banner}>
            {iBlocked
              ? "Bloqueaste a este usuario. Podés leer la conversación, pero no enviar mensajes."
              : "No se pueden enviar mensajes en este chat."}
          </ThemedText>
        )}

        {/* mensajes */}
        <FlatList
          inverted
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 8 }}
          data={invertedMessages}
          keyExtractor={(item) => item.message_id}
          onEndReached={loadOlder}
          onEndReachedThreshold={0.5}
          ListFooterComponent={loadingOlder ? <ActivityIndicator style={{ margin: 12 }} /> : undefined}
          renderItem={({ item }) => (
            <ThemedView
              style={{
                alignSelf: item.is_mine ? 'flex-end' : 'flex-start',
                backgroundColor: item.is_mine ? '#2b5278' : '#333',
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 16,
                marginVertical: 4,
                maxWidth: '80%',
              }}
            >
              {item.is_story_reply && (
                <>
                  <ThemedText style={{ fontSize: 12, opacity: 0.6 }}>
                    {item.is_mine ? "Respondiste a una historia" : "Respondió a tu historia"}
                  </ThemedText>
                  {item.story_media_url && item.story_media_type === "image" ? (
                    <Image
                      source={{ uri: item.story_media_url }}
                      style={{ width: 80, height: 120, borderRadius: 6, marginVertical: 4 }}
                    />
                  ) : (
                    <ThemedText style={{ fontSize: 12, opacity: 0.6 }}>
                      {item.story_media_url ? "🎬 Historia en video" : "Historia expirada"}
                    </ThemedText>
                  )}
                </>
              )}
              <ThemedText>{item.content}</ThemedText>
            </ThemedView>
          )}
          ListEmptyComponent={
            <ThemedView style={{ transform: [{ scaleY: -1 }] }}>
              <ThemedText>Todavía no hay mensajes. ¡Escribí el primero!</ThemedText>
            </ThemedView>
          }
        />

        {/* barra de escritura */}
        {!readOnly && (
          <ThemedView style={styles.inputBar}>
            <TextInput
              value={content}
              onChangeText={setContent}
              placeholder="Escribí un mensaje..."
              placeholderTextColor="#888"
              multiline
              style={styles.messageInput}
            />
            <Pressable
              onPress={handleSendMessage}
              disabled={!content.trim()}
              style={[styles.sendButton, !content.trim() && { opacity: 0.4 }]}
            >
              <Ionicons name="send" size={18} color="#ffffff" />
            </Pressable>
          </ThemedView>
        )}
      </KeyboardAvoidingView>

      {/* hoja inferior: menú, apodo y reporte */}
      <Modal
        visible={sheet !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSheet(null)}
      >
        <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
          <Pressable style={styles.backdrop} onPress={() => setSheet(null)}>
            <Pressable style={styles.sheet} onPress={() => {}}>
              {sheet === "menu" && (
                <>
                  {canUseCard && (
                    <SheetOption
                      label="Ver ficha"
                      onPress={() => {
                        setSheet(null);
                        router.push({
                          pathname: "/chats/[chatID]/card",
                          params: { chatID: chatID as string },
                        });
                      }}
                    />
                  )}
                  {canUseCard && (
                    <SheetOption label="Ponerle un apodo" onPress={() => setSheet("nickname")} />
                  )}
                  {!readOnly && (
                    <SheetOption label="Bloquear usuario" danger onPress={confirmBlock} />
                  )}
                  <SheetOption label="Reportar" onPress={() => setSheet("report")} />
                  <SheetOption label="Cancelar" onPress={() => setSheet(null)} />
                </>
              )}

              {sheet === "nickname" && (
                <>
                  <ThemedText style={styles.sheetTitle}>Apodo</ThemedText>
                  <TextInput
                    value={nicknameInput}
                    onChangeText={setNicknameInput}
                    placeholder="Ponerle un apodo..."
                    placeholderTextColor="#888"
                    style={styles.sheetInput}
                    autoFocus
                  />
                  <Pressable style={styles.primaryButton} onPress={handleSetNickname}>
                    <ThemedText style={styles.primaryButtonText}>Guardar</ThemedText>
                  </Pressable>
                </>
              )}

              {sheet === "report" && (
                <>
                  <ThemedText style={styles.sheetTitle}>Reportar</ThemedText>
                  {REPORT_REASONS.map((r) => (
                    <Pressable
                      key={r.key}
                      style={styles.sheetOption}
                      onPress={() => setReportReason(r.key)}
                    >
                      <ThemedText style={styles.sheetText}>
                        {reportReason === r.key ? "◉  " : "○  "}
                        {r.label}
                      </ThemedText>
                    </Pressable>
                  ))}
                  <TextInput
                    value={reportDetails}
                    onChangeText={setReportDetails}
                    placeholder={reportReason === "otro" ? "Detalles (obligatorio)" : "Detalles (opcional)"}
                    placeholderTextColor="#888"
                    multiline
                    style={styles.sheetInput}
                  />
                  <Pressable
                    style={[styles.primaryButton, !reportReason && { opacity: 0.4 }]}
                    disabled={!reportReason}
                    onPress={handleReport}
                  >
                    <ThemedText style={styles.primaryButtonText}>Enviar reporte</ThemedText>
                  </Pressable>
                </>
              )}
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
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
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  banner: {
    fontSize: 13,
    opacity: 0.7,
    textAlign: "center",
    padding: 8,
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    padding: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#333",
  },
  messageInput: {
    flex: 1,
    maxHeight: 120,
    color: "#ffffff",
    borderWidth: 1,
    borderColor: "#555",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 10,
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
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#1c1c1e",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 32,
    gap: 4,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  sheetOption: {
    paddingVertical: 14,
  },
  sheetText: {
    fontSize: 16,
  },
  sheetInput: {
    color: "#ffffff",
    borderWidth: 1,
    borderColor: "#555",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    marginTop: 8,
  },
  primaryButton: {
    backgroundColor: "#3c87f7",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 12,
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
});