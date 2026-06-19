import { useCallback, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { Button } from "@/components/Button";
import { Avatar, Card, StreakBadge } from "@/components/ui";
import { useSession } from "@/lib/session";
import { computeLongestStreak, computePersonalStreak } from "@/lib/streaks";
import { supabase } from "@/lib/supabase";
import { colors, type } from "@/lib/theme";

export default function Profile() {
  const { session, profile, signOut } = useSession();
  const userId = session?.user.id ?? "";
  const [dates, setDates] = useState<string[]>([]);

  const load = useCallback(async () => {
    if (!userId) return;
    const { data } = await supabase
      .from("checkins")
      .select("created_at")
      .eq("user_id", userId)
      .limit(800);
    setDates((data ?? []).map((r) => r.created_at as string));
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const streak = computePersonalStreak(dates, new Date());
  const longest = computeLongestStreak(dates);
  const name =
    profile?.display_name?.trim() ||
    (profile?.username ? `@${profile.username}` : session?.user.email) ||
    "You";

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
      <View style={{ alignItems: "center", gap: 12, paddingVertical: 12 }}>
        <Avatar url={profile?.avatar_url ?? null} name={name} size={84} />
        <Text style={styles.name}>{name}</Text>
        {profile?.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}
      </View>

      <View style={{ alignItems: "center" }}>
        <StreakBadge count={streak.count} state={streak.state} />
      </View>

      <View style={styles.stats}>
        <Card style={styles.statCard}>
          <Text style={styles.statNum}>{dates.length}</Text>
          <Text style={styles.statLabel}>Check-ins</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={styles.statNum}>{longest}</Text>
          <Text style={styles.statLabel}>Longest streak</Text>
        </Card>
      </View>

      <View style={{ height: 12 }} />
      <Button label="Sign out" variant="secondary" onPress={signOut} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  name: { ...type.h2, color: colors.text },
  bio: { ...type.body, color: colors.textMuted, textAlign: "center" },
  stats: { flexDirection: "row", gap: 12 },
  statCard: { flex: 1, alignItems: "center", gap: 4 },
  statNum: { fontSize: 28, fontWeight: "800", color: colors.text, fontVariant: ["tabular-nums"] },
  statLabel: { ...type.caption, color: colors.textMuted },
});
