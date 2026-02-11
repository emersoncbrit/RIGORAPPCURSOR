import React, { useState } from "react";
import { StyleSheet, Text, View, TextInput, Pressable, Platform, KeyboardAvoidingView, ScrollView, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import Colors from "@/constants/colors";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n";

export default function SignupScreen() {
  const insets = useSafeAreaInsets();
  const { signup } = useAuth();
  const { t, language } = useI18n();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmEmailSent, setConfirmEmailSent] = useState(false);

  const isUsernameValid = username.trim().length >= 3 && /^[a-zA-Z0-9_]+$/.test(username.trim());

  const handleSignup = async () => {
    if (!username.trim() || !email.trim() || !password.trim()) return;
    if (!isUsernameValid) {
      setError(language === "pt" ? "Nome de usuário deve ter pelo menos 3 caracteres (letras, números, _)" : "Username must be at least 3 characters (letters, numbers, _)");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    setError("");
    setLoading(true);
    const result = await signup(email.trim(), password, username.trim());
    setLoading(false);
    if (result.error) {
      setError(result.error);
    } else if (result.confirmEmail) {
      setConfirmEmailSent(true);
    }
  };

  if (confirmEmailSent) {
    return (
      <View style={[styles.container, { justifyContent: "center", paddingHorizontal: 28 }]}>
        <View style={styles.brandContainer}>
          <View style={[styles.brandIcon, { backgroundColor: Colors.light.success }]}>
            <Feather name="mail" size={32} color="#fff" />
          </View>
        </View>
        <Text style={[styles.title, { textAlign: "center" }]}>Check your email</Text>
        <Text style={[styles.subtitle, { textAlign: "center", marginBottom: 32 }]}>
          We sent a confirmation link to {email}. Open it to activate your account.
        </Text>
        <Pressable
          style={({ pressed }) => [styles.loginButton, pressed && { opacity: 0.85 }]}
          onPress={() => router.replace("/(auth)/login")}
        >
          <Text style={styles.loginButtonText}>Go to Login</Text>
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
            <View style={styles.brandIcon}>
              <Feather name="target" size={32} color="#fff" />
            </View>
          </View>

          <Text style={styles.title}>{t.auth.signupTitle}</Text>
          <Text style={styles.subtitle}>{t.auth.signupSubtitle}</Text>

          {!!error && (
            <View style={styles.errorBox}>
              <Feather name="alert-circle" size={14} color={Colors.light.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={styles.inputContainer}>
            <Feather name="user" size={18} color={Colors.light.textTertiary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder={(t.auth as any).usernamePlaceholder}
              placeholderTextColor={Colors.light.textTertiary}
              value={username}
              onChangeText={(text) => setUsername(text.replace(/[^a-zA-Z0-9_]/g, ""))}
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={20}
              testID="signup-username"
            />
          </View>

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
              testID="signup-email"
            />
          </View>

          <View style={styles.inputContainer}>
            <Feather name="lock" size={18} color={Colors.light.textTertiary} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder={t.auth.password}
              placeholderTextColor={Colors.light.textTertiary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              testID="signup-password"
            />
            <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
              <Feather name={showPassword ? "eye-off" : "eye"} size={18} color={Colors.light.textTertiary} />
            </Pressable>
          </View>

          <View style={styles.inputContainer}>
            <Feather name="shield" size={18} color={Colors.light.textTertiary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Confirm password"
              placeholderTextColor={Colors.light.textTertiary}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              testID="signup-confirm"
            />
          </View>

          <View style={styles.passwordRules}>
            <View style={styles.ruleRow}>
              <Feather name={isUsernameValid ? "check-circle" : "circle"} size={14} color={isUsernameValid ? Colors.light.success : Colors.light.textTertiary} />
              <Text style={[styles.ruleText, isUsernameValid && { color: Colors.light.success }]}>{language === "pt" ? "Nome de usuário válido (3+ caracteres)" : "Valid username (3+ characters)"}</Text>
            </View>
            <View style={styles.ruleRow}>
              <Feather name={password.length >= 6 ? "check-circle" : "circle"} size={14} color={password.length >= 6 ? Colors.light.success : Colors.light.textTertiary} />
              <Text style={[styles.ruleText, password.length >= 6 && { color: Colors.light.success }]}>{language === "pt" ? "Pelo menos 6 caracteres" : "At least 6 characters"}</Text>
            </View>
            <View style={styles.ruleRow}>
              <Feather name={password === confirmPassword && password.length > 0 ? "check-circle" : "circle"} size={14} color={password === confirmPassword && password.length > 0 ? Colors.light.success : Colors.light.textTertiary} />
              <Text style={[styles.ruleText, password === confirmPassword && password.length > 0 && { color: Colors.light.success }]}>{language === "pt" ? "Senhas coincidem" : "Passwords match"}</Text>
            </View>
          </View>

          <Pressable
            style={({ pressed }) => [styles.loginButton, pressed && { opacity: 0.85 }, loading && { opacity: 0.6 }]}
            onPress={handleSignup}
            disabled={loading || !username.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()}
            testID="signup-submit"
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.loginButtonText}>{t.auth.signup}</Text>
            )}
          </Pressable>

          <View style={styles.signupRow}>
            <Text style={styles.signupLabel}>{t.auth.haveAccount}</Text>
            <Pressable onPress={() => router.replace("/(auth)/login")} testID="go-to-login">
              <Text style={styles.signupLink}>{t.auth.login}</Text>
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
  brandIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: Colors.light.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontFamily: "Rubik_700Bold",
    fontSize: 24,
    color: Colors.light.text,
    marginBottom: 6,
  },
  subtitle: {
    fontFamily: "Rubik_400Regular",
    fontSize: 14,
    color: Colors.light.textTertiary,
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
    marginBottom: 14,
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
  eyeButton: {
    padding: 8,
    marginLeft: 4,
  },
  passwordRules: {
    gap: 8,
    marginBottom: 24,
  },
  ruleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  ruleText: {
    fontFamily: "Rubik_400Regular",
    fontSize: 13,
    color: Colors.light.textTertiary,
  },
  loginButton: {
    backgroundColor: Colors.light.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 24,
  },
  loginButtonText: {
    fontFamily: "Rubik_700Bold",
    fontSize: 16,
    color: "#fff",
  },
  signupRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  signupLabel: {
    fontFamily: "Rubik_400Regular",
    fontSize: 14,
    color: Colors.light.textTertiary,
  },
  signupLink: {
    fontFamily: "Rubik_600SemiBold",
    fontSize: 14,
    color: Colors.light.primary,
  },
});
