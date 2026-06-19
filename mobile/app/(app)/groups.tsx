import { useCallback, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { Button } from "@/components/Button";
import { Card, Field } from "@/components/ui";
import { getMyGroups, joinGroupByCode } from "@/lib/data";
import { generateInviteCode } from "@/lib/invite";
import { useSession } from "@/lib/session";
import { supabase } from "@/lib/supabase";
import { colors, type } from "@/lib/theme";
import type { Group } from "@/lib/types";

export default function Groups() {
  const { session } = useSession();
  const userId = session?.user.id ?? "";
  const [groups, setGroups] = useState<Group[]>([]);
  const [newName, setNewName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!userId) return;
    setGroups(await getMyGroups(userId));
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function createGroup() {
    if (!newName.trim()) return;
    setBusy(true);
    let groupId: string | null = null;
    for (let i = 0; i < 4 && !groupId; i++) {
      const code = generateInviteCode();
      const { data, error } = await supabase
        .from("groups")
        .insert({
          name: newName.trim(),
          invite_code: code,
          created_by: userId,
          owner_id: userId,
        })
        .select("id")
        .single();
      if (!error && data) groupId = data.id as string;
      else if (error && error.code !== "23505") {
        Alert.alert("Couldn't create group", error.message);
        setBusy(false);
        return;
      }
    }
    if (groupId) {
      await supabase.from("group_members").insert({ group_id: groupId, user_id: userId });
      setNewName("");
      await load();
    }
    setBusy(false);
  }

  async function join() {
    setBusy(true);
    const { error } = await joinGroupByCode(userId, joinCode);
    setBusy(false);
    if (error) {
      Alert.alert("Couldn't join", error);
      return;
    }
    setJoinCode("");
    await load();
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
      <Text style={styles.h}>Your crews</Text>
      {groups.length === 0 ? (
        <Text style={styles.dim}>You're not in any group yet.</Text>
      ) : (
        groups.map((g) => (
          <Card key={g.id}>
            <Text style={styles.name}>{g.name}</Text>
            <Text style={styles.code}>Invite code: {g.invite_code}</Text>
          </Card>
        ))
      )}

      <View style={{ height: 8 }} />
      <Card style={{ gap: 12 }}>
        <Text style={styles.h2}>Create a group</Text>
        <Field placeholder="Group name" value={newName} onChangeText={setNewName} />
        <Button label="Create" onPress={createGroup} loading={busy} />
      </Card>

      <Card style={{ gap: 12 }}>
        <Text style={styles.h2}>Join with a code</Text>
        <Field
          placeholder="ABC123"
          autoCapitalize="characters"
          value={joinCode}
          onChangeText={setJoinCode}
        />
        <Button label="Join" variant="secondary" onPress={join} loading={busy} />
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  h: { ...type.h2, color: colors.text },
  h2: { ...type.label, color: colors.text, fontWeight: "700", fontSize: 16 },
  dim: { ...type.body, color: colors.textMuted },
  name: { ...type.label, color: colors.text, fontWeight: "700", fontSize: 16 },
  code: { ...type.caption, color: colors.volt, marginTop: 4, fontVariant: ["tabular-nums"] },
});
