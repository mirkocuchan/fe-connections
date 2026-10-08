import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { apiFetchChecked } from '@/utils/api';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useState } from 'react';
import { Alert, Button, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function DeleteAccountScreen() {
  const [password, setPassword] = useState("");
  const [deleting, setDeleting] = useState(false);

  function confirmDelete() {
    if (password === "") {
      Alert.alert("Falta la contraseña", "Ingresá tu contraseña para confirmar.");
      return;
    }
    Alert.alert(
      "¿Eliminar tu cuenta?",
      "Se borrarán tu perfil, fotos, historias y chats. Esto no se puede deshacer.",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Eliminar", style: "destructive", onPress: handleDelete },
      ]
    );
  }

  async function handleDelete() {
    setDeleting(true);
    const { ok, data } = await apiFetchChecked("/me", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    setDeleting(false);
    if (!ok) {
      Alert.alert(
        "No se pudo eliminar la cuenta",
        data?.error === "Incorrect password"
          ? "La contraseña es incorrecta."
          : data?.error || "Intentá de nuevo"
      );
      return;
    }
    await SecureStore.deleteItemAsync("token");
    await SecureStore.deleteItemAsync("refresh_token");
    await SecureStore.deleteItemAsync("my_user_id");
    router.replace("/login");
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ThemedView style={styles.container}>
        <Button title="← Volver" onPress={() => router.back()} />
        <ThemedText type="title">Eliminar cuenta</ThemedText>
        <ThemedText>
          Vas a borrar tu cuenta de forma definitiva: tu perfil, tus fotos, tus historias y todos tus chats.
          Para confirmar, ingresá tu contraseña.
        </ThemedText>
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Tu contraseña"
          secureTextEntry
          autoCapitalize="none"
          style={{ color: '#ffffff', borderWidth: 1, borderColor: '#555555', padding: 8 }}
        />
        <Button
          title={deleting ? "Eliminando..." : "Eliminar mi cuenta"}
          color="#ff4d4d"
          onPress={confirmDelete}
          disabled={deleting}
        />
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 16 },
});