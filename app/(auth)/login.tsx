import React, { useState } from "react";
import { StyleSheet, Text, View, TextInput, Pressable, Platform, KeyboardAvoidingView, ScrollView, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import Colors from "@/constants/colors";
import { useAuth } from "@/lib/auth-context";

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) return;
    setError("");
    setLoading(true);
    const result = await login(email.trim(), password);
    setLoading(false);
    if (result.error) {
      setError(result.error);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={0}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: Platform.OS === "web" ? 67 : insets.top + 40, paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 20 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={Platform.OS !== "web" ? FadeInDown.duration(400) : undefined}>
          <View style={styles.brandContainer}>
            <View style={styles.brandIcon}>
              <Feather name="target" size={32} color="#fff" />
            </View>
            <Text style={styles.brandName}>RIGOR</Text>
            <Text style={styles.brandTagline}>Discipline. Tracked.</Text>
          </View>

          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>Sign in to your account</Text>

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
              placeholder="Email"
              placeholderTextColor={Colors.light.textTertiary}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              testID="login-email"
            />
          </View>

          <View style={styles.inputContainer}>
            <Feather name="lock" size={18} color={Colors.light.textTertiary} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Password"
              placeholderTextColor={Colors.light.textTertiary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              testID="login-password"
            />
            <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
              <Feather name={showPassword ? "eye-off" : "eye"} size={18} color={Colors.light.textTertiary} />
            </Pressable>
          </View>

          <Pressable onPress={() => router.push("/(auth)/forgot-password")} style={styles.forgotLink}>
            <Text style={styles.forgotText}>Forgot password?</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.loginButton, pressed && { opacity: 0.85 }, loading && { opacity: 0.6 }]}
            onPress={handleLogin}
            disabled={loading || !email.trim() || !password.trim()}
            testID="login-submit"
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.loginButtonText}>Sign In</Text>
            )}
          </Pressable>

          <View style={styles.signupRow}>
            <Text style={styles.signupLabel}>Don't have an account?</Text>
            <Pressable onPress={() => router.push("/(auth)/signup")} testID="go-to-signup">
              <Text style={styles.signupLink}>Sign Up</Text>
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
    justifyContent: "center",
  },
  brandContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  brandIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: Colors.light.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  brandName: {
    fontFamily: "Rubik_800ExtraBold",
    fontSize: 32,
    color: Colors.light.text,
    letterSpacing: 4,
  },
  brandTagline: {
    fontFamily: "Rubik_400Regular",
    fontSize: 14,
    color: Colors.light.textTertiary,
    marginTop: 4,
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
  forgotLink: {
    alignSelf: "flex-end",
    marginBottom: 24,
  },
  forgotText: {
    fontFamily: "Rubik_500Medium",
    fontSize: 13,
    color: Colors.light.primary,
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
