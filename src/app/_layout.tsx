import * as Notifications from 'expo-notifications';
import { DarkTheme, DefaultTheme, Redirect, Stack, ThemeProvider } from 'expo-router';
import * as SecureStore from "expo-secure-store";
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useRef, useState } from 'react';
import { useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { openChatFromNotification, registerForPush } from '@/utils/push';

SplashScreen.preventAutoHideAsync();

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const lastResponse = Notifications.useLastNotificationResponse();
  const handledId = useRef<string | null>(null);

  useEffect(() => {
    async function checkToken() {
      const storedToken = await SecureStore.getItemAsync("token");
      setToken(storedToken);
      if (storedToken) registerForPush();
      setIsLoading(false);
    }
    checkToken();
  }, []);

  //Cuando el usuario toca una notificación (app abierta, en segundo plano o cerrada)
  useEffect(() => {
    if (isLoading || !lastResponse) return;
    if (lastResponse.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) return;

    const id = lastResponse.notification.request.identifier;
    if (handledId.current === id) return; //no procesar la misma dos veces
    handledId.current = id;

    const chatId = lastResponse.notification.request.content.data?.chat_id;
    if (typeof chatId === 'string') openChatFromNotification(chatId);
  }, [lastResponse, isLoading]);

  if (isLoading) {
    return null;
  }
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <AnimatedSplashOverlay />
        {!token && <Redirect href="/login" />}
        <Stack screenOptions={{ headerShown: false }} />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}