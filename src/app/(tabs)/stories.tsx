import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { apiFetch } from '@/utils/api';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Button, FlatList, Image, Modal, Pressable, StyleSheet, TextInput } from 'react-native';
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
  const [newMediaURL, setNewMediaURL] = useState("");
  const [openGroup, setOpenGroup] = useState<any[] | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  async function fetchStories() {
    const data = await apiFetch("/stories");
    if (data) setStories(data);
  }

  useFocusEffect(
    useCallback(() => {
      fetchStories();
    }, [])
  );

  async function markAsViewed(story: any) {
    await apiFetch("/stories/" + story.story_id + "/view", { method: "POST" });
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

  async function handleCreateStory() {
    if (!newMediaURL.trim()) return;

    await apiFetch("/me/stories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ media_url: newMediaURL, media_type: "image" }),
    });
    setNewMediaURL("");
    fetchStories();
  }
  useEffect(() => {
    if (!openGroup) return;

    const timer = setTimeout(() => {
      handleNextStory();
    }, 5000);

    return () => clearTimeout(timer);
  }, [openGroup, currentIndex]);

  const groupedStories = groupStoriesByUser(stories);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ThemedView style={styles.container}>
        <TextInput
          value={newMediaURL}
          onChangeText={setNewMediaURL}
          placeholder="URL de tu historia..."
          style={{ color: '#ffffff', borderWidth: 1, borderColor: '#555555', padding: 8 }}
        />
        <Button title="Publicar historia" onPress={handleCreateStory} />

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
            onPress={handleNextStory}
          >
            {openGroup && (
              <Image
                source={{ uri: openGroup[currentIndex].media_url }}
                style={{ width: '90%', height: '70%' }}
                resizeMode="contain"
              />
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