import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { API_BASE_URL } from '@/constants/api';
import { useLocalSearchParams } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useEffect, useState } from 'react';
import { StyleSheet, Button, TextInput } from 'react-native';

export default function CardScreen() {
  const { chatID } = useLocalSearchParams();
  const [card, setCard] = useState<any>(null);
  const [notesInput, setNotesInput] = useState("");

  async function fetchCard() {
    const token = await SecureStore.getItemAsync("token");
    const response = await fetch(API_BASE_URL + "/chats/" + chatID + "/card", {
      headers: { Authorization: "Bearer " + token },
    });
    const data = await response.json();
    setCard(data);
    setNotesInput(data.notes_on_subject?.Valid ? data.notes_on_subject.String : "");
  }
  async function handleReveal(field: string) {
    const token = await SecureStore.getItemAsync("token");
    await fetch(API_BASE_URL + "/chats/" + chatID + "/card/reveal/" + field, {
      method: "POST",
      headers: { Authorization: "Bearer " + token },
    });
    fetchCard();
  }

  async function handleSaveNotes() {
    const token = await SecureStore.getItemAsync("token");
    await fetch(API_BASE_URL + "/chats/" + chatID + "/card/notes", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
      body: JSON.stringify({ notes_on_subject: notesInput }),
    });
    fetchCard();
  }
  async function handleRevealAll() {
    const token = await SecureStore.getItemAsync("token");
    await fetch(API_BASE_URL + "/chats/" + chatID + "/card/reveal-all", {
      method: "POST",
      headers: { Authorization: "Bearer " + token },
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
      </>
    )}
  </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
