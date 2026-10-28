import { ScreenHeader } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { formStyles } from '@/constants/form-styles';
import { apiFetch, apiFetchChecked } from '@/utils/api';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, TextInput } from 'react-native';
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

  async function fetchCard() {
    const data = await apiFetch("/chats/" + chatID + "/card");
    if (!data) return;
    setCard(data);
    setNotesInput(data.notes_on_subject?.Valid ? data.notes_on_subject.String : "");
  }

  const [me, setMe] = useState<any>(null);

  async function fetchMe() {
    const data = await apiFetch("/me");
    if (data) setMe(data);
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
      Alert.alert("No se pudo revelar", data?.error || "Intentá de nuevo");
      return;
    }
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
    fetchCard();
    setNotesSaved(true);
    setTimeout(() => setNotesSaved(false), 2000); //el aviso desaparece solo a los 2 segundos
  }

  async function handleRevealAll() {
    const { ok, data } = await apiFetchChecked("/chats/" + chatID + "/card/reveal-all", {
      method: "POST",
    });
    if (!ok) {
      Alert.alert("No se pudo revelar todo", data?.error || "Intentá de nuevo");
      return;
    }
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

  useFocusEffect(
    useCallback(() => {
      fetchCard();
      fetchMe();
    }, [chatID])
  );

  const nickname = card?.nickname?.Valid ? card.nickname.String : "Sin apodo";
  const allDone = FIELDS.every((f) => !hasValue(f) || revealedByMe(f));
  
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScreenHeader title={card ? nickname : "Ficha"} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {card && me && (
            <>
              <ThemedText style={styles.section}>Lo que sabés de esta persona</ThemedText>
              {FIELDS.map((f) => {
                const value = card[f.valueKey];
                const revealed = isRevealed(value);
                return (
                  <ThemedView key={f.key} style={styles.row}>
                    <ThemedText style={styles.label}>{f.label}</ThemedText>
                    {revealed ? (
                      <ThemedText style={styles.value}>{String(value)}</ThemedText>
                    ) : (
                      <ThemedView style={styles.hidden}>
                        <Ionicons name="lock-closed-outline" size={14} color="#888" />
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
                placeholderTextColor="#888"
                multiline
                style={[formStyles.input, styles.notes]}
              />
              <Pressable style={[styles.secondary, notesSaved && styles.secondaryDone]} onPress={handleSaveNotes}>
                <ThemedText style={[styles.secondaryText, notesSaved && styles.secondaryTextDone]}>
                  {notesSaved ? "Guardado ✓" : "Guardar notas"}
                </ThemedText>
              </Pressable>

              <ThemedText style={styles.section}>Lo que mostrás de vos</ThemedText>
              <ThemedText style={styles.note}>Lo que reveles no se puede volver a ocultar.</ThemedText>
              {FIELDS.map((f) => (
                <ThemedView key={f.key} style={styles.row}>
                  <ThemedText style={styles.label}>{f.label}</ThemedText>
                  {!hasValue(f) ? (
                    <Pressable onPress={() => router.push("/edit-profile")}>
                      <ThemedText style={styles.emptyLink}>Completar en tu perfil</ThemedText>
                    </Pressable>
                  ) : revealedByMe(f) ? (
                    <ThemedView style={styles.done}>
                      <Ionicons name="checkmark-circle" size={16} color="#34c759" />
                      <ThemedText style={styles.doneText}>Revelado</ThemedText>
                    </ThemedView>
                  ) : (
                    <Pressable style={styles.reveal} onPress={() => handleReveal(f.key)}>
                      <ThemedText style={styles.revealText}>Revelar</ThemedText>
                    </Pressable>
                  )}
                </ThemedView>
              ))}

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
    borderBottomColor: '#333',
  },
  label: { fontSize: 16 },
  value: { flex: 1, textAlign: 'right', fontSize: 16, opacity: 0.9 },
  hidden: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  hiddenText: { color: '#888', fontSize: 14 },
  notes: { minHeight: 80, textAlignVertical: 'top', marginTop: 8 },
  secondary: {
    borderWidth: 1,
    borderColor: '#3c87f7',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 12,
  },
  secondaryText: { color: '#3c87f7', fontSize: 16, fontWeight: '600' },
  reveal: {
    borderWidth: 1,
    borderColor: '#3c87f7',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  revealText: { color: '#3c87f7', fontSize: 14, fontWeight: '600' },
  danger: {
    borderWidth: 1,
    borderColor: '#ff4d4d',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  dangerText: { color: '#ff4d4d', fontSize: 16, fontWeight: '600' },
  note: { fontSize: 13, opacity: 0.6, marginBottom: 4 },
  done: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  doneText: { color: '#34c759', fontSize: 14, fontWeight: '600' },
  emptyLink: { color: '#888', fontSize: 14, textDecorationLine: 'underline' },
  disabled: { opacity: 0.5 },
  secondaryDone: { borderColor: '#34c759' },
  secondaryTextDone: { color: '#34c759' },
});