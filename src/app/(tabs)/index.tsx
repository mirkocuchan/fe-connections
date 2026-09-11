import { Link } from 'expo-router';
import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function ChatsScreen() {
  // useEffect(() => {
  //   fetch(API_BASE_URL + "/register", {
  //     method: "POST",
  //     headers: { "Content-Type": "application/json" },
  //     body: JSON.stringify({ username: "juan", email: "juan@test.com", password: "pass1234", date_of_birth: "1995-05-20" }),
  //   })
  //     .then((response) => response.json())
  //     .then((data) => {
  //       console.log(data);
  //     })
  //     .catch((error) => {
  //       console.log("error:", error);
  //     });
  //   }, []);
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>
        Welcome to Chats
      </ThemedText>
      <Link href="/register"><ThemedText>Ir a registro</ThemedText></Link>
      <Link href="/login"><ThemedText>Ir a login</ThemedText></Link>

    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    textAlign: 'center',
  },
});