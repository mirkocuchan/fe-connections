import { FadeInValue, PopIn } from '@/components/reveal-effects';
import { RevealPhoto } from '@/components/reveal-photo';
import { ScreenHeader } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { formStyles } from '@/constants/form-styles';
import { Palette } from '@/constants/theme';
import { apiFetch, apiFetchChecked } from '@/utils/api';
import { haptic } from '@/utils/haptics';
import { onSocketEvent } from '@/utils/socket';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const NOT_REVEALED = "not revealed yet...";

//key = lo que espera el endpoint de revelar -> valueKey = campo de la ficha
const FIELDS = [
  { key: "name", label: "Nombre", valueKey: "display_name_value", profileKey: "display_name" },
  { key: "date_of_birth", label: "Fecha de nacimiento", valueKey: "date_of_birth_value", profileKey: "date_of_birth" },
  { key: "city", label: "Ciudad", valueKey: "city_value", profileKey: "city" },
  { key: "country", label: "País", valueKey: "country_value", profileKey: "country" },
  { key: "bio", label: "Bio", valueKey: "bio_value", profileKey: "bio" },
  { key: "hobbies", label: "Hobbies", valueKey: "hobbies_value", profileKey: "hobbies" },
  { key: "languages", label: "Idiomas", valueKey: "languages_value", profileKey: "languages" },
];

type Field = (typeof FIELDS)[number];

function isRevealed(value: any) {
  return value != null && String(value) !== "" && value !== NOT_REVEALED;
}

export default function CardScreen() {
  const { chatID } = useLocalSearchParams();
  const [card, setCard] = useState<any>(null);
  const [notesInput, setNotesInput] = useState("");
  const [notesSaved, setNotesSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [justRevealed, setJustRevealed] = useState<string[]>([]); //lo que acabo de mostrar yo
  const [fresh, setFresh] = useState<string[]>([]); //lo que acaba de mostrarme la otra persona
  const prevRevealed = useRef<Record<string, boolean> | null>(null);
  const [myPhotoCount, setMyPhotoCount] = useState(0);
  const isInitiator = !!card?.is_initiator;

  async function fetchCard() {
    const data = await apiFetch("/chats/" + chatID + "/card");
    if (!data) return false;

    const now: Record<string, boolean> = {};
    FIELDS.forEach((f) => (now[f.key] = isRevealed(data[f.valueKey])));
    now.photos = (data.photos_value?.length ?? 0) > 0;
    const before = prevRevealed.current;
    if (before) {
      const newly = FIELDS.filter((f) => now[f.key] && !before[f.key]).map((f) => f.key);
      if (now.photos && !before.photos) newly.push("photos");
      if (newly.length > 0) {
        setFresh(newly);
        haptic.success();
      }
    }
    prevRevealed.current = now;

    setCard(data);
    setNotesInput(data.notes_on_subject?.Valid ? data.notes_on_subject.String : "");
    return true;
  }

  const [me, setMe] = useState<any>(null);

  async function fetchMe() {
    const data = await apiFetch("/me");
    if (!data) return false;
    setMe(data);
    const mine = await apiFetch("/me/photos");
    setMyPhotoCount(Array.isArray(mine) ? mine.length : 0);
    return true;
  }

  //tengo cargado este dato en mi perfil?
  function hasValue(f: Field) {
    return me != null && String(me[f.profileKey] ?? "").trim() !== "";
  }
  //ya se lo revelé a esta persona?
  function revealedByMe(f: Field) {
    return !!card?.my_reveals?.[f.key];
  }

  function confirmRevealAll() {
    Alert.alert(
      "Revelar todo",
      "Esta persona va a ver todos tus datos y no vas a poder volver a ocultarlos. ¿Seguro?",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Revelar", onPress: handleRevealAll },
      ]
    );
  }

  async function handleReveal(field: string) {
    const { ok, data } = await apiFetchChecked("/chats/" + chatID + "/card/reveal/" + field, {
      method: "POST",
    });
    if (!ok) {
      haptic.error();
      Alert.alert("No se pudo revelar", data?.error || "Intentá de nuevo");
      return;
    }
    haptic.success();
    setJustRevealed((prev) => [...prev, field]);
    fetchCard();
  }

  async function handleSaveNotes() {
    const { ok, data } = await apiFetchChecked("/chats/" + chatID + "/card/notes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes_on_subject: notesInput }),
    });
    if (!ok) {
      Alert.alert("No se pudieron guardar las notas", data?.error || "Intentá de nuevo");
      return;
    }
    haptic.success();
    fetchCard();
    setNotesSaved(true);
    setTimeout(() => setNotesSaved(false), 2000); //el aviso desaparece solo a los 2 segundos
  }

  async function handleRevealAll() {
    const pending = FIELDS.filter((f) => (isInitiator || f.key !== "bio") && hasValue(f) && !revealedByMe(f)).map((f) => f.key);
    if (isInitiator && myPhotoCount > 0 && !card?.my_reveals?.photos) pending.push("photos");
    const { ok, data } = await apiFetchChecked("/chats/" + chatID + "/card/reveal-all", {
      method: "POST",
    });
    if (!ok) {
      haptic.error();
      Alert.alert("No se pudo revelar todo", data?.error || "Intentá de nuevo");
      return;
    }
    haptic.success();
    setJustRevealed((prev) => [...prev, ...pending]);
    fetchCard();
  }

  async function handleResetCard() {
    const { ok, data } = await apiFetchChecked("/chats/" + chatID + "/card/reset", {
      method: "PATCH",
    });
    if (!ok) {
      Alert.alert("No se pudo resetear", data?.error || "Intentá de nuevo");
      return;
    }
    fetchCard();
  }

  function confirmReset() {
    Alert.alert(
      "Resetear ficha",
      "Se borrarán el apodo, las notas y lo que esta persona te reveló. ¿Seguro?",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Resetear", style: "destructive", onPress: handleResetCard },
      ]
    );
  }

  async function load() {
    setFailed(false);
    try {
      const [cardOk, meOk] = await Promise.all([fetchCard(), fetchMe()]);
      if (!cardOk || !meOk) setFailed(true);
    } catch {
      setFailed(true); //sin conexión: fetch lanza un error en vez de devolver null
    } finally {
      setLoading(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      load();
    }, [chatID])
  );
    //si la otra persona revela algo mientras miro la ficha, recargarla
  useEffect(() => {
    const unsubscribe = onSocketEvent((ev) => {
      if (ev.type === "resync" || (ev.type === "card_updated" && ev.chat_id === chatID)) {
        fetchCard();
      }
    });
    return unsubscribe;
  }, [chatID]);

  const nickname = card?.nickname?.Valid ? card.nickname.String : "Sin apodo";
  const revealable = FIELDS.filter((f) => isInitiator || f.key !== "bio");
  const photosDone = !isInitiator || myPhotoCount === 0 || !!card?.my_reveals?.photos;
  const allDone = revealable.every((f) => !hasValue(f) || revealedByMe(f)) && photosDone;
  
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScreenHeader title={card ? nickname : "Ficha"} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        > 
          {loading && <ActivityIndicator style={{ marginTop: 40 }} />}

          {!loading && failed && (
            <View style={styles.center}>
              <ThemedText>No se pudo cargar la ficha.</ThemedText>
              <Pressable style={[styles.secondary, { paddingHorizontal: 24 }]} onPress={load}>
                <ThemedText style={styles.secondaryText}>Reintentar</ThemedText>
              </Pressable>
            </View>
          )}

          {card && me && (
            <>
              <ThemedText style={styles.section}>Lo que sabés de esta persona</ThemedText>
                <ThemedView style={styles.photosBlock}>
                  <ThemedText style={styles.label}>Fotos</ThemedText>
                  {(card.photos_value?.length ?? 0) > 0 ? (
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={{ gap: 8, paddingVertical: 10 }}
                    >
                      {card.photos_value.map((uri: string) => (
                        <RevealPhoto key={uri} uri={uri} size={110} animate={fresh.includes("photos")} />
                      ))}
                    </ScrollView>
                  ) : (
                    <ThemedView style={[styles.hidden, { marginTop: 6 }]}>
                      <Ionicons name="lock-closed-outline" size={14} color={Palette.muted} />
                      <ThemedText style={styles.hiddenText}>Sin revelar</ThemedText>
                    </ThemedView>
                  )}
                </ThemedView>
              {FIELDS.map((f) => {
                const value = card[f.valueKey];
                const revealed = isRevealed(value);
                return (
                  <ThemedView key={f.key} style={styles.row}>
                    <ThemedText style={styles.label}>{f.label}</ThemedText>
                    {revealed ? (
                      <FadeInValue animate={fresh.includes(f.key)}>
                        <ThemedText style={styles.value}>{String(value)}</ThemedText>
                      </FadeInValue>
                    ) : (
                      <ThemedView style={styles.hidden}>
                        <Ionicons name="lock-closed-outline" size={14} color={Palette.muted} />
                        <ThemedText style={styles.hiddenText}>Sin revelar</ThemedText>
                      </ThemedView>
                    )}
                  </ThemedView>
                );
              })}

              <ThemedText style={styles.section}>Tus notas</ThemedText>
              <TextInput
                value={notesInput}
                onChangeText={setNotesInput}
                placeholder="Notas sobre esta persona..."
                placeholderTextColor={Palette.muted}
                multiline
                scrollEnabled={false}
                style={[formStyles.input, styles.notes]}
              />
              <Pressable style={[styles.secondary, notesSaved && styles.secondaryDone]} onPress={handleSaveNotes}>
                <ThemedText style={[styles.secondaryText, notesSaved && styles.secondaryTextDone]}>
                  {notesSaved ? "Guardado ✓" : "Guardar notas"}
                </ThemedText>
              </Pressable>

              <ThemedText style={styles.section}>Lo que mostrás de vos</ThemedText>
              <ThemedText style={styles.note}>Lo que reveles no se puede volver a ocultar.</ThemedText>
              {!isInitiator && (
                <ThemedText style={styles.note}>
                  Tus fotos y tu bio ya son públicas: quien te escribió las puede ver desde tu perfil.
                </ThemedText>
              )}
              {revealable.map((f) => (
                <ThemedView key={f.key} style={styles.row}>
                  <ThemedText style={styles.label}>{f.label}</ThemedText>
                  {!hasValue(f) ? (
                    <Pressable onPress={() => router.push("/edit-profile")}>
                      <ThemedText style={styles.emptyLink}>Completar en tu perfil</ThemedText>
                    </Pressable>
                    ) : revealedByMe(f) ? (
                    <PopIn animate={justRevealed.includes(f.key)}>
                      <ThemedView style={styles.done}>
                        <Ionicons name="checkmark-circle" size={16} color={Palette.success} />
                        <ThemedText style={styles.doneText}>Revelado</ThemedText>
                      </ThemedView>
                    </PopIn>
                  ) : (
                    <Pressable
                      style={styles.reveal}
                      onPress={() => {
                        haptic.tap();
                        handleReveal(f.key);
                      }}
                    >
                      <ThemedText style={styles.revealText}>Revelar</ThemedText>
                    </Pressable>
                  )}
                </ThemedView>
              ))}
              {isInitiator && (
                <ThemedView style={styles.row}>
                  <ThemedText style={styles.label}>Fotos</ThemedText>
                  {myPhotoCount === 0 ? (
                    <Pressable onPress={() => router.push("/edit-profile")}>
                      <ThemedText style={styles.emptyLink}>Completar en tu perfil</ThemedText>
                    </Pressable>
                  ) : card.my_reveals?.photos ? (
                    <PopIn animate={justRevealed.includes("photos")}>
                      <ThemedView style={styles.done}>
                        <Ionicons name="checkmark-circle" size={16} color={Palette.success} />
                        <ThemedText style={styles.doneText}>Revelado</ThemedText>
                      </ThemedView>
                    </PopIn>
                  ) : (
                    <Pressable
                      style={styles.reveal}
                      onPress={() => {
                        haptic.tap();
                        handleReveal("photos");
                      }}
                    >
                      <ThemedText style={styles.revealText}>Revelar</ThemedText>
                    </Pressable>
                  )}
                </ThemedView>
              )}
              <Pressable
                style={[formStyles.button, { marginTop: 16 }, allDone && styles.disabled]}
                disabled={allDone}
                onPress={confirmRevealAll}
              >
                <ThemedText style={formStyles.buttonText}>
                  {allDone ? "Todo revelado" : "Revelar todo"}
                </ThemedText>
              </Pressable>
              <Pressable style={styles.danger} onPress={confirmReset}>
                <ThemedText style={styles.dangerText}>Resetear ficha</ThemedText>
              </Pressable>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Palette.border,
  },
  label: { fontSize: 16 },
  value: { flex: 1, textAlign: 'right', fontSize: 16, opacity: 0.9 },
  hidden: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  hiddenText: { color: Palette.muted, fontSize: 14 },
  notes: { minHeight: 80, textAlignVertical: 'top', marginTop: 8 },
  secondary: {
    borderWidth: 1,
    borderColor: Palette.primary,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 12,
  },
  secondaryText: { color: Palette.primary, fontSize: 16, fontWeight: '600' },
  reveal: {
    borderWidth: 1,
    borderColor: Palette.primary,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  revealText: { color: Palette.primary, fontSize: 14, fontWeight: '600' },
  danger: {
    borderWidth: 1,
    borderColor: Palette.danger,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  dangerText: { color: Palette.danger, fontSize: 16, fontWeight: '600' },
  note: { fontSize: 13, opacity: 0.6, marginBottom: 4 },
  done: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  doneText: { color: Palette.success, fontSize: 14, fontWeight: '600' },
  emptyLink: { color: Palette.muted, fontSize: 14, textDecorationLine: 'underline' },
  disabled: { opacity: 0.5 },
  secondaryDone: { borderColor: Palette.success },
  secondaryTextDone: { color: Palette.success },
  center: { alignItems: 'center', gap: 12, marginTop: 40 },
  photosBlock: {
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Palette.border,
  },
});