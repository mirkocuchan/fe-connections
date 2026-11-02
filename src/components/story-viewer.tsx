import { ThemedText } from '@/components/themed-text';
import { Palette } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Animated, Easing, FlatList, Keyboard, KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, TextInput, View, } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const DURATION = 5000; //lo que dura cada historia

function timeAgo(dateString: string) {
  const diffMs = Date.now() - new Date(dateString).getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHours < 1) return "hace unos minutos";
  if (diffHours === 1) return "hace 1 hora";
  return `hace ${diffHours} horas`;
}

type Props = {
  group: any[];
  myUserID: string;
  onClose: () => void;
  onView: (story: any) => void;
  onDelete: (story: any) => void;
  onLoadViewers: (story: any) => Promise<any[]>;
  onReply: (story: any, content: string) => Promise<boolean>;
};

export function StoryViewer({ group, myUserID, onClose, onView, onDelete, onLoadViewers, onReply }: Props) {
  const insets = useSafeAreaInsets();
  const [index, setIndex] = useState(0);
  const [progress] = useState(() => new Animated.Value(0)); //0 a 1: cuánto de la historia pasó
  const [held, setHeld] = useState(false); //dedo apretado = pausa
  const [imageLoading, setImageLoading] = useState(true);
  const [replyText, setReplyText] = useState("");
  const [replyFocused, setReplyFocused] = useState(false);
  const [sending, setSending] = useState(false);
  const [replySent, setReplySent] = useState(false);
  const [viewers, setViewers] = useState<any[] | null>(null); //null = lista cerrada

  const story = group[index];
  const isMine = story.user_id === myUserID;
  const replying = replyFocused || replyText.length > 0;
  const paused = held || replying || viewers !== null;
  const topPad = Platform.OS === "ios" ? insets.top + 8 : 8;
  const bottomPad = Platform.OS === "ios" ? insets.bottom + 12 : 12;

  function goTo(i: number) {
    setImageLoading(true);
    setReplyText("");
    setIndex(i);
  }
  function goNext() {
    if (index + 1 < group.length) goTo(index + 1);
    else onClose();
  }
  function goPrev() {
    if (index > 0) goTo(index - 1);
  }

  //al cambiar de historia: barra en cero y marcarla como vista
  useEffect(() => {
    progress.setValue(0);
    onView(group[index]);
    if (group[index + 1]) Image.prefetch(group[index + 1].media_url);
    if (group[index - 1]) Image.prefetch(group[index - 1].media_url);
  }, [index]);

  //el reloj: corre solo si no hay pausa ni imagen cargando. al reanudar sigue desde donde quedó
  useEffect(() => {
    if (paused || imageLoading) return;
    let active = true;
    progress.stopAnimation((value) => {
      if (!active) return;
      Animated.timing(progress, {
        toValue: 1,
        duration: DURATION * (1 - value),
        easing: Easing.linear,
        useNativeDriver: false,
      }).start(({ finished }) => {
        if (finished && active) goNext();
      });
    });
    return () => {
      active = false;
      progress.stopAnimation();
    };
  }, [index, paused, imageLoading]);

  async function sendReply() {
    const content = replyText.trim();
    if (!content || sending) return;
    setSending(true);
    const ok = await onReply(story, content);
    setSending(false);
    if (!ok) return;
    setReplyText("");
    Keyboard.dismiss();
    setReplySent(true);
    setTimeout(() => setReplySent(false), 2000);
  }

  async function openViewers() {
    setViewers(await onLoadViewers(story));
  }

  function confirmDelete() {
    Alert.alert("Borrar historia", "¿Realmente querés borrar esta historia?", [
      { text: "Sí, borrar", style: "destructive", onPress: () => onDelete(story) },
      { text: "No", style: "cancel" },
    ]);
  }

  const touchProps = {
    onPressIn: () => setHeld(true),
    onPressOut: () => setHeld(false),
    onLongPress: () => {}, //con el dedo largo no se cambia de historia: solo pausa
    delayLongPress: 250,
  };

  return (
    <Modal visible animationType="fade" onRequestClose={onClose}>
      <View style={styles.root}>
        <Image
          source={story.media_url}
          recyclingKey={story.story_id}
          style={StyleSheet.absoluteFill}
          contentFit="contain"
          cachePolicy="memory-disk"
          transition={150}
          onLoad={() => setImageLoading(false)}
          onError={() => setImageLoading(false)}
        />
        {imageLoading && <ActivityIndicator size="large" color="#fff" style={StyleSheet.absoluteFill} />}

        {/* zonas de toque: izquierda = anterior, derecha = siguiente */}
        <View style={[StyleSheet.absoluteFill, { flexDirection: "row" }]}>
          <Pressable style={{ flex: 1 }} onPress={goPrev} {...touchProps} />
          <Pressable style={{ flex: 2 }} onPress={goNext} {...touchProps} />
        </View>

        {/* arriba: barras, usuario, cerrar */}
        <View style={[styles.header, { paddingTop: topPad }]} pointerEvents="box-none">
          <View style={styles.bars}>
            {group.map((_, i) => (
              <View key={i} style={styles.barTrack}>
                {i < index ? (
                  <View style={styles.barFill} />
                ) : i === index ? (
                  <Animated.View
                    style={[
                      styles.barFill,
                      { width: progress.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }) },
                    ]}
                  />
                ) : null}
              </View>
            ))}
          </View>
          <View style={styles.userRow} pointerEvents="box-none">
            <View style={styles.avatar}>
              <ThemedText style={styles.avatarLetter}>
                {story.username?.[0]?.toUpperCase() ?? "?"}
              </ThemedText>
            </View>
            <View style={{ flex: 1 }}>
              <ThemedText style={styles.username}>{isMine ? "Tu historia" : story.username}</ThemedText>
              <ThemedText style={styles.time}>{timeAgo(story.created_at)}</ThemedText>
            </View>
            {isMine && (
              <Pressable onPress={confirmDelete} hitSlop={12}>
                <Ionicons name="trash-outline" size={22} color="#fff" />
              </Pressable>
            )}
            <Pressable onPress={onClose} hitSlop={12}>
              <Ionicons name="close" size={28} color="#fff" />
            </Pressable>
          </View>
        </View>

        {/* abajo: responder (historia ajena) o ver quién la vio (propia) */}
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.footer}
          pointerEvents="box-none"
        >
          {isMine ? (
            <Pressable style={[styles.viewersPill, { marginBottom: bottomPad }]} onPress={openViewers}>
              <Ionicons name="eye-outline" size={18} color="#fff" />
              <ThemedText style={styles.pillText}>Vistas</ThemedText>
            </Pressable>
          ) : (
            <View style={[styles.replyRow, { paddingBottom: bottomPad }]}>
              <TextInput
                value={replyText}
                onChangeText={setReplyText}
                onFocus={() => setReplyFocused(true)}
                onBlur={() => setReplyFocused(false)}
                placeholder="Responder..."
                placeholderTextColor="rgba(255,255,255,0.7)"
                returnKeyType="send"
                onSubmitEditing={sendReply}
                style={styles.replyInput}
              />
              {replySent ? (
                <Ionicons name="checkmark-circle" size={32} color={Palette.success} />
              ) : (
                <Pressable
                  style={[styles.sendBtn, (!replyText.trim() || sending) && { opacity: 0.4 }]}
                  onPress={sendReply}
                  disabled={sending || !replyText.trim()}
                >
                  <Ionicons name="send" size={18} color={Palette.onPrimary} />
                </Pressable>
              )}
            </View>
          )}
        </KeyboardAvoidingView>

        {/* quién la vio */}
        {viewers !== null && (
          <Pressable style={styles.backdrop} onPress={() => setViewers(null)}>
            <Pressable style={styles.sheet} onPress={() => {}}>
              <ThemedText type="subtitle">Vistas ({viewers.length})</ThemedText>
              <FlatList
                data={viewers}
                keyExtractor={(item, i) => item.viewer_id ?? "anon-" + i}
                renderItem={({ item }) => (
                  <ThemedText style={{ paddingVertical: 6 }}>
                    {item.username} ·{" "}
                    {new Date(item.viewed_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </ThemedText>
                )}
                ListEmptyComponent={<ThemedText>Todavía nadie la vio.</ThemedText>}
              />
            </Pressable>
          </Pressable>
        )}
      </View>
    </Modal>
  );
}

const shadow = { textShadowColor: "rgba(0,0,0,0.6)", textShadowRadius: 4, textShadowOffset: { width: 0, height: 1 } };

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#000" },
  header: { position: "absolute", top: 0, left: 0, right: 0, paddingHorizontal: 12, gap: 10 },
  bars: { flexDirection: "row", gap: 4 },
  barTrack: { flex: 1, height: 3, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.3)", overflow: "hidden" },
  barFill: { height: "100%", backgroundColor: "#fff" },
  userRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  avatar: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: Palette.surfaceAlt,
    alignItems: "center", justifyContent: "center",
  },
  avatarLetter: { color: Palette.text, fontWeight: "600" },
  username: { color: "#fff", fontWeight: "600", fontSize: 15, ...shadow },
  time: { color: "rgba(255,255,255,0.8)", fontSize: 12, ...shadow },
  footer: { position: "absolute", left: 0, right: 0, bottom: 0 },
  replyRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, paddingTop: 8 },
  replyInput: {
    flex: 1, color: "#fff", borderWidth: 1, borderColor: "rgba(255,255,255,0.5)",
    backgroundColor: "rgba(0,0,0,0.35)", borderRadius: 22, paddingHorizontal: 16, paddingVertical: 10,
  },
  sendBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: Palette.primary,
    alignItems: "center", justifyContent: "center",
  },
  viewersPill: {
    alignSelf: "center", flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "rgba(0,0,0,0.5)", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20,
  },
  pillText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  sheet: {
    maxHeight: "50%", backgroundColor: Palette.surface, padding: 16,
    borderTopLeftRadius: 16, borderTopRightRadius: 16,
  },
});