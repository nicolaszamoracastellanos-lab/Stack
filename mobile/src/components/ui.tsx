import { Image } from "react-native";
import { StyleSheet, Text, TextInput, View } from "react-native";
import type { TextInputProps } from "react-native";
import { colors, radius, type } from "@/lib/theme";

export function Card({ children, style }: { children: React.ReactNode; style?: any }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Field(props: TextInputProps & { label?: string }) {
  const { label, style, ...rest } = props;
  return (
    <View style={{ gap: 6 }}>
      {label ? <Text style={styles.fieldLabel}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={colors.textDim}
        style={[styles.input, style]}
        {...rest}
      />
    </View>
  );
}

export function Avatar({
  url,
  name,
  size = 40,
}: {
  url: string | null;
  name: string;
  size?: number;
}) {
  const initial = name.replace(/^@/, "").charAt(0).toUpperCase() || "?";
  if (url) {
    return (
      <Image
        source={{ uri: url }}
        style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: colors.surface2 }}
      />
    );
  }
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: colors.surface2,
        borderWidth: 1,
        borderColor: colors.border,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={{ color: colors.textMuted, fontWeight: "700", fontSize: size * 0.4 }}>
        {initial}
      </Text>
    </View>
  );
}

/** The streak count + state, styled like the web StreakBadge. */
export function StreakBadge({
  count,
  state,
}: {
  count: number;
  state: "alive" | "at-risk" | "broken";
}) {
  const tint =
    state === "broken" ? colors.danger : state === "at-risk" ? colors.voltDim : colors.volt;
  return (
    <View style={[styles.streak, { borderColor: tint }]}>
      <Text style={[styles.streakNum, { color: tint }]}>{count}</Text>
      <Text style={styles.streakLabel}>
        {state === "broken" ? "broken" : state === "at-risk" ? "day streak · at risk" : "day streak"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  fieldLabel: { ...type.label, color: colors.textMuted },
  input: {
    height: 50,
    borderRadius: radius.input,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    color: colors.text,
    fontSize: 16,
  },
  streak: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignSelf: "flex-start",
  },
  streakNum: { fontSize: 28, fontWeight: "800", fontVariant: ["tabular-nums"] },
  streakLabel: { color: colors.textMuted, ...type.caption },
});
