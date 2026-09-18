import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { API_BASE_URL } from '@/constants/api';
import { useLocalSearchParams } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';

export default function CardScreen() {
  const { chatID } = useLocalSearchParams();
  const [card, setCard] = useState<any>(null);

  async function fetchCard() {
    const token = await SecureStore.getItemAsync("token");
    const response = await fetch(API_BASE_URL + "/chats/" + chatID + "/card", {
      headers: { Authorization: "Bearer " + token },
    });
    const data = await response.json();
    setCard(data);
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
      </>
    )}
  </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});