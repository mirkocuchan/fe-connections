import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { API_BASE_URL } from "@/constants/api";
import { formStyles } from "@/constants/form-styles";
import { registerForPush } from "@/utils/push";
import { connectSocket } from "@/utils/socket";
import { getLocales } from "expo-localization";
import { Link, router } from 'expo-router';
import * as SecureStore from "expo-secure-store";
import { useState } from "react";
import { Pressable, StyleSheet, TextInput } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleLogin() {
    setErrorMessage("");
    const regionCode = getLocales()[0]?.regionCode ?? "";
    try {
      const response = await fetch(API_BASE_URL + "/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, region_code: regionCode }),
      });
      const data = await response.json();

      if (!data.token) {
        setErrorMessage(data.error || "Error al iniciar sesión");
        return;
      }

      await SecureStore.setItemAsync("token", data.token);
      await SecureStore.setItemAsync("refresh_token", data.refresh_token);
      await SecureStore.setItemAsync("my_user_id", data.id);
      registerForPush(); //sin await: no frena el login
      connectSocket();   //abrir la línea recién logueado
      router.replace("/(tabs)");
    } catch (error) {
      setErrorMessage("No se pudo conectar con el servidor");
    }
  }

  return (
  <SafeAreaView style={{ flex: 1 }}>
    <ThemedView style={formStyles.container}>
      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="Email"
        keyboardType="email-address"
        autoCapitalize="none"
        style={formStyles.input}
        placeholderTextColor="#888"
      />
      <TextInput
        value={password}
        onChangeText={setPassword}
        placeholder="Contraseña"
        secureTextEntry
        style={formStyles.input}
        placeholderTextColor="#888"
      />
      <Pressable onPress={handleLogin} style={formStyles.button}>
        <ThemedText style={formStyles.buttonText}>Iniciar sesión</ThemedText>
      </Pressable>
      <Link href="/forgot-password" style={styles.linkRow}>
        <ThemedText type="linkPrimary" style={formStyles.linkText}>
          ¿Olvidaste tu contraseña?
        </ThemedText>
      </Link>
      <Link href="/register" style={styles.linkRow}>
        <ThemedText type="linkPrimary" style={formStyles.linkText}>
          ¿No tenés cuenta? Registrate
        </ThemedText>
      </Link>
      {errorMessage ? (
        <ThemedText style={formStyles.error}>{errorMessage}</ThemedText>
      ) : null}
    </ThemedView>
  </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  linkRow: {
    textAlign: "center",
  },
});