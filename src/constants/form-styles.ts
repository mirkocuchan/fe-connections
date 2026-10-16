import { StyleSheet } from "react-native";

//estilos compartidos por las pantallas con formulario (login, registro, etc.)
export const formStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 12,
  },
  input: {
    color: "#ffffff",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
  button: {
    backgroundColor: "#3c87f7",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  //texto de 16 con el mismo alto de línea que ThemedText "default",
  //para que un enlace dentro de una frase no se vea de otro tamaño
  linkText: {
    fontSize: 16,
    lineHeight: 24,
  },
  error: {
    color: "red",
    textAlign: "center",
  },
});