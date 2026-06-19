import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "@/components/Button";
import { Field } from "@/components/ui";
import { supabase } from "@/lib/supabase";
import { colors, type } from "@/lib/theme";

export default function SignIn() {
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function submit() {
    setError(null);
    setNotice(null);
    if (!email.trim() || !password) {
      setError("Enter your email and password.");
      return;
    }
    setBusy(true);
    if (mode === "in") {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) setError(error.message);
    } else {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });
      if (error) setError(error.message);
      else if (!data.session) {
        setNotice("Check your inbox to confirm your email, then sign in.");
        setMode("in");
      }
    }
    setBusy(false);
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 24 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.wordmark}>STACK</Text>
        <Text style={styles.tagline}>Show up. Every day.</Text>

        <View style={{ height: 40 }} />

        <View style={{ gap: 14 }}>
          <Field
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            placeholder="you@example.com"
          />
          <Field
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="••••••••"
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}
          {notice ? <Text style={styles.notice}>{notice}</Text> : null}

          <View style={{ height: 6 }} />
          <Button
            label={mode === "in" ? "Sign in" : "Create account"}
            onPress={submit}
            loading={busy}
          />
          <Button
            label={
              mode === "in"
                ? "New here? Create an account"
                : "Have an account? Sign in"
            }
            variant="secondary"
            onPress={() => {
              setError(null);
              setNotice(null);
              setMode((m) => (m === "in" ? "up" : "in"));
            }}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 24 },
  wordmark: {
    ...type.h1,
    color: colors.text,
    fontSize: 40,
    letterSpacing: 2,
    fontWeight: "800",
  },
  tagline: { ...type.body, color: colors.textMuted, marginTop: 6 },
  error: { color: colors.danger, ...type.label },
  notice: { color: colors.volt, ...type.label },
});
