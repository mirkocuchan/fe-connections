import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { API_BASE_URL } from "@/constants/api";
import { formStyles } from "@/constants/form-styles";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ResetPasswordScreen() {
  const params = useLocalSearchParams<{ email?: string }>();
  const [email, setEmail] = useState(params.email ?? "");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleReset() {
    setErrorMessage("");
    if (code.trim().length !== 6) {
      setErrorMessage("El código tiene 6 dígitos");
      return;
    }
    if (password.length < 6) {
      setErrorMessage("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    if (password !== password2) {
      setErrorMessage("Las contraseñas no coinciden");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(API_BASE_URL + "/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          code: code.trim(),
          new_password: password,
        }),
      });
      const data = await response.json();
      if (data.error) {
        setErrorMessage(data.error);
        return;
      }
      Alert.alert("Listo", "Tu contraseña se actualizó. Ya podés iniciar sesión.", [
        { text: "OK", onPress: () => router.replace("/login") },
      ]);
    } catch (error) {
      setErrorMessage("No se pudo conectar con el servidor");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ThemedView style={formStyles.container}>
        <ThemedText type="subtitle">Nueva contraseña</ThemedText>
        <ThemedText>
          Si el email está registrado, te enviamos un código de 6 dígitos. Vence en 15 minutos.
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
        <TextInput
          value={code}
          onChangeText={setCode}
          placeholder="Código de 6 dígitos"
          keyboardType="number-pad"
          maxLength={6}
          textContentType="oneTimeCode"
          style={formStyles.input}
          placeholderTextColor="#888"
        />
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Contraseña nueva"
          secureTextEntry
          style={formStyles.input}
          placeholderTextColor="#888"
        />
        <TextInput
          value={password2}
          onChangeText={setPassword2}
          placeholder="Repetí la contraseña"
          secureTextEntry
          style={formStyles.input}
          placeholderTextColor="#888"
        />
        <Pressable
          onPress={handleReset}
          disabled={loading}
          style={[formStyles.button, loading && { opacity: 0.6 }]}
        >
          <ThemedText style={formStyles.buttonText}>
            {loading ? "Guardando..." : "Cambiar contraseña"}
          </ThemedText>
        </Pressable>
        {errorMessage ? (
          <ThemedText style={formStyles.error}>{errorMessage}</ThemedText>
        ) : null}
      </ThemedView>
    </SafeAreaView>
  );
}