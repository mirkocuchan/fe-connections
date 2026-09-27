import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';

export function chooseImageSource(onImagePicked: (uri: string) => void) {
  Alert.alert(
    "Agregar foto",
    "¿De dónde querés elegir la imagen?",
    [
      { text: "Cámara", onPress: () => takePhoto(onImagePicked) },
      { text: "Galería", onPress: () => pickFromLibrary(onImagePicked) },
      { text: "Cancelar", style: "cancel" },
    ]
  );
}

async function takePhoto(onImagePicked: (uri: string) => void) {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) {
    alert("Necesitamos permiso para usar la cámara");
    return;
  }
  const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
  if (result.canceled) return;
  onImagePicked(result.assets[0].uri);
}

async function pickFromLibrary(onImagePicked: (uri: string) => void) {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    alert("Necesitamos permiso para acceder a tus fotos");
    return;
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 0.7,
  });
  if (result.canceled) return;
  onImagePicked(result.assets[0].uri);
}