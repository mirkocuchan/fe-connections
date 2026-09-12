import { DarkTheme, DefaultTheme, Redirect, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import * as SecureStore from "expo-secure-store";
import { useEffect, useState } from 'react';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkToken() {
      const storedToken = await SecureStore.getItemAsync("token");
      setToken(storedToken);
      setIsLoading(false);
    }
    checkToken();
  }, []);
  if (isLoading) {
    return null; 
  }
  return (
    
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      {!token && <Redirect href="/login" />}
      <Stack screenOptions={{ headerShown: false }} />
    </ThemeProvider>
  );
}