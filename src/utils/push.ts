import { apiFetch, apiFetchChecked } from '@/utils/api';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';

const PUSH_TOKEN_KEY = 'push_token';

export async function registerForPush() {
  try {
    if (!Device.isDevice) return;

    const { status: existing } = await Notifications.getPermissionsAsync();
    let status = existing;
    if (status !== 'granted') {
      status = (await Notifications.requestPermissionsAsync()).status;
    }
    if (status !== 'granted') return;

    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    const result = await Notifications.getExpoPushTokenAsync({ projectId: projectId });
    const pushToken = result.data;

    const res = await apiFetchChecked('/me/push-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: pushToken }),
    });
    if (res.ok) {
      await SecureStore.setItemAsync(PUSH_TOKEN_KEY, pushToken);
    }
  } catch (e) {
    console.log('push: register failed', e);
  }
}

export async function unregisterPush() {
  try {
    const pushToken = await SecureStore.getItemAsync(PUSH_TOKEN_KEY);
    if (!pushToken) return;

    await apiFetchChecked('/me/push-token', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: pushToken }),
    });
    await SecureStore.deleteItemAsync(PUSH_TOKEN_KEY);
  } catch (e) {
    console.log('push: unregister failed', e);
  }
}

//al tocar una notificación: busca el chat en la lista y lo abre igual que openChat.
export async function openChatFromNotification(chatId: string) {
  try {
    const chats = await apiFetch('/chats'); //la misma ruta que usa (tabs)/index.tsx
    const item = Array.isArray(chats) ? chats.find((c: any) => c.chat_id === chatId) : null;
    if (!item) return;

    router.push({
      pathname: '/chats/[chatID]',
      params: {
        chatID: item.chat_id,
        nickname: item.nickname,
        otherUserID: item.other_user_id,
        blocked: item.blocked ? '1' : '0',
      },
    });
  } catch (e) {
    console.log('push: open chat failed', e);
  }
}