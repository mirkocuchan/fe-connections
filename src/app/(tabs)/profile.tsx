import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { apiFetch } from '@/utils/api';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Dimensions, FlatList, Image, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const PHOTO_W = Dimensions.get("window").width - 32;
const PHOTO_STEP = PHOTO_W + 8;

export default function ProfileScreen() {
  const [profile, setProfile] = useState<any>(null);
  const [photos, setPhotos] = useState<any[]>([]);
  const [photoIndex, setPhotoIndex] = useState(0);

  useFocusEffect(
    useCallback(() => {
      async function fetchProfile() {
        const data = await apiFetch("/me");
        if (data) setProfile(data);
      }
      fetchProfile();
      fetchPhotos();
    }, [])
  );

  async function fetchPhotos() {
    const data = await apiFetch("/me/photos");
    if (data) setPhotos(data);
  }

  const location = profile
    ? [profile.city, profile.country].filter(Boolean).join(", ")
    : "";

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['left', 'right']}>
      <ThemedView style={styles.container}>
        {profile && (
          <>
            <FlatList
              data={photos}
              keyExtractor={(item) => item.photo_id}
              horizontal
              snapToInterval={PHOTO_STEP}
              decelerationRate="fast"
              showsHorizontalScrollIndicator={false}
              style={styles.photos}
              contentContainerStyle={{ gap: 8 }}
              onMomentumScrollEnd={(e) =>
                setPhotoIndex(Math.round(e.nativeEvent.contentOffset.x / PHOTO_STEP))
              }
              renderItem={({ item }) => (
                <Image source={{ uri: item.photo_url }} style={styles.photo} />
              )}
            />
            {photos.length > 1 && (
              <ThemedView style={styles.dots}>
                {photos.map((p, i) => (
                  <ThemedView
                    key={p.photo_id}
                    style={[styles.dot, i === photoIndex && styles.dotActive]}
                  />
                ))}
              </ThemedView>
            )}

            <ThemedView style={styles.nameRow}>
              <ThemedText style={styles.name} numberOfLines={1}>
                {profile.username}
              </ThemedText>
              <Pressable onPress={() => router.push("/settings")} hitSlop={10}>
                <Ionicons name="settings-outline" size={26} color="#ffffff" />
              </Pressable>
            </ThemedView>

            <ThemedText style={profile.bio ? styles.bio : styles.empty}>
              {profile.bio || "Sin bio todavía"}
            </ThemedText>

            <ThemedView style={styles.locationRow}>
              <Ionicons name="location-outline" size={16} color="#888" />
              <ThemedText style={location ? styles.location : styles.empty}>
                {location || "Sin ubicación"}
              </ThemedText>
            </ThemedView>
          </>
        )}

        <Pressable style={styles.button} onPress={() => router.push("/edit-profile")}>
          <ThemedText style={styles.buttonText}>Editar perfil</ThemedText>
        </Pressable>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12 },
  photos: { flexGrow: 0 },
  photo: { width: PHOTO_W, height: PHOTO_W * 1.1, borderRadius: 16 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#555' },
  dotActive: { backgroundColor: '#fff' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 4 },
  name: { flex: 1, fontSize: 28, lineHeight: 34, fontWeight: '700' },
  bio: { fontSize: 16 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  location: { fontSize: 15, opacity: 0.8 },
  empty: { opacity: 0.5 },
  button: {
    backgroundColor: '#3c87f7',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});