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
import { Alert, Image, KeyboardAvoidingView, Pressable, StyleSheet, TextInput } from 'react-native';
import DraggableFlatList, { ScaleDecorator } from 'react-native-draggable-flatlist';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function EditProfileScreen() {
  const [bio, setBio] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [photos, setPhotos] = useState<any[]>([]);

  async function fetchProfile() {
    const data = await apiFetch("/me");
    if (data) {
      setBio(data.bio || "");
      setCity(data.city || "");
      setCountry(data.country || "");
    }
  }

  async function handleSave() {
    const { ok, data } = await apiFetchChecked("/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bio, city, country }),
    });
    if (!ok) {
      Alert.alert("No se pudo guardar", data?.error || "Intentá de nuevo");
      return;
    }
    router.back();
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

        <ThemedView style={styles.container}>
          <DraggableFlatList
            data={photos}
            keyExtractor={(item) => item.photo_id}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ flexGrow: 0 }}
            containerStyle={{ flexGrow: 0 }}
            onDragEnd={({ data }) => handleReorder(data)}
            renderItem={({ item, drag, isActive }) => (
              <ScaleDecorator>
                <Pressable
                  onPress={() => handlePhotoOptions(item)}
                  onLongPress={drag}
                  disabled={isActive}
                >
                  <Image source={{ uri: item.photo_url }} style={styles.photo} />
                </Pressable>
              </ScaleDecorator>
            )}
          />
          <ThemedText style={styles.hint}>
            Tocá una foto para borrarla. Mantenela apretada para reordenar. La primera es la principal.
          </ThemedText>

          <Pressable style={styles.secondary} onPress={() => chooseImageSource(uploadAndAddPhoto)}>
            <ThemedText style={styles.secondaryText}>Agregar foto</ThemedText>
          </Pressable>

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

          <Pressable style={formStyles.button} onPress={handleSave}>
            <ThemedText style={formStyles.buttonText}>Guardar</ThemedText>
          </Pressable>
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
  container: { flex: 1, padding: 16, gap: 12 },
  photo: { width: 90, height: 90, borderRadius: 10, marginRight: 8 },
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