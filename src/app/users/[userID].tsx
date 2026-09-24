import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { apiFetch } from '@/utils/api';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, Image, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';


export default function PublicProfileScreen() {
  const { userID } = useLocalSearchParams();
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    async function fetchProfile() {
      const data = await apiFetch("/users/" + userID + "/profile");
      if (data) setProfile(data);
    }
    fetchProfile();
  }, []);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ThemedView style={styles.container}>
        {profile && (
          <>
            <ThemedText type="title">{profile.username}</ThemedText>
            <ThemedText>{profile.bio}</ThemedText>
            <FlatList
              data={profile.photos}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item }) => (
                <Image source={{ uri: item }} style={{ width: 200, height: 200 }} />
              )}
            />
          </>
        )}
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});