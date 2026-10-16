import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function TermsScreen() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ThemedView style={{ flex: 1, padding: 16 }}>
        <ScrollView>
          <ThemedText type="title">Términos y condiciones</ThemedText>
          <ThemedText>Texto pendiente de redacción.</ThemedText>
        </ScrollView>
      </ThemedView>
    </SafeAreaView>
  );
}