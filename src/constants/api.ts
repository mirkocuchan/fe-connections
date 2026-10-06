import Constants from "expo-constants";

const host = Constants.expoConfig?.hostUri?.split(":")[0];

export const API_BASE_URL = host ? `http://${host}:8080` : "http://localhost:8080";