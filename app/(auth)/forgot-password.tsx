import React, { useState } from "react";
import { StyleSheet, Text, View, TextInput, Pressable, Platform, KeyboardAvoidingView, ScrollView, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import Colors from "@/constants/colors";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n";

export default function ForgotPasswordScreen() {
  const insets = useSafeAreaInsets();
  const { forgotPassword } = useAuth();
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    if (!email.trim()) return;
    setError("");
    setLoading(true);
    const result = await forgotPassword(email.trim());
    setLoading(false);
    if (result.error) {
      setError(result.error);
    } else {
      setSent(true);
    }
  };

  if (sent) {
    return (
      <View style={[styles.container, { justifyContent: "center", paddingHorizontal: 28 }]}>
        <View style={styles.brandContainer}>
          <View style={[styles.successIcon]}>
            <Feather name="check-circle" size={48} color={Colors.light.success} />
          </View>
        </View>
        <Text style={[styles.title, { textAlign: "center" }]}>Email sent</Text>
        <Text style={[styles.subtitle, { textAlign: "center", marginBottom: 32 }]}>
          If an account with {email} exists, you will receive a password reset link.
        </Text>
        <Pressable
          style={({ pressed }) => [styles.submitButton, pressed && { opacity: 0.85 }]}
          onPress={() => router.replace("/(auth)/login")}
        >
          <Text style={styles.submitButtonText}>{t.auth.backToLogin}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={0}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: Platform.OS === "web" ? 67 : insets.top + 20, paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 20 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={Platform.OS !== "web" ? FadeInDown.duration(400) : undefined}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="arrow-left" size={22} color={Colors.light.text} />
          </Pressable>

          <View style={styles.brandContainer}>
            <View style={styles.lockIcon}>
              <Feather name="key" size={28} color={Colors.light.primary} />
            </View>
          </View>

          <Text style={styles.title}>{t.auth.forgotTitle}</Text>
          <Text style={styles.subtitle}>{t.auth.forgotSubtitle}</Text>

          {!!error && (
            <View style={styles.errorBox}>
              <Feather name="alert-circle" size={14} color={Colors.light.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={styles.inputContainer}>
            <Feather name="mail" size={18} color={Colors.light.textTertiary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder={t.auth.email}
              placeholderTextColor={Colors.light.textTertiary}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus
              testID="forgot-email"
            />
          </View>

          <Pressable
            style={({ pressed }) => [styles.submitButton, pressed && { opacity: 0.85 }, loading && { opacity: 0.6 }]}
            onPress={handleSend}
            disabled={loading || !email.trim()}
            testID="forgot-submit"
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.submitButtonText}>{t.auth.sendReset}</Text>
            )}
          </Pressable>

          <View style={styles.loginRow}>
            <Text style={styles.loginLabel}>Remember your password?</Text>
            <Pressable onPress={() => router.replace("/(auth)/login")}>
              <Text style={styles.loginLink}>Sign In</Text>
            </Pressable>
          </View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 28,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  brandContainer: {
    alignItems: "center",
    marginBottom: 28,
  },
  lockIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: "#FFF3E0",
    alignItems: "center",
    justifyContent: "center",
  },
  successIcon: {
    marginBottom: 16,
  },
  title: {
    fontFamily: "Rubik_700Bold",
    fontSize: 24,
    color: Colors.light.text,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: "Rubik_400Regular",
    fontSize: 14,
    color: Colors.light.textTertiary,
    lineHeight: 20,
    marginBottom: 28,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FDECEA",
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  errorText: {
    fontFamily: "Rubik_400Regular",
    fontSize: 13,
    color: Colors.light.error,
    flex: 1,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.surface,
    borderWidth: 1.5,
    borderColor: Colors.light.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontFamily: "Rubik_400Regular",
    fontSize: 15,
    color: Colors.light.text,
    paddingVertical: 16,
  },
  submitButton: {
    backgroundColor: Colors.light.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 24,
  },
  submitButtonText: {
    fontFamily: "Rubik_700Bold",
    fontSize: 16,
    color: "#fff",
  },
  loginRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  loginLabel: {
    fontFamily: "Rubik_400Regular",
    fontSize: 14,
    color: Colors.light.textTertiary,
  },
  loginLink: {
    fontFamily: "Rubik_600SemiBold",
    fontSize: 14,
    color: Colors.light.primary,
  },
});
