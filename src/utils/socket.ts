import { API_BASE_URL } from '@/constants/api';
import { apiFetch } from '@/utils/api';
import * as SecureStore from 'expo-secure-store';
import { AppState } from 'react-native';

type Handler = (event: any) => void;

const handlers = new Set<Handler>();
let ws: WebSocket | null = null;
let wantConnected = false;
let connecting = false;
let hasConnected = false;
let retry = 0;
let retryTimer: ReturnType<typeof setTimeout> | null = null;

//las pantallas se suscriben acá, devolvemos la función para desuscribirse
export function onSocketEvent(handler: Handler) {
  handlers.add(handler);
  return () => {
    handlers.delete(handler);
  };
}

function emit(event: any) {
  handlers.forEach((h) => h(event));
}

function scheduleRetry() {
  if (!wantConnected || retryTimer) return;
  const delay = Math.min(1000 * 2 ** retry, 30000); //1s, 2s, y así, máximo 30s
  retry++;
  retryTimer = setTimeout(() => {
    retryTimer = null;
    open();
  }, delay);
}

async function open() {
  if (!wantConnected || connecting) return;
  connecting = true;
  try {
    //pedido barato: si el token venció, authedFetch lo renueva antes de abrir el socket
    const me = await apiFetch("/me");
    if (!me) {
      wantConnected = false; //sesión muerta, ya nos mandó al login
      return;
    }
    const token = await SecureStore.getItemAsync("token");
    if (!token || !wantConnected) return;

    const url = API_BASE_URL.replace(/^http/, "ws") + "/ws?token=" + encodeURIComponent(token);
    const socket = new WebSocket(url);
    ws = socket;

    socket.onopen = () => {
      retry = 0;
      //al reconectar se pudo perder algo: las pantallas vuelven a pedir por REST
      if (hasConnected) emit({ type: "resync" });
      hasConnected = true;
    };
    socket.onmessage = (e) => {
      try {
        emit(JSON.parse(e.data));
      } catch {}
    };
    socket.onerror = () => {}; //después del error siempre llega onclose
    socket.onclose = () => {
      if (ws === socket) {
        ws = null;
        scheduleRetry();
      }
    };
  } catch {
    scheduleRetry(); //sin red
  } finally {
    connecting = false;
  }
}

export function connectSocket() {
  wantConnected = true;
  open();
}

export function disconnectSocket() {
  wantConnected = false;
  hasConnected = false;
  retry = 0;
  if (retryTimer) {
    clearTimeout(retryTimer);
    retryTimer = null;
  }
  const s = ws;
  ws = null;
  s?.close();
}

//iOS puede matar el socket sin avisar: al volver a primer plano lo reabrimos siempre
AppState.addEventListener("change", (state) => {
  if (state !== "active" || !wantConnected) return;
  const s = ws;
  ws = null;
  s?.close();
  if (retryTimer) {
    clearTimeout(retryTimer);
    retryTimer = null;
  }
  retry = 0;
  open();
});