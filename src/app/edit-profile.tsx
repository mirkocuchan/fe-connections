import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { API_BASE_URL } from '@/constants/api';
import { apiFetch, apiFetchChecked } from '@/utils/api';
import { chooseImageSource } from '@/utils/imagePicker';
import * as FileSystem from 'expo-file-system/legacy';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useEffect, useState } from 'react';
import { Alert, Button, Image, Pressable, StyleSheet, TextInput } from 'react-native';
import DraggableFlatList, { ScaleDecorator } from 'react-native-draggable-flatlist';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function EditProfileScreen() {
  const [bio, setBio] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");

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

  const [photos, setPhotos] = useState<any[]>([]);

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
    const uploadData = JSON.parse(uploadResult.body);

    await apiFetch("/me/photos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ photo_url: uploadData.url, position: photos.length }),
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
    setPhotos(newOrder); // se ve el cambio al instante
    const result = await apiFetch("/me/photos/order", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photo_ids: newOrder.map((p) => p.photo_id) }),
    });
    fetchPhotos(); // si falló, volvemos al orden del servidor
  }

  useEffect(() => {
    fetchProfile();
    fetchPhotos()
  }, []);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ThemedView style={styles.container}>
        <DraggableFlatList
          data={photos}
          keyExtractor={(item) => item.photo_id}
          horizontal
          style={{ maxHeight: 110 }}
          onDragEnd={({ data }) => handleReorder(data)}
          renderItem={({ item, drag, isActive }) => (
            <ScaleDecorator>
              <Pressable 
                onPress={() => handlePhotoOptions(item)}
                onLongPress={drag}
                disabled={isActive}
              >
                <Image source={{ uri: item.photo_url }}
                  style={{ width: 80, height: 80, borderRadius: 8, marginHorizontal: 4 }} />
              </Pressable>
            </ScaleDecorator>
          )}
        />
        <Button title="Agregar foto" onPress={() => chooseImageSource(uploadAndAddPhoto)} />

        <TextInput value={bio} onChangeText={setBio} placeholder="Bio"
          style={styles.input} />
        <TextInput value={city} onChangeText={setCity} placeholder="Ciudad"
          style={styles.input} />
        <TextInput value={country} onChangeText={setCountry} placeholder="País"
          style={styles.input} />
        <Button title="Guardar" onPress={handleSave} />

        <ThemedText type="subtitle">Usuarios bloqueados</ThemedText>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 8 },
  input: { color: '#ffffff', borderWidth: 1, borderColor: '#555555', padding: 8 },
});