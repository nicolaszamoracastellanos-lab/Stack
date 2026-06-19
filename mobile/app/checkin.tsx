import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { useRouter } from "expo-router";
import { Button } from "@/components/Button";
import { Card, Field } from "@/components/ui";
import { createCheckin, getMyGroups } from "@/lib/data";
import { useSession } from "@/lib/session";
import { colors, radius, type } from "@/lib/theme";
import type { Group } from "@/lib/types";

export default function Checkin() {
  const { session } = useSession();
  const router = useRouter();
  const userId = session?.user.id ?? "";

  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [groups, setGroups] = useState<Group[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [justMe, setJustMe] = useState(false);
  const [posting, setPosting] = useState(false);

  const load = useCallback(async () => {
    if (!userId) return;
    const g = await getMyGroups(userId);
    setGroups(g);
    // Default to posting in the first group.
    if (g.length > 0) setSelected(new Set([g[0].id]));
    else setJustMe(true);
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  async function downscale(uri: string): Promise<string> {
    try {
      const out = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 1080 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG },
      );
      return out.uri;
    } catch {
      return uri;
    }
  }

  async function takePhoto() {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Camera needed", "Allow camera access to take your check-in photo.");
      return;
    }
    const res = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 0.8,
      cameraType: ImagePicker.CameraType.back,
    });
    if (!res.canceled) setPhotoUri(await downscale(res.assets[0].uri));
  }

  async function pickPhoto() {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
    });
    if (!res.canceled) setPhotoUri(await downscale(res.assets[0].uri));
  }

  function toggleGroup(id: string) {
    setJustMe(false);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function post() {
    if (!photoUri) {
      Alert.alert("Add a photo", "Take or choose a photo to check in.");
      return;
    }
    if (!justMe && selected.size === 0) {
      Alert.alert("Pick a group", "Choose at least one group, or post just for yourself.");
      return;
    }
    setPosting(true);
    const { error } = await createCheckin({
      userId,
      photoUri,
      note,
      groupIds: Array.from(selected),
      justMe,
    });
    setPosting(false);
    if (error) {
      Alert.alert("Couldn't post", error);
      return;
    }
    router.back();
  }

  return (
    <ScrollView
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: 16, gap: 16 }}
    >
      {photoUri ? (
        <Image source={{ uri: photoUri }} style={styles.preview} resizeMode="cover" />
      ) : (
        <Pressable style={styles.dropzone} onPress={takePhoto}>
          <Text style={styles.dropTitle}>Take your check-in photo</Text>
          <Text style={styles.dropHint}>Proof you showed up today.</Text>
        </Pressable>
      )}

      <View style={{ flexDirection: "row", gap: 12 }}>
        <View style={{ flex: 1 }}>
          <Button label={photoUri ? "Retake" : "Camera"} onPress={takePhoto} variant="secondary" />
        </View>
        <View style={{ flex: 1 }}>
          <Button label="Library" onPress={pickPhoto} variant="secondary" />
        </View>
      </View>

      <Field
        placeholder="Add a note (optional)"
        value={note}
        onChangeText={setNote}
        multiline
        style={{ height: 90, paddingTop: 12, textAlignVertical: "top" }}
      />

      <Text style={styles.section}>Post to</Text>
      {groups.map((g) => {
        const on = selected.has(g.id);
        return (
          <Pressable key={g.id} onPress={() => toggleGroup(g.id)}>
            <Card style={[styles.row, on && styles.rowOn]}>
              <Text style={styles.rowText}>{g.name}</Text>
              <View style={[styles.checkbox, on && styles.checkboxOn]} />
            </Card>
          </Pressable>
        );
      })}
      <Pressable onPress={() => { setJustMe(true); setSelected(new Set()); }}>
        <Card style={[styles.row, justMe && styles.rowOn]}>
          <Text style={styles.rowText}>Just me (personal log)</Text>
          <View style={[styles.checkbox, justMe && styles.checkboxOn]} />
        </Card>
      </Pressable>

      <View style={{ height: 4 }} />
      <Button label={posting ? "Posting…" : "Check in"} onPress={post} loading={posting} />
      {posting ? <ActivityIndicator color={colors.volt} /> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  preview: { width: "100%", aspectRatio: 9 / 16, borderRadius: radius.card, backgroundColor: colors.surface2 },
  dropzone: {
    width: "100%",
    aspectRatio: 9 / 16,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderStyle: "dashed",
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  dropTitle: { ...type.body, color: colors.text, fontWeight: "600" },
  dropHint: { ...type.caption, color: colors.textDim },
  section: { ...type.label, color: colors.textMuted, marginTop: 4 },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 14 },
  rowOn: { borderColor: colors.volt },
  rowText: { ...type.body, color: colors.text },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.borderStrong,
  },
  checkboxOn: { backgroundColor: colors.volt, borderColor: colors.volt },
});
