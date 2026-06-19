import { useEffect } from "react";
import { Pressable, Text } from "react-native";
import { Tabs, useRouter } from "expo-router";
import { registerForPushNotifications } from "@/lib/push";
import { useSession } from "@/lib/session";
import { colors } from "@/lib/theme";

function TabLabel({ label, focused }: { label: string; focused: boolean }) {
  return (
    <Text
      style={{
        color: focused ? colors.volt : colors.textDim,
        fontSize: 11,
        fontWeight: focused ? "700" : "500",
      }}
    >
      {label}
    </Text>
  );
}

export default function AppTabs() {
  const router = useRouter();
  const { session } = useSession();

  // Ask for push permission + store the device token once signed in.
  useEffect(() => {
    if (session) registerForPushNotifications().catch(() => {});
  }, [session]);

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        sceneStyle: { backgroundColor: colors.bg },
        tabBarStyle: {
          backgroundColor: colors.bg,
          borderTopColor: colors.border,
        },
        tabBarShowLabel: true,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Stack",
          tabBarIcon: ({ focused }) => <TabLabel label="Home" focused={focused} />,
          tabBarLabel: () => null,
          headerRight: () => (
            <Pressable
              onPress={() => router.push("/checkin")}
              style={{
                marginRight: 16,
                backgroundColor: colors.volt,
                paddingHorizontal: 14,
                paddingVertical: 7,
                borderRadius: 999,
              }}
            >
              <Text style={{ color: colors.bg, fontWeight: "700" }}>+ Check in</Text>
            </Pressable>
          ),
        }}
      />
      <Tabs.Screen
        name="groups"
        options={{
          title: "Groups",
          tabBarIcon: ({ focused }) => <TabLabel label="Groups" focused={focused} />,
          tabBarLabel: () => null,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ focused }) => <TabLabel label="Profile" focused={focused} />,
          tabBarLabel: () => null,
        }}
      />
    </Tabs>
  );
}
