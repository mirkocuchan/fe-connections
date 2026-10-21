import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { Colors } from '@/constants/theme';
import { Notifications } from '@/utils/notifications';
import { getActiveChat, openChatFromNotification, registerForPush } from '@/utils/push';
import { connectSocket } from '@/utils/socket';
import { DarkTheme, Redirect, Stack, ThemeProvider } from 'expo-router';
import * as SecureStore from "expo-secure-store";
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useRef, useState } from 'react';
import { Appearance, useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

Appearance.setColorScheme('dark');
SplashScreen.preventAutoHideAsync();

const AppTheme = {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, background: Colors.dark.background },
};

Notifications?.setNotificationHandler({
  handleNotification: async (notification) => {
    const chatId = notification.request.content.data?.chat_id;
    const sameChat = typeof chatId === 'string' && chatId === getActiveChat();
    return {
      shouldShowBanner: !sameChat,
      shouldShowList: !sameChat,
      shouldPlaySound: false,
      shouldSetBadge: false,
    };
  },
});
//mostrar, salvo que sea del chat que tengo abierto

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const lastResponse = Notifications ? Notifications.useLastNotificationResponse() : null;
  const handledId = useRef<string | null>(null);

  useEffect(() => {
    async function checkToken() {
      const storedToken = await SecureStore.getItemAsync("token");
      setToken(storedToken);
      if (storedToken) {
        registerForPush();
        connectSocket();
      }
      setIsLoading(false);
    }
    checkToken();
  }, []);

  //cuando el usuario toca una notificación (app abierta, en segundo plano o cerrada)
  useEffect(() => {
    if (!Notifications || isLoading || !lastResponse) return;
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
      <ThemeProvider value={AppTheme}>
        <AnimatedSplashOverlay />
        {!token && <Redirect href="/login" />}
        <Stack screenOptions={{ headerShown: false }} />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}