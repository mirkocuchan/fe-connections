import { EmptyState } from '@/components/empty-state';
import { SkeletonBox } from '@/components/skeleton';
import { StoryViewer } from '@/components/story-viewer';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { API_BASE_URL } from '@/constants/api';
import { Palette } from '@/constants/theme';
import { apiFetch, apiFetchChecked } from '@/utils/api';
import { chooseImageSource } from '@/utils/imagePicker';
import * as FileSystem from 'expo-file-system/legacy';
import { Image } from 'expo-image';
import { useFocusEffect } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Dimensions, FlatList, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

function groupStoriesByUser(stories: any[], myUserID: string) {
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
    //la propia siempre primera
    const aMine = a[0].user_id === myUserID;
    const bMine = b[0].user_id === myUserID;
    if (aMine !== bMine) return aMine ? -1 : 1;
    //después, las que tienen historias sin ver
    const aHasUnviewed = a.some((s: any) => !s.viewed_at);
    const bHasUnviewed = b.some((s: any) => !s.viewed_at);
    if (aHasUnviewed === bHasUnviewed) return 0;
    return aHasUnviewed ? -1 : 1;
  });
  return groups;
}

//para ver las historias de manera distinta, rectangular
const COLUMNS = 3;
const GAP = 8;
const TILE_WIDTH = (Dimensions.get("window").width - GAP * (COLUMNS + 1)) / COLUMNS;
const TILE_HEIGHT = TILE_WIDTH * 1.4; // vertical, como una historia

export default function StoriesScreen() {
  const [stories, setStories] = useState<any[]>([]);
  const [openUserID, setOpenUserID] = useState<string | null>(null);
  const [myUserID, setMyUserID] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function fetchStories() {
    try {
      const data = await apiFetch("/stories");
      if (data) setStories(data);
    } catch {
      //sin conexión: dejamos lo que había
    } finally {
      setLoading(false);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    await fetchStories();
    setRefreshing(false);
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

  //lo que el visor necesita de la pantalla
  async function markAsViewed(story: any) {
    await apiFetch("/stories/" + story.story_id + "/view", { method: "POST" });
  }

  async function handleDeleteStory(story: any) {
    const { ok, data } = await apiFetchChecked("/stories/" + story.story_id, { method: "DELETE" });
    if (!ok) Alert.alert("No se pudo borrar", data?.error || "Intentá de nuevo");
    setOpenUserID(null);
    fetchStories();
  }

  async function handleLoadViewers(story: any) {
    const data = await apiFetch("/stories/" + story.story_id + "/viewers");
    return Array.isArray(data) ? data : [];
  }

  async function handleReply(story: any, content: string) {
    const { ok, data } = await apiFetchChecked("/stories/" + story.story_id + "/reply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    if (!ok) {
      Alert.alert("No se pudo enviar", data?.error || "Intentá de nuevo");
      return false;
    }
    return true;
  }

  function handleCloseViewer() {
    setOpenUserID(null);
    fetchStories(); //para actualizar los aros de "vista"
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
        headers: { Authorization: "Bearer " + token },
      }
    );

    if (uploadResult.status !== 200) {
      Alert.alert("No se pudo subir la imagen", "Intentá de nuevo");
      return;
    }

    const uploadData = JSON.parse(uploadResult.body);
    const { ok, data } = await apiFetchChecked("/me/stories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ media_url: uploadData.url, media_type: "image" }),
    });
    if (!ok) {
      Alert.alert("No se pudo publicar la historia", data?.error || "Intentá de nuevo");
      return;
    }

    fetchStories();
  }

  const groupedStories = groupStoriesByUser(stories, myUserID);
  const openIdx = openUserID ? groupedStories.findIndex((g) => g[0].user_id === openUserID) : -1;
  const openGroup = openIdx >= 0 ? groupedStories[openIdx] : null;

  //al terminar las historias de una persona, pasar a la siguiente
  function handleNextGroup() {
    if (openIdx >= 0 && openIdx + 1 < groupedStories.length) {
      setOpenUserID(groupedStories[openIdx + 1][0].user_id);
    } else {
      handleCloseViewer();
    }
  }
  function handlePrevGroup() {
    if (openIdx > 0) setOpenUserID(groupedStories[openIdx - 1][0].user_id);
  }

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['left', 'right']}>
      <ThemedView style={styles.container}>
        <Pressable
          style={styles.publishButton}
          onPress={() => chooseImageSource(uploadAndCreateStory)}
        >
          <ThemedText style={styles.publishText}>📷 Publicar historia</ThemedText>
        </Pressable>

        <FlatList
          data={groupedStories}
          keyExtractor={(group) => group[0].user_id}
          numColumns={COLUMNS}
          contentContainerStyle={{ padding: GAP, gap: GAP }}
          columnWrapperStyle={{ gap: GAP }}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          renderItem={({ item: group }) => {
            const cover = group[0];
            const hasUnviewed = group.some((s: any) => !s.viewed_at);
            return (
              <Pressable
                onPress={() => setOpenUserID(group[0].user_id)}
                style={[
                  styles.tile,
                  {
                    borderWidth: hasUnviewed ? 3 : 1,
                    borderColor: hasUnviewed ? Palette.storyRing : Palette.outline,
                  },
                ]}
              >
                <Image
                  source={cover.media_url}
                  style={StyleSheet.absoluteFill}
                  contentFit="cover"
                  cachePolicy="memory-disk"
                />
                {group.length > 1 && (
                  <ThemedText style={styles.count}>{group.length}</ThemedText>
                )}
                <ThemedText style={styles.tileName} numberOfLines={1}>
                  {cover.user_id === myUserID ? "Tu historia" : cover.username}
                </ThemedText>
              </Pressable>
            );
          }}
          ListEmptyComponent={
            loading ? (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: GAP }}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <SkeletonBox key={i} style={{ width: TILE_WIDTH, height: TILE_HEIGHT, borderRadius: 12 }} />
                ))}
              </View>
            ) : (
              <EmptyState
                icon="images-outline"
                title="Todavía no hay historias"
                text="Las historias desaparecen solas con el tiempo. Publicá la primera."
              />
            )
          }
        />

        {openGroup && (
          <StoryViewer
            group={openGroup}
            myUserID={myUserID}
            onClose={handleCloseViewer}
            onNextGroup={handleNextGroup}
            onPrevGroup={handlePrevGroup}
            onView={markAsViewed}
            onDelete={handleDeleteStory}
            onLoadViewers={handleLoadViewers}
            onReply={handleReply}
          />
        )}
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  publishButton: {
    backgroundColor: Palette.primary,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginHorizontal: 8,
    marginTop: 8,
  },
  publishText: { color: Palette.onPrimary, fontSize: 16, fontWeight: '600' },
  tile: {
    width: TILE_WIDTH,
    height: TILE_HEIGHT,
    borderRadius: 12,
    overflow: 'hidden',   // para que la imagen respete las esquinas redondeadas
    backgroundColor: Palette.surfaceAlt,
    justifyContent: 'flex-end',
  },
  tileName: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  count: {
    position: 'absolute',
    top: 6,
    right: 6,
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
    overflow: 'hidden',
  },
});