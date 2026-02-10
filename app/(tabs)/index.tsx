import React, { useState, useEffect } from "react";
import { StyleSheet, Text, View, Pressable, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withSequence, withTiming } from "react-native-reanimated";
import Colors from "@/constants/colors";
import { useRigor } from "@/lib/rigor-context";

export default function TodayScreen() {
  const insets = useSafeAreaInsets();
  const { contract, markDone, getDayNumber, getCompletedCount, getFailedCount, getCurrentStreak, getDaysRemaining, getCurrentDeadline, isTodayCompleted } = useRigor();
  const [currentTime, setCurrentTime] = useState(new Date());
  const buttonScale = useSharedValue(1);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const dayNumber = getDayNumber();
  const completed = getCompletedCount();
  const failed = getFailedCount();
  const streak = getCurrentStreak();
  const remaining = getDaysRemaining();
  const deadline = getCurrentDeadline();
  const todayDone = isTodayCompleted();
  const total = contract ? contract.duration : 1;
  const progress = total > 0 ? (completed / total) : 0;

  const dayName = currentTime.toLocaleDateString('en-US', { weekday: 'long' });
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
          <Text style={styles.emptyTitle}>No active contract</Text>
          <Text style={styles.emptyText}>Sign your first contract to begin.</Text>
          <Pressable
            style={({ pressed }) => [styles.signButton, pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] }]}
            onPress={() => router.push('/create-contract')}
          >
            <Text style={styles.signButtonText}>Sign my first contract</Text>
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
          <Text style={styles.dayBadgeText}>DAY {dayNumber}</Text>
        </View>
        <Pressable style={styles.headerIcon}>
          <Feather name="download" size={20} color={Colors.light.text} />
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.dateLabel}>{dayOfMonth} {dayName}</Text>
        <Text style={styles.clock}>{hours}:{minutes}</Text>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{completed}</Text>
            <Text style={styles.statLabel}>COMPLETED</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{failed}</Text>
            <Text style={styles.statLabel}>FAILED</Text>
          </View>
        </View>

        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBarFill, { width: `${Math.min(progress * 100, 100)}%` }]} />
        </View>

        <View style={styles.divider} />

        <Text style={styles.ruleText}>{contract.rule} before {deadlineStr}</Text>

        <View style={styles.metaRow}>
          <Text style={styles.metaText}>{remaining}d remaining</Text>
          <Text style={styles.metaText}>Streak: {streak}</Text>
          <Text style={styles.noReturn}>No return</Text>
        </View>
      </View>

      {todayDone ? (
        <Text style={styles.dayCompleted}>Day completed</Text>
      ) : (
        <Animated.View style={buttonAnimStyle}>
          <Pressable
            style={({ pressed }) => [styles.doneButton, pressed && { opacity: 0.9 }]}
            onPress={handleDone}
          >
            <Text style={styles.doneButtonText}>Done</Text>
          </Pressable>
        </Animated.View>
      )}
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
});
