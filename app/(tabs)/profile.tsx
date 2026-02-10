import React, { useState, useEffect } from "react";
import { StyleSheet, Text, View, ScrollView, Pressable, Alert, Platform, Switch } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Feather, Ionicons } from "@expo/vector-icons";
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Colors from "@/constants/colors";
import { useRigor } from "@/lib/rigor-context";
import { useAuth } from "@/lib/auth-context";

const NOTIFICATIONS_KEY = "@rigor_notifications";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { contract, getCompletedCount, getFailedCount, getCurrentStreak, getBestStreak, getCompletionRate, getDaysRemaining, resetAll } = useRigor();
  const { user, logout } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  const completed = getCompletedCount();
  const failed = getFailedCount();
  const currentStreak = getCurrentStreak();
  const bestStreak = getBestStreak();
  const rate = getCompletionRate();
  const remaining = getDaysRemaining();

  useEffect(() => {
    loadNotificationState();
  }, []);

  const loadNotificationState = async () => {
    try {
      const val = await AsyncStorage.getItem(NOTIFICATIONS_KEY);
      setNotificationsEnabled(val === "true");
    } catch {}
  };

  const toggleNotifications = async (value: boolean) => {
    if (value) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== "granted") {
        Alert.alert("Permission needed", "Enable notifications in your device settings to receive reminders.");
        return;
      }

      await Notifications.cancelAllScheduledNotificationsAsync();
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "RIGOR",
          body: "Time to complete your daily task. No excuses.",
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: 9,
          minute: 0,
        },
      });

      setNotificationsEnabled(true);
      await AsyncStorage.setItem(NOTIFICATIONS_KEY, "true");
    } else {
      await Notifications.cancelAllScheduledNotificationsAsync();
      setNotificationsEnabled(false);
      await AsyncStorage.setItem(NOTIFICATIONS_KEY, "false");
    }
  };

  const handleReset = () => {
    Alert.alert(
      "Reset Everything",
      "This will delete your contract, all records, and squads. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Reset", style: "destructive", onPress: resetAll },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Sign Out", style: "destructive", onPress: logout },
      ]
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingTop: Platform.OS === 'web' ? 67 : insets.top + 16, paddingBottom: 120 }}
    >
      <Text style={styles.title}>Profile</Text>

      <View style={styles.userCard}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Feather name="user" size={22} color={Colors.light.primary} />
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userEmail} numberOfLines={1}>{user?.email ?? ""}</Text>
            <Text style={styles.userStatus}>Active</Text>
          </View>
        </View>
      </View>

      {contract && (
        <View style={styles.contractCard}>
          <View style={styles.contractHeader}>
            <View style={styles.contractBadge}>
              <Feather name="file-text" size={16} color={Colors.light.primary} />
            </View>
            <Text style={styles.contractTitle}>Active Contract</Text>
          </View>
          <View style={styles.contractDetail}>
            <Text style={styles.contractLabel}>Rule</Text>
            <Text style={styles.contractValue}>{contract.rule}</Text>
          </View>
          <View style={styles.contractDetail}>
            <Text style={styles.contractLabel}>Duration</Text>
            <Text style={styles.contractValue}>{contract.duration} days</Text>
          </View>
          <View style={styles.contractDetail}>
            <Text style={styles.contractLabel}>Deadline</Text>
            <Text style={styles.contractValue}>
              {contract.deadline_hour.toString().padStart(2, '0')}:{contract.deadline_minute.toString().padStart(2, '0')}
            </Text>
          </View>
          <View style={styles.contractDetail}>
            <Text style={styles.contractLabel}>Start Date</Text>
            <Text style={styles.contractValue}>{contract.start_date}</Text>
          </View>
          <View style={[styles.contractDetail, { borderBottomWidth: 0 }]}>
            <Text style={styles.contractLabel}>Remaining</Text>
            <Text style={styles.contractValue}>{remaining} days</Text>
          </View>
        </View>
      )}

      <Text style={styles.sectionTitle}>STATISTICS</Text>

      <View style={styles.statsGrid}>
        <View style={styles.statsItem}>
          <Ionicons name="checkmark-circle" size={20} color={Colors.light.success} />
          <Text style={styles.statsValue}>{completed}</Text>
          <Text style={styles.statsLabel}>Completed</Text>
        </View>
        <View style={styles.statsItem}>
          <Ionicons name="close-circle" size={20} color={Colors.light.error} />
          <Text style={styles.statsValue}>{failed}</Text>
          <Text style={styles.statsLabel}>Failed</Text>
        </View>
        <View style={styles.statsItem}>
          <Ionicons name="trending-up" size={20} color={Colors.light.primary} />
          <Text style={styles.statsValue}>{rate}%</Text>
          <Text style={styles.statsLabel}>Rate</Text>
        </View>
        <View style={styles.statsItem}>
          <Ionicons name="flame" size={20} color={Colors.light.primary} />
          <Text style={styles.statsValue}>{currentStreak}</Text>
          <Text style={styles.statsLabel}>Streak</Text>
        </View>
      </View>

      <View style={styles.insightRow}>
        <View style={[styles.insightIcon, { backgroundColor: '#FFF3E0' }]}>
          <Ionicons name="flame" size={18} color={Colors.light.primary} />
        </View>
        <Text style={styles.insightLabel}>Best streak</Text>
        <Text style={styles.insightValue}>{bestStreak} {bestStreak === 1 ? 'day' : 'days'}</Text>
      </View>

      <Text style={styles.sectionTitle}>SETTINGS</Text>

      <View style={styles.settingRow}>
        <Feather name="bell" size={18} color={Colors.light.text} />
        <Text style={styles.settingText}>Daily Reminder</Text>
        <Switch
          value={notificationsEnabled}
          onValueChange={toggleNotifications}
          trackColor={{ false: Colors.light.border, true: Colors.light.primary }}
          thumbColor="#fff"
          testID="notification-toggle"
        />
      </View>

      <Pressable
        style={({ pressed }) => [styles.settingRow, pressed && { opacity: 0.7 }]}
        onPress={() => router.push("/about")}
        testID="about-button"
      >
        <Feather name="info" size={18} color={Colors.light.text} />
        <Text style={styles.settingText}>About RIGOR</Text>
        <Feather name="chevron-right" size={16} color={Colors.light.textTertiary} />
      </Pressable>

      <Pressable
        style={({ pressed }) => [styles.logoutButton, pressed && { opacity: 0.85 }]}
        onPress={handleLogout}
        testID="logout-button"
      >
        <Feather name="log-out" size={16} color={Colors.light.primary} />
        <Text style={styles.logoutText}>Sign Out</Text>
      </Pressable>

      <Pressable
        style={({ pressed }) => [styles.resetButton, pressed && { opacity: 0.85 }]}
        onPress={handleReset}
      >
        <Feather name="trash-2" size={16} color={Colors.light.error} />
        <Text style={styles.resetText}>Reset all data</Text>
      </Pressable>

      <Text style={styles.version}>RIGOR v1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  title: {
    fontFamily: "Rubik_700Bold",
    fontSize: 28,
    color: Colors.light.text,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  userCard: {
    backgroundColor: Colors.light.surface,
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 18,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  avatarContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFF3E0",
    alignItems: "center",
    justifyContent: "center",
  },
  userInfo: {
    flex: 1,
  },
  userEmail: {
    fontFamily: "Rubik_600SemiBold",
    fontSize: 15,
    color: Colors.light.text,
  },
  userStatus: {
    fontFamily: "Rubik_400Regular",
    fontSize: 12,
    color: Colors.light.success,
    marginTop: 2,
  },
  contractCard: {
    backgroundColor: Colors.light.surface,
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  contractHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },
  contractBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFF3E0',
    alignItems: "center",
    justifyContent: "center",
  },
  contractTitle: {
    fontFamily: "Rubik_600SemiBold",
    fontSize: 16,
    color: Colors.light.text,
  },
  contractDetail: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderLight,
  },
  contractLabel: {
    fontFamily: "Rubik_400Regular",
    fontSize: 14,
    color: Colors.light.textTertiary,
  },
  contractValue: {
    fontFamily: "Rubik_500Medium",
    fontSize: 14,
    color: Colors.light.text,
  },
  sectionTitle: {
    fontFamily: "Rubik_600SemiBold",
    fontSize: 11,
    color: Colors.light.textTertiary,
    letterSpacing: 1,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 16,
  },
  statsItem: {
    flex: 1,
    backgroundColor: Colors.light.surface,
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    gap: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  statsValue: {
    fontFamily: "Rubik_700Bold",
    fontSize: 18,
    color: Colors.light.text,
  },
  statsLabel: {
    fontFamily: "Rubik_400Regular",
    fontSize: 10,
    color: Colors.light.textTertiary,
  },
  insightRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.surface,
    marginHorizontal: 20,
    borderRadius: 14,
    padding: 16,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  insightIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  insightLabel: {
    fontFamily: "Rubik_400Regular",
    fontSize: 14,
    color: Colors.light.text,
    flex: 1,
  },
  insightValue: {
    fontFamily: "Rubik_700Bold",
    fontSize: 15,
    color: Colors.light.text,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.surface,
    marginHorizontal: 20,
    borderRadius: 14,
    padding: 16,
    marginBottom: 8,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  settingText: {
    fontFamily: "Rubik_500Medium",
    fontSize: 15,
    color: Colors.light.text,
    flex: 1,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginHorizontal: 20,
    marginTop: 24,
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.light.primary,
  },
  logoutText: {
    fontFamily: "Rubik_600SemiBold",
    fontSize: 15,
    color: Colors.light.primary,
  },
  resetButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginHorizontal: 20,
    marginTop: 12,
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.light.error,
  },
  resetText: {
    fontFamily: "Rubik_600SemiBold",
    fontSize: 15,
    color: Colors.light.error,
  },
  version: {
    fontFamily: "Rubik_400Regular",
    fontSize: 12,
    color: Colors.light.textTertiary,
    textAlign: "center",
    marginTop: 24,
  },
});
