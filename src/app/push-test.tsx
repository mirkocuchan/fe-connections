import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { useState } from "react";
import { Pressable, ScrollView, Text } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export default function PushTest() {
  const [token, setToken] = useState("");
  const [log, setLog] = useState("");

  async function getToken() {
    try {
      if (!Device.isDevice) {
        setLog("Tiene que ser un dispositivo físico");
        return;
      }

      const { status: existing } = await Notifications.getPermissionsAsync();
      let status = existing;
      if (existing !== "granted") {
        const res = await Notifications.requestPermissionsAsync();
        status = res.status;
      }
      if (status !== "granted") {
        setLog("Permiso denegado: " + status);
        return;
      }

      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      const t = await Notifications.getExpoPushTokenAsync({ projectId });
      setToken(t.data);
      setLog("OK");
    } catch (e: any) {
      setLog("ERROR: " + (e?.message ?? String(e)));
    }
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 24, paddingTop: 80 }}>
      <Pressable
        onPress={getToken}
        style={{ backgroundColor: "#4f46e5", padding: 14, borderRadius: 8 }}
      >
        <Text style={{ color: "white", textAlign: "center" }}>Pedir token</Text>
      </Pressable>

      <Text selectable style={{ marginTop: 24 }}>
        {token || "(sin token todavía)"}
      </Text>
      <Text style={{ marginTop: 16, color: "gray" }}>{log}</Text>
    </ScrollView>
  );
}