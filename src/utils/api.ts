import { API_BASE_URL } from '@/constants/api';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';

export async function clearSession() {
  await SecureStore.deleteItemAsync("token");
  await SecureStore.deleteItemAsync("refresh_token");
}

let refreshing: Promise<boolean> | null = null;

//true = sesión renovada, false = el servidor rechazó el refresh token.
//si falla la red, lanza el error (no cierra la sesión).
async function doRefresh(): Promise<boolean> {
  const refreshToken = await SecureStore.getItemAsync("refresh_token");
  if (!refreshToken) return false;

  const response = await fetch(API_BASE_URL + "/refresh", {
    method: "POST",
    headers: { Authorization: "Bearer " + refreshToken },
  });
  if (!response.ok) return false;

  const data = await response.json();
  await SecureStore.setItemAsync("token", data.token);
  await SecureStore.setItemAsync("refresh_token", data.refresh_token);
  return true;
}

//si ya hay un refresh en curso, todos los pedidos esperan a ese mismo.
function refreshSession(): Promise<boolean> {
  if (!refreshing) {
    refreshing = doRefresh().finally(() => {
      refreshing = null;
    });
  }
  return refreshing;
}

async function authedFetch(path: string, options: any = {}): Promise<Response | null> {
  const send = (token: string | null) =>
    fetch(API_BASE_URL + path, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: "Bearer " + token,
      },
    });

  const usedToken = await SecureStore.getItemAsync("token");
  let response = await send(usedToken);

  if (response.status === 401) {
    //si otro pedido ya renovó el token mientras tanto, solo reintentamos.
    const currentToken = await SecureStore.getItemAsync("token");
    const renewed = currentToken !== usedToken || (await refreshSession());

    if (renewed) {
      response = await send(await SecureStore.getItemAsync("token"));
    }
    if (!renewed || response.status === 401) {
      await clearSession();
      router.replace("/login");
      return null;
    }
  }

  return response;
}

export async function apiFetch(path: string, options: any = {}) {
  const response = await authedFetch(path, options);
  return response ? response.json() : null;
}

export async function apiFetchChecked(path: string, options: any = {}) {
  const response = await authedFetch(path, options);
  if (!response) return { ok: false, data: null };

  const data = await response.json();
  return { ok: response.ok, data };
}