import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { API_BASE_URL } from '@/constants/api';
import { formStyles } from '@/constants/form-styles';
import { apiFetch, apiFetchChecked } from '@/utils/api';
import { chooseImageSource } from '@/utils/imagePicker';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useEffect, useState } from 'react';
import { Alert, FlatList, Image, KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function EditProfileScreen() {
  const [bio, setBio] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [photos, setPhotos] = useState<any[]>([]);
  const [displayName, setDisplayName] = useState("");
  const [hobbies, setHobbies] = useState("");
  const [languages, setLanguages] = useState("");
  const [saved, setSaved] = useState(false);

  async function fetchProfile() {
    const data = await apiFetch("/me");
    if (data) {
      setDisplayName(data.display_name || "");
      setBio(data.bio || "");
      setCity(data.city || "");
      setCountry(data.country || "");
      setHobbies(data.hobbies || "");
      setLanguages(data.languages || "");
    }
  }

  async function handleSave() {
    const { ok, data } = await apiFetchChecked("/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        display_name: displayName,
        bio,
        city,
        country,
        hobbies,
        languages,
      }),
    });
    if (!ok) {
      Alert.alert("No se pudo guardar", data?.error || "Intentá de nuevo");
      return;
    }
    setSaved(true);
    setTimeout(() => router.back(), 700); //se ve "Guardado" un instante y vuelve
  }

  async function fetchPhotos() {
    const data = await apiFetch("/me/photos");
    if (data) setPhotos(data);
  }

  async function uploadAndAddPhoto(imageUri: string) {
    const token = await SecureStore.getItemAsync("token");
    const uploadResult = await FileSystem.uploadAsync(
      API_BASE_URL + "/upload",
      imageUri,
      {
        httpMethod: "POST",
        uploadType: FileSystem.FileSystemUploadType.MULTIPART,
        fieldName: "file",
        headers: { Authorization: "Bearer " + token },
      }
    );
    if (uploadResult.status !== 200) {
      Alert.alert("No se pudo subir la foto", "Intentá de nuevo");
      return;
    }
    const uploadData = JSON.parse(uploadResult.body);

    //la posición la decide el servidor
    await apiFetch("/me/photos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ photo_url: uploadData.url }),
    });
    fetchPhotos();
  }

  function handlePhotoOptions(photo: any) {
    if (photos.length <= 1) {
      Alert.alert("No se puede borrar", "Tenés que tener al menos una foto.");
      return;
    }
    Alert.alert("Foto", "¿Qué querés hacer?", [
      { text: "Borrar", style: "destructive", onPress: () => handleDeletePhoto(photo.photo_id) },
      { text: "Cancelar", style: "cancel" },
    ]);
  }

  async function handleDeletePhoto(photoID: string) {
    const { ok, data } = await apiFetchChecked("/me/photos/" + photoID, { method: "DELETE" });
    if (!ok) {
      Alert.alert("No se pudo borrar", data?.error || "Intentá de nuevo");
      return;
    }
    fetchPhotos();
  }

  async function handleReorder(newOrder: any[]) {
    setPhotos(newOrder); //se ve el cambio al instante
    await apiFetch("/me/photos/order", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ photo_ids: newOrder.map((p) => p.photo_id) }),
    });
    fetchPhotos(); //si falló, volvemos al orden del servidor
  }
  async function movePhoto(from: number, to: number) {
    const next = [...photos];
    const [moved] = next.splice(from, 1); //saca la foto de su lugar
    next.splice(to, 0, moved);            //la mete en el nuevo
    await handleReorder(next);            //reutiliza lo que ya tenías
  }

  useEffect(() => {
    fetchProfile();
    fetchPhotos();
  }, []);

    return (
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
          <ThemedView style={styles.header}>
            <Pressable onPress={() => router.back()} hitSlop={12}>
              <Ionicons name="chevron-back" size={26} color="#ffffff" />
            </Pressable>
            <ThemedText style={styles.headerTitle}>Editar perfil</ThemedText>
          </ThemedView>

          <ThemedView style={{ flex: 1 }}>
            <ThemedView style={{ paddingHorizontal: 16, paddingTop: 16 }}>
                <FlatList
                data={photos}
                keyExtractor={(item) => item.photo_id}
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ flexGrow: 0 }}
                renderItem={({ item, index }) => (
                  <Pressable onPress={() => handlePhotoOptions(item)} style={styles.photoWrap}>
                    <Image source={{ uri: item.photo_url }} style={styles.photo} />
                    {index === 0 && (
                      <View style={styles.mainBadge}>
                        <ThemedText style={styles.mainBadgeText}>Principal</ThemedText>
                      </View>
                    )}
                    <View style={styles.arrows}>
                      {index > 0 ? (
                        <Pressable hitSlop={8} style={styles.arrowBtn} onPress={() => movePhoto(index, index - 1)}>
                          <Ionicons name="chevron-back" size={16} color="#fff" />
                        </Pressable>
                      ) : <View />}
                      {index < photos.length - 1 ? (
                        <Pressable hitSlop={8} style={styles.arrowBtn} onPress={() => movePhoto(index, index + 1)}>
                          <Ionicons name="chevron-forward" size={16} color="#fff" />
                        </Pressable>
                      ) : <View />}
                    </View>
                  </Pressable>
                )}
              />
            </ThemedView>

            <ScrollView
              contentContainerStyle={styles.container}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
            >
              <ThemedText style={styles.hint}>
                Tocá una foto para borrarla. Usá las flechas para moverla. La primera es la principal.
              </ThemedText>

              <Pressable style={styles.secondary} onPress={() => chooseImageSource(uploadAndAddPhoto)}>
                <ThemedText style={styles.secondaryText}>Agregar foto</ThemedText>
              </Pressable>

              <TextInput
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="Nombre"
                placeholderTextColor="#888"
                style={formStyles.input}
              />
              <TextInput
                value={bio}
                onChangeText={setBio}
                placeholder="Bio"
                placeholderTextColor="#888"
                multiline
                style={[formStyles.input, styles.bio]}
              />
              <TextInput
                value={city}
                onChangeText={setCity}
                placeholder="Ciudad"
                placeholderTextColor="#888"
                style={formStyles.input}
              />
              <TextInput
                value={country}
                onChangeText={setCountry}
                placeholder="País"
                placeholderTextColor="#888"
                style={formStyles.input}
              />
              <TextInput
                value={hobbies}
                onChangeText={setHobbies}
                placeholder="Hobbies (ej: cine, correr, guitarra)"
                placeholderTextColor="#888"
                style={formStyles.input}
              />
              <TextInput
                value={languages}
                onChangeText={setLanguages}
                placeholder="Idiomas (ej: español, inglés)"
                placeholderTextColor="#888"
                style={formStyles.input}
              />

              <Pressable
                style={[formStyles.button, saved && { backgroundColor: '#34c759' }]}
                onPress={handleSave}
                disabled={saved}
              >
                <ThemedText style={formStyles.buttonText}>{saved ? "Guardado ✓" : "Guardar"}</ThemedText>
              </Pressable>
            </ScrollView>
          </ThemedView>
        </KeyboardAvoidingView>
      </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#333',
  },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  container: { padding: 16, gap: 12 },
  photoWrap: { marginRight: 8 },
  photo: { width: 90, height: 90, borderRadius: 10 },
  mainBadge: {
    position: 'absolute', top: 4, left: 4,
    backgroundColor: '#3c87f7', borderRadius: 6,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  mainBadgeText: { color: '#fff', fontSize: 10, fontWeight: '600' },
  arrows: {
    position: 'absolute', bottom: 4, left: 4, right: 4,
    flexDirection: 'row', justifyContent: 'space-between',
  },
  arrowBtn: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center', justifyContent: 'center',
  },
  hint: { fontSize: 12, opacity: 0.6 },
  secondary: {
    borderWidth: 1,
    borderColor: '#3c87f7',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  secondaryText: { color: '#3c87f7', fontSize: 16, fontWeight: '600' },
  bio: { minHeight: 80, textAlignVertical: 'top' },
});