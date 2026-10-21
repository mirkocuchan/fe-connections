import { ScreenHeader } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { formStyles } from '@/constants/form-styles';
import { apiFetchChecked } from '@/utils/api';
import { disconnectSocket } from '@/utils/socket';
import { setUnreadTotal } from '@/utils/unread';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, TextInput } from 'react-native';
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
    disconnectSocket();
    setUnreadTotal(0);   //borra la pizarra de la cuenta anterior con los chats sin leer
    await SecureStore.deleteItemAsync("token");
    await SecureStore.deleteItemAsync("refresh_token");
    await SecureStore.deleteItemAsync("my_user_id");
    router.replace("/login");
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScreenHeader title="Eliminar cuenta" />
      <ThemedView style={styles.container}>
        <ThemedText style={styles.warning}>
          Vas a borrar tu cuenta de forma definitiva: tu perfil, tus fotos, tus historias y todos tus chats.
          Para confirmar, ingresá tu contraseña.
        </ThemedText>
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Tu contraseña"
          placeholderTextColor="#888"
          secureTextEntry
          autoCapitalize="none"
          style={formStyles.input}
        />
        <Pressable
          style={[styles.deleteButton, deleting && { opacity: 0.5 }]}
          onPress={confirmDelete}
          disabled={deleting}
        >
          <ThemedText style={formStyles.buttonText}>
            {deleting ? "Eliminando..." : "Eliminar mi cuenta"}
          </ThemedText>
        </Pressable>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 16 },
  warning: { opacity: 0.8 },
  deleteButton: {
    backgroundColor: '#ff4d4d',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
});