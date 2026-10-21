import { ScreenHeader } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { formStyles } from '@/constants/form-styles';
import { apiFetch, apiFetchChecked } from '@/utils/api';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const NOT_REVEALED = "not revealed yet...";

// key = lo que espera el endpoint de revelar; valueKey = campo de la ficha
const FIELDS = [
  { key: "name", label: "Nombre", valueKey: "display_name_value" },
  { key: "date_of_birth", label: "Fecha de nacimiento", valueKey: "date_of_birth_value" },
  { key: "city", label: "Ciudad", valueKey: "city_value" },
  { key: "country", label: "País", valueKey: "country_value" },
  { key: "bio", label: "Bio", valueKey: "bio_value" },
  { key: "hobbies", label: "Hobbies", valueKey: "hobbies_value" },
  { key: "languages", label: "Idiomas", valueKey: "languages_value" },
];

function isRevealed(value: any) {
  return value != null && String(value) !== "" && value !== NOT_REVEALED;
}

export default function CardScreen() {
  const { chatID } = useLocalSearchParams();
  const [card, setCard] = useState<any>(null);
  const [notesInput, setNotesInput] = useState("");

  async function fetchCard() {
    const data = await apiFetch("/chats/" + chatID + "/card");
    if (!data) return;
    setCard(data);
    setNotesInput(data.notes_on_subject?.Valid ? data.notes_on_subject.String : "");
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

  useEffect(() => {
    fetchCard();
  }, []);

  const nickname = card?.nickname?.Valid ? card.nickname.String : "Sin apodo";

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScreenHeader title={card ? nickname : "Ficha"} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {card && (
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
              <Pressable style={styles.secondary} onPress={handleSaveNotes}>
                <ThemedText style={styles.secondaryText}>Guardar notas</ThemedText>
              </Pressable>

              <ThemedText style={styles.section}>Lo que mostrás de vos</ThemedText>
              {FIELDS.map((f) => (
                <ThemedView key={f.key} style={styles.row}>
                  <ThemedText style={styles.label}>{f.label}</ThemedText>
                  <Pressable style={styles.reveal} onPress={() => handleReveal(f.key)}>
                    <ThemedText style={styles.revealText}>Revelar</ThemedText>
                  </Pressable>
                </ThemedView>
              ))}

              <Pressable style={[formStyles.button, { marginTop: 16 }]} onPress={handleRevealAll}>
                <ThemedText style={formStyles.buttonText}>Revelar todo</ThemedText>
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
});