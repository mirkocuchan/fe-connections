import { ScreenHeader } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { apiFetch } from '@/utils/api';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Dimensions, FlatList, Image, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const PHOTO_W = Dimensions.get("window").width - 32;
const PHOTO_STEP = PHOTO_W + 8;

export default function PublicProfileScreen() {
  const { userID } = useLocalSearchParams();
  const [profile, setProfile] = useState<any>(null);
  const [photoIndex, setPhotoIndex] = useState(0);

  useEffect(() => {
    async function fetchProfile() {
      const data = await apiFetch("/users/" + userID + "/profile");
      if (data) setProfile(data);
    }
    fetchProfile();
  }, []);

  const photos: string[] = profile?.photos ?? [];

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScreenHeader title="Perfil" />
      <ThemedView style={styles.container}>
        {profile && (
          <>
            <FlatList
              data={photos}
              keyExtractor={(item, index) => index.toString()}
              horizontal
              snapToInterval={PHOTO_STEP}
              decelerationRate="fast"
              showsHorizontalScrollIndicator={false}
              style={{ flexGrow: 0 }}
              contentContainerStyle={{ gap: 8 }}
              onMomentumScrollEnd={(e) =>
                setPhotoIndex(Math.round(e.nativeEvent.contentOffset.x / PHOTO_STEP))
              }
              renderItem={({ item }) => (
                <Image source={{ uri: item }} style={styles.photo} />
              )}
            />
            {photos.length > 1 && (
              <ThemedView style={styles.dots}>
                {photos.map((_, i) => (
                  <ThemedView key={i} style={[styles.dot, i === photoIndex && styles.dotActive]} />
                ))}
              </ThemedView>
            )}

            <ThemedText style={styles.name}>{profile.username}</ThemedText>
            <ThemedText style={profile.bio ? styles.bio : styles.empty}>
              {profile.bio || "Sin bio todavía"}
            </ThemedText>
          </>
        )}
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12 },
  photo: { width: PHOTO_W, height: PHOTO_W * 1.1, borderRadius: 16 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#555' },
  dotActive: { backgroundColor: '#fff' },
  name: { fontSize: 28, lineHeight: 34, fontWeight: '700' },
  bio: { fontSize: 16 },
  empty: { opacity: 0.5 },
});