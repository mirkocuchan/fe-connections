import { ThemedView } from "@/components/themed-view";
import { API_BASE_URL } from "@/constants/api";
import { useState } from "react";
import { Button, StyleSheet, TextInput } from "react-native";

export default function RegisterScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  function handleLogin() {
    fetch(API_BASE_URL + "/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, email }),
    })
    .then((response) => response.json())
    .then((data) => {
        console.log(data.token, data.refresh_token);
    })
    .catch((error) => {
        console.log("error:", error);
    });
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