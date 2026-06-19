import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Button } from "@/components/Button";
import { Avatar, StreakBadge } from "@/components/ui";
import { getGroupHome, getMyGroups, type FeedCheckin } from "@/lib/data";
import { useSession } from "@/lib/session";
import { computePersonalStreak } from "@/lib/streaks";
import { supabase } from "@/lib/supabase";
import { colors, radius, space, type } from "@/lib/theme";

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function Home() {
  const { session } = useSession();
  const router = useRouter();
  const userId = session?.user.id ?? "";

  const [groupId, setGroupId] = useState<string | null>(null);
  const [groupName, setGroupName] = useState<string>("");
  const [hasGroups, setHasGroups] = useState<boolean | null>(null);
  const [feed, setFeed] = useState<FeedCheckin[]>([]);
  const [personalDates, setPersonalDates] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!userId) return;
    const groups = await getMyGroups(userId);
    setHasGroups(groups.length > 0);
    if (groups.length === 0) {
      setLoading(false);
      return;
    }
    const active = groups[0];
    setGroupId(active.id);
    setGroupName(active.name);
    const home = await getGroupHome(active.id, userId);
    setFeed(home.feed);
    setPersonalDates(home.personalDates);
    setLoading(false);
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  // Realtime: new check-ins in the active group slide in live.
  useEffect(() => {
    if (!groupId) return;
    const channel = supabase
      .channel(`checkins:${groupId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "checkins", filter: `group_id=eq.${groupId}` },
        () => load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId, load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  // Rest-day bridging (the optional 3rd arg) is a follow-up; the base personal
  // streak matches the web app's default behavior.
  const streak = computePersonalStreak(personalDates, new Date());

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.volt} />
      </View>
    );
  }

  if (hasGroups === false) {
    return (
      <View style={[styles.center, { padding: 24, gap: 16 }]}>
        <Text style={styles.emptyTitle}>No crew yet</Text>
        <Text style={styles.emptyBody}>
          Stack works with a small private group. Create one or join with an
          invite code to start your streak.
        </Text>
        <Button label="Go to Groups" onPress={() => router.push("/(app)/groups")} />
      </View>
    );
  }

  return (
    <FlatList
      data={feed}
      keyExtractor={(item) => item.id}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.volt} />
      }
      contentContainerStyle={{ padding: 16, gap: 16 }}
      ListHeaderComponent={
        <View style={{ gap: 12, marginBottom: 4 }}>
          <Text style={styles.groupName}>{groupName}</Text>
          <StreakBadge count={streak.count} state={streak.state} />
        </View>
      }
      ListEmptyComponent={
        <Text style={styles.emptyBody}>
          No check-ins yet. Be the first — tap “Check in”.
        </Text>
      }
      renderItem={({ item }) => (
        <View style={styles.post}>
          <View style={styles.postHead}>
            <Avatar url={item.avatarUrl} name={item.name} size={36} />
            <View style={{ flex: 1 }}>
              <Text style={styles.postName}>{item.name}</Text>
              <Text style={styles.postMeta}>
                {item.sport ? `${item.sport} · ` : ""}
                {timeAgo(item.created_at)}
              </Text>
            </View>
          </View>
          {item.photoUrl ? (
            <Image source={{ uri: item.photoUrl }} style={styles.photo} resizeMode="cover" />
          ) : null}
          {item.note ? <Text style={styles.note}>{item.note}</Text> : null}
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg },
  groupName: { ...type.h2, color: colors.text },
  emptyTitle: { ...type.h1, color: colors.text, textAlign: "center" },
  emptyBody: { ...type.body, color: colors.textMuted, textAlign: "center" },
  post: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  postHead: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12 },
  postName: { ...type.label, color: colors.text, fontWeight: "600" },
  postMeta: { ...type.caption, color: colors.textDim },
  photo: { width: "100%", aspectRatio: 9 / 16, backgroundColor: colors.surface2 },
  note: { ...type.body, color: colors.text, padding: space(3) },
});
