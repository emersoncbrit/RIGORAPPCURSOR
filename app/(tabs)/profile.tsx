import React, { useState, useEffect } from "react";
import { StyleSheet, Text, View, ScrollView, Pressable, Alert, Platform, Switch, Modal } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Feather, Ionicons } from "@expo/vector-icons";
import * as Notifications from "expo-notifications";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Colors from "@/constants/colors";
import { useRigor } from "@/lib/rigor-context";
import { useAuth } from "@/lib/auth-context";
import { useI18n, Language } from "@/lib/i18n";

const NOTIFICATIONS_KEY = "@rigor_notifications";
const DIFFICULTY_KEY = "@rigor_difficulty";

export type Difficulty = "medium" | "hard" | "extreme";

const DIFFICULTY_OPTIONS: { key: Difficulty; missions: number; pro: boolean }[] = [
  { key: "medium", missions: 1, pro: false },
  { key: "hard", missions: 4, pro: true },
  { key: "extreme", missions: 6, pro: true },
];

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
  const { language, setLanguage, t } = useI18n();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [showLanguage, setShowLanguage] = useState(false);
  const [showDifficulty, setShowDifficulty] = useState(false);
  const [difficulty, setDifficultyState] = useState<Difficulty>("medium");

  const completed = getCompletedCount();
  const failed = getFailedCount();
  const currentStreak = getCurrentStreak();
  const bestStreak = getBestStreak();
  const rate = getCompletionRate();
  const remaining = getDaysRemaining();

  useEffect(() => {
    loadNotificationState();
    loadDifficulty();
  }, []);

  const loadNotificationState = async () => {
    try {
      const val = await AsyncStorage.getItem(NOTIFICATIONS_KEY);
      setNotificationsEnabled(val === "true");
    } catch {}
  };

  const loadDifficulty = async () => {
    try {
      const val = await AsyncStorage.getItem(DIFFICULTY_KEY);
      if (val === "medium" || val === "hard" || val === "extreme") {
        setDifficultyState(val);
      }
    } catch {}
  };

  const handleSetDifficulty = async (d: Difficulty) => {
    if (d !== "medium" && DIFFICULTY_OPTIONS.find(o => o.key === d)?.pro) {
      return;
    }
    setDifficultyState(d);
    await AsyncStorage.setItem(DIFFICULTY_KEY, d);
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowDifficulty(false);
  };

  const handleSetLanguage = async (lang: Language) => {
    await setLanguage(lang);
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowLanguage(false);
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
        Alert.alert(t.profile.permissionNeeded, t.profile.permissionMessage);
        return;
      }

      await Notifications.cancelAllScheduledNotificationsAsync();
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "RIGOR",
          body: language === "pt" ? "Hora de cumprir sua missão diária. Sem desculpas." : "Time to complete your daily task. No excuses.",
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
      t.profile.resetTitle,
      t.profile.resetMessage,
      [
        { text: t.profile.cancel, style: "cancel" },
        { text: t.profile.reset, style: "destructive", onPress: resetAll },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      t.profile.signOut,
      t.profile.signOutConfirm,
      [
        { text: t.profile.cancel, style: "cancel" },
        { text: t.profile.signOut, style: "destructive", onPress: logout },
      ]
    );
  };

  const currentDiffOption = DIFFICULTY_OPTIONS.find(o => o.key === difficulty)!;
  const difficultyLabel = t.profile[difficulty as keyof typeof t.profile] as string;
  const languageLabel = language === "en" ? t.profile.english : t.profile.portuguese;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingTop: Platform.OS === 'web' ? 67 : insets.top + 16, paddingBottom: 120 }}
    >
      <Text style={styles.title}>{t.profile.title}</Text>

      <View style={styles.userCard}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Feather name="user" size={22} color={Colors.light.primary} />
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userEmail} numberOfLines={1}>{user?.email ?? ""}</Text>
            <Text style={styles.userStatus}>{t.profile.active}</Text>
          </View>
        </View>
      </View>

      {contract && (
        <View style={styles.contractCard}>
          <View style={styles.contractHeader}>
            <View style={styles.contractBadge}>
              <Feather name="file-text" size={16} color={Colors.light.primary} />
            </View>
            <Text style={styles.contractTitle}>{t.profile.activeContract}</Text>
          </View>
          <View style={styles.contractDetail}>
            <Text style={styles.contractLabel}>{t.profile.rule}</Text>
            <Text style={styles.contractValue}>{contract.rule}</Text>
          </View>
          <View style={styles.contractDetail}>
            <Text style={styles.contractLabel}>{t.profile.duration}</Text>
            <Text style={styles.contractValue}>{contract.duration} {t.profile.days}</Text>
          </View>
          <View style={styles.contractDetail}>
            <Text style={styles.contractLabel}>{t.profile.deadline}</Text>
            <Text style={styles.contractValue}>
              {contract.deadline_hour.toString().padStart(2, '0')}:{contract.deadline_minute.toString().padStart(2, '0')}
            </Text>
          </View>
          <View style={styles.contractDetail}>
            <Text style={styles.contractLabel}>{t.profile.startDate}</Text>
            <Text style={styles.contractValue}>{contract.start_date}</Text>
          </View>
          <View style={[styles.contractDetail, { borderBottomWidth: 0 }]}>
            <Text style={styles.contractLabel}>{t.profile.remaining}</Text>
            <Text style={styles.contractValue}>{remaining} {t.profile.days}</Text>
          </View>
        </View>
      )}

      <Text style={styles.sectionTitle}>{t.profile.statistics}</Text>

      <View style={styles.statsGrid}>
        <View style={styles.statsItem}>
          <Ionicons name="checkmark-circle" size={20} color={Colors.light.success} />
          <Text style={styles.statsValue}>{completed}</Text>
          <Text style={styles.statsLabel}>{t.profile.completed}</Text>
        </View>
        <View style={styles.statsItem}>
          <Ionicons name="close-circle" size={20} color={Colors.light.error} />
          <Text style={styles.statsValue}>{failed}</Text>
          <Text style={styles.statsLabel}>{t.profile.failed}</Text>
        </View>
        <View style={styles.statsItem}>
          <Ionicons name="trending-up" size={20} color={Colors.light.primary} />
          <Text style={styles.statsValue}>{rate}%</Text>
          <Text style={styles.statsLabel}>{t.profile.rate}</Text>
        </View>
        <View style={styles.statsItem}>
          <Ionicons name="flame" size={20} color={Colors.light.primary} />
          <Text style={styles.statsValue}>{currentStreak}</Text>
          <Text style={styles.statsLabel}>{t.profile.streak}</Text>
        </View>
      </View>

      <View style={styles.insightRow}>
        <View style={[styles.insightIcon, { backgroundColor: '#FFF3E0' }]}>
          <Ionicons name="flame" size={18} color={Colors.light.primary} />
        </View>
        <Text style={styles.insightLabel}>{t.profile.bestStreak}</Text>
        <Text style={styles.insightValue}>{bestStreak} {bestStreak === 1 ? t.profile.day : t.profile.days}</Text>
      </View>

      <Text style={styles.sectionTitle}>{t.profile.settings}</Text>

      <View style={styles.settingRow}>
        <Feather name="bell" size={18} color={Colors.light.text} />
        <Text style={styles.settingText}>{t.profile.dailyReminder}</Text>
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
        onPress={() => setShowLanguage(true)}
        testID="language-button"
      >
        <Ionicons name="language" size={18} color={Colors.light.text} />
        <Text style={styles.settingText}>{t.profile.language}</Text>
        <Text style={styles.settingValue}>{languageLabel}</Text>
        <Feather name="chevron-right" size={16} color={Colors.light.textTertiary} />
      </Pressable>

      <Pressable
        style={({ pressed }) => [styles.settingRow, pressed && { opacity: 0.7 }]}
        onPress={() => setShowDifficulty(true)}
        testID="difficulty-button"
      >
        <Ionicons name="speedometer" size={18} color={Colors.light.text} />
        <Text style={styles.settingText}>{t.profile.difficulty}</Text>
        <Text style={styles.settingValue}>{difficultyLabel}</Text>
        <Feather name="chevron-right" size={16} color={Colors.light.textTertiary} />
      </Pressable>

      <Pressable
        style={({ pressed }) => [styles.settingRow, pressed && { opacity: 0.7 }]}
        onPress={() => router.push("/about")}
        testID="about-button"
      >
        <Feather name="info" size={18} color={Colors.light.text} />
        <Text style={styles.settingText}>{t.profile.aboutRigor}</Text>
        <Feather name="chevron-right" size={16} color={Colors.light.textTertiary} />
      </Pressable>

      <Pressable
        style={({ pressed }) => [styles.logoutButton, pressed && { opacity: 0.85 }]}
        onPress={handleLogout}
        testID="logout-button"
      >
        <Feather name="log-out" size={16} color={Colors.light.primary} />
        <Text style={styles.logoutText}>{t.profile.signOut}</Text>
      </Pressable>

      <Pressable
        style={({ pressed }) => [styles.resetButton, pressed && { opacity: 0.85 }]}
        onPress={handleReset}
      >
        <Feather name="trash-2" size={16} color={Colors.light.error} />
        <Text style={styles.resetText}>{t.profile.resetAll}</Text>
      </Pressable>

      <Text style={styles.version}>RIGOR v1.0.0</Text>

      <Modal visible={showLanguage} animationType="fade" transparent>
        <Pressable style={styles.modalOverlay} onPress={() => setShowLanguage(false)}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t.profile.languageTitle}</Text>
              <Pressable onPress={() => setShowLanguage(false)} hitSlop={12}>
                <Feather name="x" size={20} color={Colors.light.text} />
              </Pressable>
            </View>

            <Pressable
              style={[styles.optionCard, language === "en" && styles.optionCardSelected]}
              onPress={() => handleSetLanguage("en")}
            >
              <Text style={[styles.optionLabel, language === "en" && styles.optionLabelSelected]}>English</Text>
              {language === "en" && (
                <Ionicons name="checkmark-circle" size={22} color={Colors.light.primary} />
              )}
            </Pressable>

            <Pressable
              style={[styles.optionCard, language === "pt" && styles.optionCardSelected]}
              onPress={() => handleSetLanguage("pt")}
            >
              <Text style={[styles.optionLabel, language === "pt" && styles.optionLabelSelected]}>Português</Text>
              {language === "pt" && (
                <Ionicons name="checkmark-circle" size={22} color={Colors.light.primary} />
              )}
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={showDifficulty} animationType="fade" transparent>
        <Pressable style={styles.modalOverlay} onPress={() => setShowDifficulty(false)}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t.profile.difficultyTitle}</Text>
              <Pressable onPress={() => setShowDifficulty(false)} hitSlop={12}>
                <Feather name="x" size={20} color={Colors.light.text} />
              </Pressable>
            </View>

            <Text style={styles.diffWarning}>{t.profile.difficultyWarning}</Text>

            {DIFFICULTY_OPTIONS.map((option) => {
              const isSelected = difficulty === option.key;
              const label = t.profile[option.key as keyof typeof t.profile] as string;
              const missionCount = option.missions;
              const missionLabel = missionCount === 1 ? t.profile.mission : t.profile.missions;

              return (
                <Pressable
                  key={option.key}
                  style={[styles.optionCard, isSelected && styles.optionCardSelected]}
                  onPress={() => handleSetDifficulty(option.key)}
                >
                  <View>
                    <View style={styles.optionNameRow}>
                      <Text style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>{label}</Text>
                      {option.pro && (
                        <View style={styles.proBadge}>
                          <Text style={styles.proBadgeText}>{t.profile.pro}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.optionSub}>{missionCount} {missionLabel}</Text>
                  </View>
                  {isSelected ? (
                    <Ionicons name="checkmark-circle" size={22} color={Colors.light.primary} />
                  ) : option.pro ? (
                    <Feather name="lock" size={18} color={Colors.light.textTertiary} />
                  ) : null}
                </Pressable>
              );
            })}

            <Pressable
              style={styles.cancelButton}
              onPress={() => setShowDifficulty(false)}
            >
              <Text style={styles.cancelButtonText}>{t.profile.cancel}</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
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
  settingValue: {
    fontFamily: "Rubik_400Regular",
    fontSize: 14,
    color: Colors.light.textTertiary,
    marginRight: 4,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: Colors.light.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: Platform.OS === "web" ? 34 : 40,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  modalTitle: {
    fontFamily: "Rubik_700Bold",
    fontSize: 20,
    color: Colors.light.text,
  },
  diffWarning: {
    fontFamily: "Rubik_400Regular",
    fontSize: 13,
    color: Colors.light.textTertiary,
    marginBottom: 16,
  },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.light.background,
    borderRadius: 14,
    padding: 18,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: "transparent",
  },
  optionCardSelected: {
    borderColor: Colors.light.primary,
    backgroundColor: "#FFF3E0",
  },
  optionNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  optionLabel: {
    fontFamily: "Rubik_600SemiBold",
    fontSize: 16,
    color: Colors.light.text,
  },
  optionLabelSelected: {
    color: Colors.light.text,
  },
  optionSub: {
    fontFamily: "Rubik_400Regular",
    fontSize: 13,
    color: Colors.light.textTertiary,
    marginTop: 2,
  },
  proBadge: {
    backgroundColor: Colors.light.primary,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  proBadgeText: {
    fontFamily: "Rubik_700Bold",
    fontSize: 10,
    color: "#fff",
    letterSpacing: 0.5,
  },
  cancelButton: {
    backgroundColor: Colors.light.background,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 6,
  },
  cancelButtonText: {
    fontFamily: "Rubik_600SemiBold",
    fontSize: 16,
    color: Colors.light.text,
  },
});
