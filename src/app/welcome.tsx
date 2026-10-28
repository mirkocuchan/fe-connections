import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { formStyles } from '@/constants/form-styles';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useRef, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const PAGES = [
  {
    icon: 'eye-off-outline',
    title: 'Primero la persona, después la cara',
    text: 'Acá chateás de forma anónima. Nadie ve tu nombre ni tus fotos hasta que vos decidas mostrarlos.',
  },
  {
    icon: 'albums-outline',
    title: 'Tu ficha, a tu ritmo',
    text: 'Cada chat tiene una ficha con tu nombre, fotos, bio y más. Vos elegís qué revelar y cuándo. Lo que revelás no se puede volver a ocultar, así que tomate tu tiempo.',
  },
  {
    icon: 'shield-checkmark-outline',
    title: 'Un lugar para charlar tranquilo',
    text: 'Es solo para mayores de 18. Podés reportar o bloquear a cualquiera. Si algo te incomoda, cortá la charla.',
  },
] as const;

export default function WelcomeScreen() {
  const { width } = useWindowDimensions();
  const listRef = useRef<FlatList>(null);
  const [index, setIndex] = useState(0);
  const isLast = index === PAGES.length - 1;

  async function finish() {
    const userID = await SecureStore.getItemAsync("my_user_id");
    if (userID) await SecureStore.setItemAsync("welcome_seen_" + userID, "1");
    router.replace("/(tabs)");
  }

  function next() {
    if (isLast) {
      finish();
      return;
    }
    listRef.current?.scrollToIndex({ index: index + 1 });
    setIndex(index + 1);
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ThemedView style={styles.container}>
        <View style={styles.top}>
          {!isLast && (
            <Pressable onPress={finish} hitSlop={12}>
              <ThemedText style={styles.skip}>Saltar</ThemedText>
            </Pressable>
          )}
        </View>

        <FlatList
          ref={listRef}
          data={PAGES}
          keyExtractor={(page) => page.title}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
          onMomentumScrollEnd={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
          renderItem={({ item }) => (
            <View style={[styles.page, { width }]}>
              <View style={styles.iconCircle}>
                <Ionicons name={item.icon} size={64} color="#3c87f7" />
              </View>
              <ThemedText style={styles.title}>{item.title}</ThemedText>
              <ThemedText style={styles.text}>{item.text}</ThemedText>
            </View>
          )}
        />

        <View style={styles.dots}>
          {PAGES.map((_, i) => (
            <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
          ))}
        </View>

        <View style={styles.bottom}>
          <Pressable style={formStyles.button} onPress={next}>
            <ThemedText style={formStyles.buttonText}>{isLast ? "Empezar" : "Siguiente"}</ThemedText>
          </Pressable>
        </View>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  top: { height: 44, alignItems: 'flex-end', justifyContent: 'center', paddingHorizontal: 20 },
  skip: { fontSize: 16, opacity: 0.7 },
  page: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 16 },
  iconCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(60,135,247,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: { fontSize: 24, fontWeight: '700', textAlign: 'center' },
  text: { fontSize: 16, textAlign: 'center', opacity: 0.75, lineHeight: 24 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8, paddingVertical: 16 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#444' },
  dotActive: { backgroundColor: '#3c87f7', width: 22 },
  bottom: { paddingHorizontal: 24, paddingBottom: 16 },
});