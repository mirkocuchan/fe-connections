import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { apiFetchChecked } from '@/utils/api';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useState } from 'react';
import { Alert, Button, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ChangePasswordScreen() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (currentPassword === "" || newPassword === "") {
      Alert.alert("Faltan datos", "Completá todos los campos.");
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert("Contraseña muy corta", "La nueva contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (newPassword !== repeatPassword) {
      Alert.alert("No coinciden", "La nueva contraseña y su repetición no son iguales.");
      return;
    }

    setSaving(true);
    const { ok, data } = await apiFetchChecked("/me/password", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
    });
    setSaving(false);

    if (!ok) {
      Alert.alert(
        "No se pudo cambiar la contraseña",
        data?.error === "Incorrect password"
          ? "La contraseña actual es incorrecta."
          : data?.error === "new password must be different"
          ? "La nueva contraseña tiene que ser distinta de la actual."
          : data?.error || "Intentá de nuevo"
      );
      return;
    }

    // el servidor cerró todas las sesiones: limpio la mía y vuelvo al login
    await SecureStore.deleteItemAsync("token");
    await SecureStore.deleteItemAsync("refresh_token");
    await SecureStore.deleteItemAsync("my_user_id");
    Alert.alert("Contraseña actualizada", "Volvé a iniciar sesión con tu nueva contraseña.");
    router.replace("/login");
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ThemedView style={styles.container}>
        <Button title="← Volver" onPress={() => router.back()} />
        <ThemedText type="title">Cambiar contraseña</ThemedText>
        <TextInput
          value={currentPassword}
          onChangeText={setCurrentPassword}
          placeholder="Contraseña actual"
          secureTextEntry
          autoCapitalize="none"
          style={styles.input}
        />
        <TextInput
          value={newPassword}
          onChangeText={setNewPassword}
          placeholder="Nueva contraseña"
          secureTextEntry
          autoCapitalize="none"
          style={styles.input}
        />
        <TextInput
          value={repeatPassword}
          onChangeText={setRepeatPassword}
          placeholder="Repetir nueva contraseña"
          secureTextEntry
          autoCapitalize="none"
          style={styles.input}
        />
        <Button title={saving ? "Guardando..." : "Cambiar contraseña"} onPress={handleSave} disabled={saving} />
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 16 },
  input: { color: '#ffffff', borderWidth: 1, borderColor: '#555555', padding: 8 },
});