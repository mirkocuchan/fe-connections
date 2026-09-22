import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { apiFetch } from '@/utils/api';
import { useLocalSearchParams } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useEffect, useState } from 'react';
import { Button, StyleSheet, TextInput } from 'react-native';

export default function CardScreen() {
  const { chatID } = useLocalSearchParams();
  const [card, setCard] = useState<any>(null);
  const [notesInput, setNotesInput] = useState("");
  const [chatName, setChatName] = useState("Chat")

  async function fetchCard() {
    const data = await apiFetch("/chats/" + chatID + "/card");
    if (!data) return;

    setCard(data);
    setNotesInput(data.notes_on_subject?.Valid ? data.notes_on_subject.String : "");
    
    const myUserID = await SecureStore.getItemAsync("my_user_id"); // ver nota abajo
    const isInitiator = myUserID === data.user_one_id;

    if (data.nickname && data.nickname.Valid) {
      setChatName(data.nickname.String);
    } else if (isInitiator) {
      const profile = await apiFetch("/users/" + data.subject_id + "/profile");
      if (profile) setChatName(profile.username);
    } else {
      setChatName("anon-" + data.subject_id.slice(0, 8));
    }
  }

  async function handleReveal(field: string) {
    await apiFetch("/chats/" + chatID + "/card/reveal/" + field, {
      method: "POST",
    });
    fetchCard();
  }

  async function handleSaveNotes() {
    await apiFetch("/chats/" + chatID + "/card/notes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes_on_subject: notesInput }),
    });
    fetchCard();
  }

  async function handleRevealAll() {
    await apiFetch("/chats/" + chatID + "/card/reveal-all", {
      method: "POST",
    });
    fetchCard();
  }

  async function handleResetCard() {
  await apiFetch("/chats/" + chatID + "/card/reset", {
    method: "PATCH",
  });
  fetchCard();
}

  useEffect(() => {
    fetchCard();
  }, []);

  return (
    <ThemedView style={styles.container}>
      {card && (
        <>
          <ThemedText type="title">
            {card.nickname?.Valid ? card.nickname.String : "Sin apodo"}
          </ThemedText>

          <ThemedText>Nombre: {card.display_name_value}</ThemedText>
          <ThemedText>Fecha de nacimiento: {card.date_of_birth_value}</ThemedText>
          <ThemedText>Ciudad: {card.city_value}</ThemedText>
          <ThemedText>País: {card.country_value}</ThemedText>
          <ThemedText>Bio: {card.bio_value}</ThemedText>
          <ThemedText>Hobbies: {card.hobbies_value}</ThemedText>
          <ThemedText>Idiomas: {card.languages_value}</ThemedText>
          <ThemedText>
            Notas: {card.notes_on_subject?.Valid ? card.notes_on_subject.String : "Sin notas"}
          </ThemedText>
          <TextInput
            value={notesInput}
            onChangeText={setNotesInput}
            placeholder="Notas sobre esta persona..."
            style={{ color: '#ffffff', borderWidth: 1, borderColor: '#555555', padding: 8 }}
          />
          <Button title="Guardar notas" onPress={handleSaveNotes} />

          <ThemedText type="subtitle">Revelar mis datos</ThemedText>
          <Button title="Revelar nombre" onPress={() => handleReveal("name")} />
          <Button title="Revelar fecha de nacimiento" onPress={() => handleReveal("date_of_birth")} />
          <Button title="Revelar ciudad" onPress={() => handleReveal("city")} />
          <Button title="Revelar país" onPress={() => handleReveal("country")} />
          <Button title="Revelar bio" onPress={() => handleReveal("bio")} />
          <Button title="Revelar hobbies" onPress={() => handleReveal("hobbies")} />
          <Button title="Revelar idiomas" onPress={() => handleReveal("languages")} />
          <Button title="Revelar todo" onPress={handleRevealAll} />
          <Button title="Resetear ficha" onPress={handleResetCard} />
        </>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});