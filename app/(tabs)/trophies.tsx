import React from "react";
import { StyleSheet, Text, View, ScrollView, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons, Feather, FontAwesome } from "@expo/vector-icons";
import Colors from "@/constants/colors";
import { useRigor } from "@/lib/rigor-context";

interface Achievement {
  id: string;
  name: string;
  description: string;
  target: number;
  icon: React.ReactNode;
  iconBgColor: string;
}

const achievements: Achievement[] = [
  { id: '1', name: 'First Step', description: 'Complete your first day', target: 1, icon: <Ionicons name="flash" size={18} color={Colors.light.primary} />, iconBgColor: '#FFF3E0' },
  { id: '2', name: 'Solid Start', description: 'Complete 3 consecutive days', target: 3, icon: <Ionicons name="flash-outline" size={18} color={Colors.light.textTertiary} />, iconBgColor: Colors.light.surfaceSecondary },
  { id: '3', name: 'Steady Hand', description: 'Complete 5 days', target: 5, icon: <Feather name="target" size={18} color={Colors.light.textTertiary} />, iconBgColor: Colors.light.surfaceSecondary },
  { id: '4', name: 'Week Warrior', description: 'Complete 7 days', target: 7, icon: <MaterialCommunityIcons name="shield-outline" size={18} color={Colors.light.textTertiary} />, iconBgColor: Colors.light.surfaceSecondary },
  { id: '5', name: 'Double Digits', description: 'Complete 10 days', target: 10, icon: <Ionicons name="diamond-outline" size={18} color={Colors.light.textTertiary} />, iconBgColor: Colors.light.surfaceSecondary },
  { id: '6', name: 'Two Weeks', description: 'Complete 14 days', target: 14, icon: <Feather name="calendar" size={18} color={Colors.light.textTertiary} />, iconBgColor: Colors.light.surfaceSecondary },
  { id: '7', name: '21-Day Habit', description: 'Complete 21 days', target: 21, icon: <MaterialCommunityIcons name="circle-multiple-outline" size={18} color={Colors.light.textTertiary} />, iconBgColor: Colors.light.surfaceSecondary },
  { id: '8', name: 'Month Master', description: 'Complete 30 days', target: 30, icon: <FontAwesome name="star-o" size={18} color={Colors.light.textTertiary} />, iconBgColor: Colors.light.surfaceSecondary },
  { id: '9', name: 'Halfway There', description: 'Complete 33 days', target: 33, icon: <Ionicons name="flag-outline" size={18} color={Colors.light.textTertiary} />, iconBgColor: Colors.light.surfaceSecondary },
  { id: '10', name: 'Iron Will', description: 'Complete 40 days', target: 40, icon: <Feather name="shield" size={18} color={Colors.light.textTertiary} />, iconBgColor: Colors.light.surfaceSecondary },
  { id: '11', name: 'Unstoppable', description: 'Complete 50 days', target: 50, icon: <Ionicons name="rocket-outline" size={18} color={Colors.light.textTertiary} />, iconBgColor: Colors.light.surfaceSecondary },
  { id: '12', name: 'Diamond Hands', description: 'Complete 60 days', target: 60, icon: <Ionicons name="diamond-outline" size={18} color={Colors.light.textTertiary} />, iconBgColor: Colors.light.surfaceSecondary },
  { id: '13', name: 'True Discipline', description: 'Complete 66 days', target: 66, icon: <MaterialCommunityIcons name="crown-outline" size={18} color={Colors.light.textTertiary} />, iconBgColor: Colors.light.surfaceSecondary },
  { id: '14', name: 'Zero Fails', description: 'Complete contract with 0 fails', target: -1, icon: <Ionicons name="checkmark-done-outline" size={18} color={Colors.light.textTertiary} />, iconBgColor: Colors.light.surfaceSecondary },
  { id: '15', name: 'Legend', description: 'Complete 3 contracts', target: -2, icon: <Ionicons name="medal-outline" size={18} color={Colors.light.textTertiary} />, iconBgColor: Colors.light.surfaceSecondary },
];

export default function TrophiesScreen() {
  const insets = useSafeAreaInsets();
  const { getCompletedCount } = useRigor();
  const completed = getCompletedCount();

  const unlockedCount = achievements.filter(a => a.target > 0 && completed >= a.target).length;
  const totalProgress = Math.round((unlockedCount / achievements.length) * 100);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingTop: Platform.OS === 'web' ? 67 : insets.top + 16, paddingBottom: 120 }}
      contentInsetAdjustmentBehavior="automatic"
    >
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Achievements</Text>
          <Text style={styles.subtitle}>{completed} days completed</Text>
        </View>
        <Text style={styles.counter}>{unlockedCount}/{achievements.length}</Text>
      </View>

      <View style={styles.progressRow}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${totalProgress}%` }]} />
        </View>
        <Text style={styles.progressPercent}>{totalProgress}%</Text>
      </View>

      {achievements.map((achievement) => {
        const unlocked = achievement.target > 0 && completed >= achievement.target;
        const progress = achievement.target > 0 ? Math.min(completed, achievement.target) : 0;

        return (
          <View key={achievement.id} style={styles.achievementCard}>
            <View style={[styles.achievementIcon, { backgroundColor: unlocked ? '#FFF3E0' : Colors.light.surfaceSecondary }]}>
              {unlocked ? (
                <Ionicons name="flash" size={18} color={Colors.light.primary} />
              ) : achievement.icon}
            </View>
            <View style={styles.achievementInfo}>
              <Text style={[styles.achievementName, !unlocked && { color: Colors.light.textTertiary }]}>
                {achievement.name}
              </Text>
              <Text style={styles.achievementDesc}>{achievement.description}</Text>
            </View>
            {achievement.target > 0 && (
              <Text style={[styles.achievementProgress, unlocked && { color: Colors.light.primary }]}>
                {progress}/{achievement.target}
              </Text>
            )}
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  title: {
    fontFamily: "Rubik_700Bold",
    fontSize: 28,
    color: Colors.light.text,
  },
  subtitle: {
    fontFamily: "Rubik_400Regular",
    fontSize: 13,
    color: Colors.light.textTertiary,
    marginTop: 2,
  },
  counter: {
    fontFamily: "Rubik_700Bold",
    fontSize: 20,
    color: Colors.light.text,
    marginTop: 6,
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 24,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: Colors.light.progressBg,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: Colors.light.primary,
    borderRadius: 3,
  },
  progressPercent: {
    fontFamily: "Rubik_600SemiBold",
    fontSize: 13,
    color: Colors.light.primary,
  },
  achievementCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderLight,
  },
  achievementIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementName: {
    fontFamily: "Rubik_600SemiBold",
    fontSize: 15,
    color: Colors.light.text,
    marginBottom: 2,
  },
  achievementDesc: {
    fontFamily: "Rubik_400Regular",
    fontSize: 12,
    color: Colors.light.textTertiary,
  },
  achievementProgress: {
    fontFamily: "Rubik_600SemiBold",
    fontSize: 14,
    color: Colors.light.textTertiary,
  },
});
