import { Platform } from "react-native";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { supabase } from "@/lib/supabase";

/**
 * Native push registration. On iOS this provisions an APNs token; on Android an
 * FCM token. expo-notifications wraps both behind a single Expo push token
 * ("ExponentPushToken[...]") which we store in `device_push_tokens` so the
 * server can notify this device via the Expo Push API.
 *
 * NOTE: push only works on a physical device in a *built* app (dev client or
 * store build) — not in the iOS simulator and not in Expo Go on SDK 53+.
 */

// Foreground presentation: show banner + play sound even when the app is open.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) return null; // simulators can't get a token

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Stack",
      importance: Notifications.AndroidImportance.HIGH,
      lightColor: "#C6F806",
    });
  }

  const existing = await Notifications.getPermissionsAsync();
  let status = existing.status;
  if (status !== "granted") {
    const req = await Notifications.requestPermissionsAsync();
    status = req.status;
  }
  if (status !== "granted") return null;

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId;
  if (!projectId) return null;

  const tokenResponse = await Notifications.getExpoPushTokenAsync({ projectId });
  const token = tokenResponse.data;

  // Persist against the signed-in user (RLS scopes the row to them).
  const { data } = await supabase.auth.getUser();
  if (data.user && token) {
    await supabase.from("device_push_tokens").upsert(
      {
        user_id: data.user.id,
        token,
        platform: Platform.OS,
        last_seen: new Date().toISOString(),
      },
      { onConflict: "token" },
    );
  }

  return token;
}
