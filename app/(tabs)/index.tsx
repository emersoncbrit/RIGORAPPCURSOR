import React, { useState, useEffect } from "react";
import { StyleSheet, Text, View, Pressable, Platform, Modal } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withSequence, withTiming } from "react-native-reanimated";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Colors from "@/constants/colors";
import { useRigor } from "@/lib/rigor-context";
import { useI18n } from "@/lib/i18n";

const LAST_CHECK_KEY = "@rigor_last_failure_check";

export default function TodayScreen() {
  const insets = useSafeAreaInsets();
  const { contract, markDone, getDayNumber, getCompletedCount, getFailedCount, getCurrentStreak, getDaysRemaining, getCurrentDeadline, isTodayCompleted, dayRecords } = useRigor();
  const { t, language } = useI18n();
  const [currentTime, setCurrentTime] = useState(new Date());
  const buttonScale = useSharedValue(1);
  const [showFailureModal, setShowFailureModal] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!contract) return;
    checkFailure();
  }, [contract, dayRecords, currentTime]);

  const checkFailure = async () => {
    if (!contract) return;
    if (showFailureModal) return;

    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];

    const lastCheck = await AsyncStorage.getItem(LAST_CHECK_KEY);
    if (lastCheck === todayStr) return;

    const contractStart = contract.start_date;
    if (todayStr < contractStart) return;

    const todayRecord = dayRecords.find((r) => r.date === todayStr);
    if (todayRecord) return;

    const dl = getCurrentDeadline();
    const deadlineMinutes = dl.hour * 60 + dl.minute;
    const nowMinutes = now.getHours() * 60 + now.getMinutes();

    if (nowMinutes >= deadlineMinutes) {
      setShowFailureModal(true);
      return;
    }

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];
    if (yesterdayStr < contractStart) return;

    const yesterdayRecord = dayRecords.find((r) => r.date === yesterdayStr);
    if (!yesterdayRecord) {
      setShowFailureModal(true);
    }
  };

  const handleFailureResponse = async (completed: boolean) => {
    const todayStr = new Date().toISOString().split("T")[0];
    await AsyncStorage.setItem(LAST_CHECK_KEY, todayStr);
    setShowFailureModal(false);
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const dayNumber = getDayNumber();
  const completed = getCompletedCount();
  const failed = getFailedCount();
  const streak = getCurrentStreak();
  const remaining = getDaysRemaining();
  const deadline = getCurrentDeadline();
  const todayDone = isTodayCompleted();
  const total = contract ? contract.duration : 1;
  const progress = total > 0 ? (completed / total) : 0;

  const locale = language === 'pt' ? 'pt-BR' : 'en-US';
  const dayName = currentTime.toLocaleDateString(locale, { weekday: 'long' });
  const dayOfMonth = currentTime.getDate();
  const hours = currentTime.getHours().toString().padStart(2, '0');
  const minutes = currentTime.getMinutes().toString().padStart(2, '0');
  const deadlineStr = `${deadline.hour.toString().padStart(2, '0')}:${deadline.minute.toString().padStart(2, '0')}`;
  const ruleText = contract?.rule ?? '';

  const buttonAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const handleDone = async () => {
    if (todayDone) return;
    buttonScale.value = withSequence(
      withSpring(0.93, { damping: 10 }),
      withSpring(1, { damping: 8 })
    );
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    await markDone();
  };

  if (!contract) {
    return (
      <View style={[styles.container, { paddingTop: Platform.OS === 'web' ? 67 : insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.logo}>RIGOR</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Feather name="target" size={48} color={Colors.light.textTertiary} />
          <Text style={styles.emptyTitle}>{t.today.noContract}</Text>
          <Text style={styles.emptyText}>{t.today.noContractDesc}</Text>
          <Pressable
            style={({ pressed }) => [styles.signButton, pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] }]}
            onPress={() => router.push('/create-contract')}
          >
            <Text style={styles.signButtonText}>{t.today.signFirst}</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: Platform.OS === 'web' ? 67 : insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.logo}>RIGOR</Text>
        <View style={styles.dayBadge}>
          <Text style={styles.dayBadgeText}>{t.today.day} {dayNumber}</Text>
        </View>
        <Pressable style={styles.headerIcon} onPress={() => router.push('/share-card')}>
          <Feather name="download" size={20} color={Colors.light.text} />
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.dateLabel}>{dayOfMonth} {dayName}</Text>
        <Text style={styles.clock}>{hours}:{minutes}</Text>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{completed}</Text>
            <Text style={styles.statLabel}>{t.today.completed}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{failed}</Text>
            <Text style={styles.statLabel}>{t.today.failed}</Text>
          </View>
        </View>

        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBarFill, { width: `${Math.min(progress * 100, 100)}%` }]} />
        </View>

        <View style={styles.divider} />

        <Text style={styles.ruleText}>{contract.rule} {t.today.before} {deadlineStr}</Text>

        <View style={styles.metaRow}>
          <Text style={styles.metaText}>{remaining}d {t.today.remaining}</Text>
          <Text style={styles.metaText}>{t.today.streak}: {streak}</Text>
          <Text style={styles.noReturn}>{t.today.noReturn}</Text>
        </View>
      </View>

      {todayDone ? (
        <Text style={styles.dayCompleted}>{t.today.dayCompleted}</Text>
      ) : (
        <Animated.View style={buttonAnimStyle}>
          <Pressable
            style={({ pressed }) => [styles.doneButton, pressed && { opacity: 0.9 }]}
            onPress={handleDone}
          >
            <Text style={styles.doneButtonText}>{t.today.done}</Text>
          </Pressable>
        </Animated.View>
      )}

      <Modal visible={showFailureModal} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.failureModal}>
            <Text style={styles.failureLogo}>RIGOR</Text>

            <Text style={styles.failureTitle}>{(t.today as any).newDay}</Text>
            <Text style={styles.failureQuestion}>{(t.today as any).newDayQuestion}</Text>

            <Pressable
              style={({ pressed }) => [styles.failureYesButton, pressed && { opacity: 0.9 }]}
              onPress={() => handleFailureResponse(true)}
            >
              <Text style={styles.failureYesText}>{(t.today as any).yesCompleted}</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.failureNoButton, pressed && { opacity: 0.9 }]}
              onPress={() => handleFailureResponse(false)}
            >
              <Text style={styles.failureNoText}>{(t.today as any).noFailed}</Text>
            </Pressable>

            <Text style={styles.failureHint}>{(t.today as any).beHonest}</Text>
          </View>
        </View>
      </Modal>
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
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  logo: {
    fontFamily: "Rubik_800ExtraBold",
    fontSize: 18,
    color: Colors.light.text,
    letterSpacing: 1,
  },
  dayBadge: {
    backgroundColor: Colors.light.primary,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginLeft: "auto",
    marginRight: 12,
  },
  dayBadgeText: {
    fontFamily: "Rubik_700Bold",
    fontSize: 13,
    color: "#fff",
    letterSpacing: 0.5,
  },
  headerIcon: {
    padding: 4,
  },
  card: {
    backgroundColor: Colors.light.surface,
    borderRadius: 16,
    marginHorizontal: 20,
    marginTop: 8,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  dateLabel: {
    fontFamily: "Rubik_400Regular",
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginBottom: 4,
  },
  clock: {
    fontFamily: "Rubik_700Bold",
    fontSize: 56,
    color: Colors.light.text,
    letterSpacing: -2,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: "row",
    gap: 32,
    marginBottom: 16,
  },
  statItem: {
    alignItems: "center",
  },
  statNumber: {
    fontFamily: "Rubik_700Bold",
    fontSize: 22,
    color: Colors.light.text,
  },
  statLabel: {
    fontFamily: "Rubik_500Medium",
    fontSize: 10,
    color: Colors.light.textTertiary,
    letterSpacing: 0.5,
    marginTop: 2,
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: Colors.light.progressBg,
    borderRadius: 3,
    marginBottom: 16,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: Colors.light.progressFill,
    borderRadius: 3,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.light.borderLight,
    marginBottom: 14,
  },
  ruleText: {
    fontFamily: "Rubik_400Regular",
    fontSize: 14,
    color: Colors.light.text,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: "row",
    gap: 16,
    alignItems: "center",
  },
  metaText: {
    fontFamily: "Rubik_400Regular",
    fontSize: 12,
    color: Colors.light.textTertiary,
  },
  noReturn: {
    fontFamily: "Rubik_600SemiBold",
    fontSize: 12,
    color: Colors.light.primary,
  },
  dayCompleted: {
    fontFamily: "Rubik_400Regular",
    fontSize: 14,
    color: Colors.light.textTertiary,
    textAlign: "center",
    marginTop: 32,
  },
  doneButton: {
    backgroundColor: Colors.light.primary,
    marginHorizontal: 20,
    marginTop: 24,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: "center",
  },
  doneButtonText: {
    fontFamily: "Rubik_700Bold",
    fontSize: 18,
    color: "#fff",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    gap: 12,
  },
  emptyTitle: {
    fontFamily: "Rubik_600SemiBold",
    fontSize: 20,
    color: Colors.light.text,
    marginTop: 8,
  },
  emptyText: {
    fontFamily: "Rubik_400Regular",
    fontSize: 14,
    color: Colors.light.textTertiary,
    textAlign: "center",
  },
  signButton: {
    backgroundColor: Colors.light.primary,
    borderRadius: 16,
    paddingHorizontal: 32,
    paddingVertical: 16,
    marginTop: 16,
  },
  signButtonText: {
    fontFamily: "Rubik_700Bold",
    fontSize: 16,
    color: "#fff",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 28,
  },
  failureModal: {
    backgroundColor: Colors.light.surface,
    borderRadius: 24,
    padding: 32,
    width: "100%",
    alignItems: "center",
    borderWidth: 3,
    borderColor: Colors.light.primary,
  },
  failureLogo: {
    fontFamily: "Rubik_800ExtraBold",
    fontSize: 22,
    color: Colors.light.primary,
    letterSpacing: 2,
    marginBottom: 20,
  },
  failureTitle: {
    fontFamily: "Rubik_700Bold",
    fontSize: 24,
    color: Colors.light.text,
    marginBottom: 8,
  },
  failureQuestion: {
    fontFamily: "Rubik_400Regular",
    fontSize: 15,
    color: Colors.light.textSecondary,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },
  failureYesButton: {
    backgroundColor: Colors.light.primary,
    width: "100%",
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: "center",
    marginBottom: 12,
  },
  failureYesText: {
    fontFamily: "Rubik_700Bold",
    fontSize: 17,
    color: "#fff",
  },
  failureNoButton: {
    backgroundColor: Colors.light.surface,
    width: "100%",
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: Colors.light.border,
    marginBottom: 16,
  },
  failureNoText: {
    fontFamily: "Rubik_600SemiBold",
    fontSize: 16,
    color: Colors.light.text,
  },
  failureHint: {
    fontFamily: "Rubik_400Regular",
    fontSize: 13,
    color: Colors.light.textTertiary,
    textAlign: "center",
  },
});
