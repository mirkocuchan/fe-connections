import { ThemedView } from "@/components/themed-view";
import { API_BASE_URL } from "@/constants/api";
import * as SecureStore from "expo-secure-store";
import { useEffect, useState } from "react";
import { Button, StyleSheet, TextInput } from "react-native";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  useEffect(() => {
  async function checkToken() {
    const token = await SecureStore.getItemAsync("token");
    console.log("token guardado:", token);
  }
  checkToken();
  }, []);

  async function handleLogin() {
    try{
      const response = await fetch(API_BASE_URL + "/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      //que viene de data? funciono el login? incorrect info? 
      if (!data.token) {
        console.log("login fallido:", data.error);
        return;
      }
      await SecureStore.setItemAsync("token", data.token);
      await SecureStore.setItemAsync("refresh_token", data.refresh_token);

      console.log("tokens guardados");
    }catch (error){
      console.log("error en login:", error);
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