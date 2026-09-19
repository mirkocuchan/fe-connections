import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import { API_BASE_URL } from "@/constants/api";
import { router } from 'expo-router';
import * as SecureStore from "expo-secure-store";
import { useEffect, useState } from "react";
import { Button, StyleSheet, TextInput } from "react-native";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleLogin() {
    try {
      const response = await fetch(API_BASE_URL + "/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();

      if (!data.token) {
        setErrorMessage(data.error || "Error al iniciar sesión");
        return;
      }

      await SecureStore.setItemAsync("token", data.token);
      await SecureStore.setItemAsync("refresh_token", data.refresh_token);
      router.replace("/(tabs)");
    } catch (error) {
      setErrorMessage("No se pudo conectar con el servidor");
    }
  }

  return (
    <ThemedView style={styles.container}>
      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="Email"
        keyboardType="email-address"
        autoCapitalize="none"
        style={{ color: '#ffffff', borderWidth: 1, borderColor: '#ccc', padding: 8 }}
      />
      <TextInput
        value={password}
        onChangeText={setPassword}
        placeholder="Contraseña"
        secureTextEntry
        style={{ color: '#ffffff', borderWidth: 1, borderColor: '#ccc', padding: 8 }}
      />
      <Button title="Log in" onPress={handleLogin} />

      {errorMessage ? (
        <ThemedText style={{ color: 'red' }}>{errorMessage}</ThemedText>
      ) : null}
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
