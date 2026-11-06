import Constants from "expo-constants";

const host = Constants.expoConfig?.hostUri?.split(":")[0];

const devUrl = host ? `http://${host}:8080` : "http://localhost:8080";

//EXPO_PUBLIC_API_URL, usa esa variable de entorno para cambiar la URL del servidor, por ejemplo:
//en desarrollo (Expo Go), tu notebook o en la app publicada, el servidor real
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? (__DEV__ ? devUrl : "https://api.antifaz.app");