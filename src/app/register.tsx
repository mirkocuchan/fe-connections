import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { API_BASE_URL } from "@/constants/api";
import { formStyles } from "@/constants/form-styles";
import DateTimePicker, { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import { Link, router } from 'expo-router';
import { useState } from "react";
import { Platform, Pressable, StyleSheet, TextInput } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';

export default function RegisterScreen() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [dob, setDob] = useState<Date | null>(null);
  const [showPicker, setShowPicker] = useState(false); //sólo se usa en iOS
  const defaultDate = new Date(2000, 0, 1); //donde arranca el selector, javascript usa 0 a 11 para los meses
  const [accepted, setAccepted] = useState(false);

  function handleRegister() {
    if (!dob) {
      setErrorMessage("Elegí tu fecha de nacimiento");
      return;
    }
    if (!isAdult(dob)) {
      setErrorMessage("Tenés que ser mayor de 18 años para registrarte");
      return;
    }
    if (!accepted) {
      setErrorMessage("Tenés que aceptar los términos para continuar");
      return;
    }
    fetch(API_BASE_URL + "/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password, date_of_birth: toYMD(dob), accept_terms: accepted }),
    })
      .then((response) => response.json()) //respuesta del servidor, la convierte en un objeto JSON 
      .then((data) => {
        if (data.error) {
          setErrorMessage(data.error);
          return; //hubo error al crear la cuenta, no hacemos nada más
        }
        router.replace("/login"); //si todo salió bien, vamos a la pantalla de login
      })
      .catch((error) => {
        setErrorMessage("No se pudo conectar con el servidor");
      }); //fallo de conexión, no hacemos nada más
  }
  function openPicker() {
    if (Platform.OS === "android") {
      //en android el selector es un diálogo que se abre por código, con una llamada a la API nativa. en iOS es un componente que se renderiza en pantalla.
      DateTimePickerAndroid.open({
        value: dob ?? defaultDate,
        mode: "date",
        maximumDate: new Date(),
        onChange: (event, selected) => {
          if (event.type === "set" && selected) setDob(selected);
        },
      });
    } else {
      setShowPicker(true);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ThemedView style={formStyles.container}>
        <TextInput
          value={username}
          onChangeText={setUsername}
          placeholder="Usuario"
          style={formStyles.input}
          placeholderTextColor="#888"
        />
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
        <Pressable onPress={openPicker} style={formStyles.input}>
          <ThemedText style={{ opacity: dob ? 1 : 0.5 }}>
            {dob ? toDMY(dob) : "Fecha de nacimiento"}
          </ThemedText>
        </Pressable>

        {showPicker && Platform.OS === "ios" && (
          <>
            <DateTimePicker
              value={dob ?? defaultDate}
              mode="date"
              display="spinner"
              maximumDate={new Date()}
              onChange={(_event, selected) => {
                if (selected) setDob(selected);
              }}
            />
            <Pressable onPress={() => setShowPicker(false)} style={formStyles.button}>
              <ThemedText style={formStyles.buttonText}>Listo</ThemedText>
            </Pressable>
          </>
        )}

        <ThemedView style={styles.termsRow}>
          <Pressable onPress={() => setAccepted(!accepted)} hitSlop={10}>
            <ThemedText style={styles.checkbox}>{accepted ? "☑" : "☐"}</ThemedText>
          </Pressable>
          <ThemedText style={[formStyles.linkText, { flex: 1 }]}>
            Declaro ser mayor de 18 años y acepto los{" "}
            <Link href="/terms">
              <ThemedText type="linkPrimary" style={formStyles.linkText}>
                términos y condiciones
              </ThemedText>
            </Link>
            {", las "}
            <Link href="/community-rules">
              <ThemedText type="linkPrimary" style={formStyles.linkText}>
                reglas de la comunidad
              </ThemedText>
            </Link>
            {" y la "}
            <Link href="/privacy">
              <ThemedText type="linkPrimary" style={formStyles.linkText}>
                política de privacidad
              </ThemedText>
            </Link>
            .
          </ThemedText>
        </ThemedView>

        <Pressable onPress={handleRegister} style={formStyles.button}>
          <ThemedText style={formStyles.buttonText}>Crear cuenta</ThemedText>
        </Pressable>

        {errorMessage ? (
          <ThemedText style={formStyles.error}>{errorMessage}</ThemedText>
        ) : null}
      </ThemedView>
    </SafeAreaView>
  );
}

//la fecha que se manda al servidor
function toYMD(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

//la fecha que se le muestra a la persona
function toDMY(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${day}/${m}/${y}`;
}

function isAdult(d: Date) {
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const hadBirthday =
    today.getMonth() > d.getMonth() ||
    (today.getMonth() === d.getMonth() && today.getDate() >= d.getDate());
  if (!hadBirthday) age--;
  return age >= 18;
}
const styles = StyleSheet.create({
  termsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  checkbox: {
    fontSize: 24,
  },
});
