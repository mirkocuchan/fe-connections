import { API_BASE_URL } from '@/constants/api';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';

export async function apiFetch(path: string, options: any = {}) {
  const token = await SecureStore.getItemAsync("token");

  const response = await fetch(API_BASE_URL + path, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: "Bearer " + token,
    },
  });

  if (response.status === 401) {
    await SecureStore.deleteItemAsync("token");
    await SecureStore.deleteItemAsync("refresh_token");
    router.replace("/login");
    return null;
  }

  return response.json();
}