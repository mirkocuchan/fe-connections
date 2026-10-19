import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { API_BASE_URL } from "@/constants/api";
import { formStyles } from "@/constants/form-styles";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSend() {
    setErrorMessage("");
    const trimmed = email.trim();
    if (!trimmed) {
      setErrorMessage("Ingresá tu email");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(API_BASE_URL + "/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
      });
      const data = await response.json();
      if (data.error) {
        setErrorMessage(data.error);
        return;
      }
      //pasamos el email a la pantalla siguiente para que no lo tenga que escribir de nuevo
      router.push({ pathname: "/reset-password", params: { email: trimmed } });
    } catch (error) {
      setErrorMessage("No se pudo conectar con el servidor");
    } finally {
      setLoading(false); //se ejecuta siempre, haya salido bien, mal o con return
    }
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ThemedView style={formStyles.container}>
        <ThemedText type="subtitle">Recuperar contraseña</ThemedText>
        <ThemedText>
          Ingresá tu email y te enviamos un código para elegir una contraseña nueva.
        </ThemedText>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          keyboardType="email-address"
          autoCapitalize="none"
          style={formStyles.input}
          placeholderTextColor="#888"
        />
        <Pressable
          onPress={handleSend}
          disabled={loading}
          style={[formStyles.button, loading && { opacity: 0.6 }]}
        >
          <ThemedText style={formStyles.buttonText}>
            {loading ? "Enviando..." : "Enviar código"}
          </ThemedText>
        </Pressable>
        {errorMessage ? (
          <ThemedText style={formStyles.error}>{errorMessage}</ThemedText>
        ) : null}
      </ThemedView>
    </SafeAreaView>
  );
}