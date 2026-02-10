import React from "react";
import { StyleSheet, Text, View, Pressable, Platform, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Feather, Ionicons } from "@expo/vector-icons";
import Colors from "@/constants/colors";

export default function AboutScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: Platform.OS === "web" ? 67 : insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.closeBtn}>
          <Feather name="x" size={24} color={Colors.light.text} />
        </Pressable>
        <Text style={styles.headerTitle}>About</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.logoSection}>
          <View style={styles.logoIcon}>
            <Feather name="target" size={36} color="#fff" />
          </View>
          <Text style={styles.appName}>RIGOR</Text>
          <Text style={styles.version}>Version 1.0.0</Text>
        </View>

        <Text style={styles.description}>
          RIGOR is a discipline tracking app built on commitment. Create irreversible contracts
          with yourself, track your daily consistency, and build unbreakable habits.
        </Text>

        <View style={styles.featureList}>
          <View style={styles.featureItem}>
            <View style={[styles.featureIcon, { backgroundColor: "#FFF3E0" }]}>
              <Feather name="file-text" size={18} color={Colors.light.primary} />
            </View>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>Irreversible Contracts</Text>
              <Text style={styles.featureDesc}>Once signed, no editing, no pausing, no excuses</Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <View style={[styles.featureIcon, { backgroundColor: "#E8F5E9" }]}>
              <Ionicons name="grid" size={18} color={Colors.light.success} />
            </View>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>Consistency Heatmap</Text>
              <Text style={styles.featureDesc}>Visualize your discipline over time</Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <View style={[styles.featureIcon, { backgroundColor: "#E3F2FD" }]}>
              <Ionicons name="people" size={18} color="#1976D2" />
            </View>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>Squads</Text>
              <Text style={styles.featureDesc}>Accountability groups to keep you honest</Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <View style={[styles.featureIcon, { backgroundColor: "#FFF8E1" }]}>
              <Ionicons name="trophy" size={18} color="#F9A825" />
            </View>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>Trophies</Text>
              <Text style={styles.featureDesc}>Earn achievements for your dedication</Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <View style={[styles.featureIcon, { backgroundColor: "#FCE4EC" }]}>
              <Ionicons name="timer" size={18} color={Colors.light.error} />
            </View>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>Shrinking Deadlines</Text>
              <Text style={styles.featureDesc}>Every 7-day streak cuts 30 min from your deadline</Text>
            </View>
          </View>
        </View>

        <Text style={styles.footer}>Built with discipline, for the disciplined.</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  closeBtn: {
    padding: 4,
  },
  headerTitle: {
    fontFamily: "Rubik_600SemiBold",
    fontSize: 17,
    color: Colors.light.text,
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 60,
  },
  logoSection: {
    alignItems: "center",
    marginBottom: 28,
    marginTop: 12,
  },
  logoIcon: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: Colors.light.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  appName: {
    fontFamily: "Rubik_800ExtraBold",
    fontSize: 28,
    color: Colors.light.text,
    letterSpacing: 4,
  },
  version: {
    fontFamily: "Rubik_400Regular",
    fontSize: 13,
    color: Colors.light.textTertiary,
    marginTop: 4,
  },
  description: {
    fontFamily: "Rubik_400Regular",
    fontSize: 15,
    color: Colors.light.textSecondary,
    lineHeight: 22,
    textAlign: "center",
    marginBottom: 32,
  },
  featureList: {
    gap: 16,
    marginBottom: 32,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.surface,
    borderRadius: 14,
    padding: 16,
    gap: 14,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontFamily: "Rubik_600SemiBold",
    fontSize: 14,
    color: Colors.light.text,
    marginBottom: 2,
  },
  featureDesc: {
    fontFamily: "Rubik_400Regular",
    fontSize: 12,
    color: Colors.light.textTertiary,
  },
  footer: {
    fontFamily: "Rubik_400Regular",
    fontSize: 12,
    color: Colors.light.textTertiary,
    textAlign: "center",
  },
});
