import { ThemedView } from "@/components/themed-view";
import { API_BASE_URL } from "@/constants/api";
import { useState } from "react";
import { Button, StyleSheet, TextInput } from "react-native";

export default function RegisterScreen() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  
  function handleRegister() {
    fetch(API_BASE_URL + "/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password, date_of_birth: dateOfBirth }),
    })
    .then((response) => response.json())
    .then((data) => {
        console.log(data);
    })
    .catch((error) => {
        console.log("error:", error);
    });
    }
    
  return (
    <ThemedView style={styles.container}>
      <TextInput
        value={username}
        onChangeText={setUsername}
        placeholder="Usuario"
        style={{ color: '#ffffff', borderWidth: 1, borderColor: '#ccc', padding: 8 }}
      />
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
      <TextInput
        value={dateOfBirth}
        onChangeText={setDateOfBirth}
        placeholder="Fecha de nacimiento (YYYY-MM-DD)"
        style={{ color: '#ffffff', borderWidth: 1, borderColor: '#ccc', padding: 8 }}
      />
      <Button title="Register" onPress={handleRegister} />
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