import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { API_BASE_URL } from '@/constants/api';
import { apiFetch } from '@/utils/api';
import { chooseImageSource } from '@/utils/imagePicker';
import * as FileSystem from 'expo-file-system/legacy';
import { useFocusEffect } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Button, FlatList, Image, Modal, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';


function groupStoriesByUser(stories: any[]) {
  const grouped: { [userID: string]: any[] } = {};
  
  for (const story of stories) {
    if (!grouped[story.user_id]) {
      grouped[story.user_id] = [];
    }
    grouped[story.user_id].push(story);
  }
  const groups = Object.values(grouped);
  
  for (const group of groups) {
    group.reverse();
  }

  groups.sort((a, b) => {
    const aHasUnviewed = a.some((s: any) => !s.viewed_at);
    const bHasUnviewed = b.some((s: any) => !s.viewed_at);
    if (aHasUnviewed === bHasUnviewed) return 0;
    return aHasUnviewed ? -1 : 1;
  });
  return groups;
}

export default function StoriesScreen() {
  const [stories, setStories] = useState<any[]>([]);
  const [openGroup, setOpenGroup] = useState<any[] | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [myUserID, setMyUserID] = useState("");
  const [viewers, setViewers] = useState<any[]>([]);
  const [showViewers, setShowViewers] = useState(false);

  async function fetchStories() {
    const data = await apiFetch("/stories");
    if (data) setStories(data);
  }
  
  useFocusEffect(
    useCallback(() => {
      fetchStories();
    }, [])
  );
  useEffect(() => {
    async function loadMyID() {
      const id = await SecureStore.getItemAsync("my_user_id");
      setMyUserID(id || "");
    }
    loadMyID();
  }, []);

  async function markAsViewed(story: any) {
    await apiFetch("/stories/" + story.story_id + "/view", { method: "POST" });
  }
  async function handleDeleteStory() {
    if (!openGroup) return;
    const story = openGroup[currentIndex];
    await apiFetch("/stories/" + story.story_id, { method: "DELETE" });
    setOpenGroup(null);
    fetchStories();
  }
  function handleOpenGroup(group: any[]) {
    setOpenGroup(group);
    setCurrentIndex(0);
    markAsViewed(group[0]);
  }

  function handleNextStory() {
    if (!openGroup) return;
    if (currentIndex + 1 < openGroup.length) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      markAsViewed(openGroup[nextIndex]);
    } else {
      setOpenGroup(null);
      fetchStories();
    }
  }
  
  async function uploadAndCreateStory(imageUri: string) {
    const token = await SecureStore.getItemAsync("token");

    const uploadResult = await FileSystem.uploadAsync(
      API_BASE_URL + "/upload",
      imageUri,
      {
        httpMethod: "POST",
        uploadType: FileSystem.FileSystemUploadType.MULTIPART,
        fieldName: "file",
        headers: {
          Authorization: "Bearer " + token,
        },
      }
    );

    const uploadData = JSON.parse(uploadResult.body);

    await apiFetch("/me/stories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ media_url: uploadData.url, media_type: "image" }),
    });

    fetchStories();
  }
  async function handleShowViewers() {
    if (!openGroup) return;
    const story = openGroup[currentIndex];
    const data = await apiFetch("/stories/" + story.story_id + "/viewers");
    setViewers(Array.isArray(data) ? data : []);
    setShowViewers(true);
  }
  useEffect(() => {
    if (!openGroup || showViewers) return;

    const timer = setTimeout(() => {
      handleNextStory();
    }, 5000);

    return () => clearTimeout(timer);
  }, [openGroup, currentIndex, showViewers]);

  const groupedStories = groupStoriesByUser(stories);
  function handleStoryOptions() {
    Alert.alert(
      "Opciones",
      "¿Qué querés hacer con esta historia?",
      [
        { text: "Ver quién la vio", onPress: handleShowViewers },
        { text: "Borrar", onPress: confirmDeleteStory, style: "destructive" },
        { text: "Cancelar", style: "cancel" },
      ]
    );
  }

  function confirmDeleteStory() {
    Alert.alert(
      "Confirmar",
      "¿Realmente deseás borrar esta historia?",
      [
        { text: "Sí, borrar", onPress: handleDeleteStory, style: "destructive" },
        { text: "No", style: "cancel" },
      ]
    );
  }
  
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ThemedView style={styles.container}>
        <Button title="📷 Publicar historia" onPress={() => chooseImageSource(uploadAndCreateStory)} />

        <FlatList
          data={groupedStories}
          keyExtractor={(group) => group[0].user_id}
          horizontal
          style={{ maxHeight: 100 }}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item: group }) => {
            const cover = group[0];
            const hasUnviewed = group.some((s: any) => !s.viewed_at);
            return (
              <Pressable
                onPress={() => handleOpenGroup(group)}
                style={{ alignItems: 'center', justifyContent: 'flex-start', marginHorizontal: 6, width: 70, height: 90 }}
              >
                <Image
                  source={{ uri: cover.media_url }}
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: 30,
                    borderWidth: hasUnviewed ? 3 : 1,
                    borderColor: hasUnviewed ? '#ff5c5c' : '#555',
                  }}
                />
                <ThemedText style={{ fontSize: 10 }}>{cover.username}</ThemedText>
              </Pressable>
            );
          }}
          ListEmptyComponent={
            <ThemedText>No hay historias activas todavía.</ThemedText>
          }
        />

        <Modal visible={!!openGroup} transparent={true} onRequestClose={() => setOpenGroup(null)}>
          <Pressable
            style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' }}
            onPress={() => (showViewers ? setShowViewers(false) : handleNextStory())}
          >
            {openGroup && (
              <>
                <Image
                  source={{ uri: openGroup[currentIndex].media_url }}
                  style={{ width: '90%', height: '70%' }}
                  resizeMode="contain"
                />
                {openGroup[currentIndex].user_id === myUserID && (
                  <Pressable
                    onPress={handleStoryOptions}
                    style={{ position: 'absolute', top: 50, right: 20, padding: 10 }}
                  >
                    <ThemedText style={{ fontSize: 24, color: 'white' }}>⋮</ThemedText>
                  </Pressable>
                )}
                {showViewers && (
                  <Pressable
                    onPress={() => {}}
                    style={{
                      position: 'absolute', left: 0, right: 0, bottom: 0,
                      maxHeight: '50%', backgroundColor: '#1c1c1e',
                      borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 16,
                    }}
                  >
                  <ThemedText type="subtitle">Vistas ({viewers.length})</ThemedText>
                  <FlatList
                    data={viewers}
                    keyExtractor={(item) => item.viewer_id}
                    renderItem={({ item }) => (
                      <ThemedText style={{ paddingVertical: 6 }}>
                        {item.username} · {new Date(item.viewed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </ThemedText>
                    )}
                    ListEmptyComponent={<ThemedText>Todavía nadie la vio.</ThemedText>}
                  />
                </Pressable>
                )}
              </>  
            )}
          </Pressable>
        </Modal>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});