import React from "react";
import { StyleSheet, Text, View, ScrollView, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons, Feather, FontAwesome } from "@expo/vector-icons";
import Colors from "@/constants/colors";
import { useRigor } from "@/lib/rigor-context";
import { useI18n } from "@/lib/i18n";

interface Achievement {
  id: string;
  nameKey: string;
  descKey: string;
  target: number;
  icon: React.ReactNode;
  iconBgColor: string;
}

const achievementDefs: Achievement[] = [
  { id: '1', nameKey: 'firstStep', descKey: 'firstStepDesc', target: 1, icon: <Ionicons name="flash" size={18} color={Colors.light.primary} />, iconBgColor: '#FFF3E0' },
  { id: '2', nameKey: 'solidStart', descKey: 'solidStartDesc', target: 3, icon: <Ionicons name="flash-outline" size={18} color={Colors.light.textTertiary} />, iconBgColor: Colors.light.surfaceSecondary },
  { id: '3', nameKey: 'steadyHand', descKey: 'steadyHandDesc', target: 5, icon: <Feather name="target" size={18} color={Colors.light.textTertiary} />, iconBgColor: Colors.light.surfaceSecondary },
  { id: '4', nameKey: 'weekWarrior', descKey: 'weekWarriorDesc', target: 7, icon: <MaterialCommunityIcons name="shield-outline" size={18} color={Colors.light.textTertiary} />, iconBgColor: Colors.light.surfaceSecondary },
  { id: '5', nameKey: 'doubleDigits', descKey: 'doubleDigitsDesc', target: 10, icon: <Ionicons name="diamond-outline" size={18} color={Colors.light.textTertiary} />, iconBgColor: Colors.light.surfaceSecondary },
  { id: '6', nameKey: 'twoWeeks', descKey: 'twoWeeksDesc', target: 14, icon: <Feather name="calendar" size={18} color={Colors.light.textTertiary} />, iconBgColor: Colors.light.surfaceSecondary },
  { id: '7', nameKey: 'habit21', descKey: 'habit21Desc', target: 21, icon: <MaterialCommunityIcons name="circle-multiple-outline" size={18} color={Colors.light.textTertiary} />, iconBgColor: Colors.light.surfaceSecondary },
  { id: '8', nameKey: 'monthMaster', descKey: 'monthMasterDesc', target: 30, icon: <FontAwesome name="star-o" size={18} color={Colors.light.textTertiary} />, iconBgColor: Colors.light.surfaceSecondary },
  { id: '9', nameKey: 'halfwayThere', descKey: 'halfwayThereDesc', target: 33, icon: <Ionicons name="flag-outline" size={18} color={Colors.light.textTertiary} />, iconBgColor: Colors.light.surfaceSecondary },
  { id: '10', nameKey: 'ironWill', descKey: 'ironWillDesc', target: 40, icon: <Feather name="shield" size={18} color={Colors.light.textTertiary} />, iconBgColor: Colors.light.surfaceSecondary },
  { id: '11', nameKey: 'unstoppable', descKey: 'unstoppableDesc', target: 50, icon: <Ionicons name="rocket-outline" size={18} color={Colors.light.textTertiary} />, iconBgColor: Colors.light.surfaceSecondary },
  { id: '12', nameKey: 'diamondHands', descKey: 'diamondHandsDesc', target: 60, icon: <Ionicons name="diamond-outline" size={18} color={Colors.light.textTertiary} />, iconBgColor: Colors.light.surfaceSecondary },
  { id: '13', nameKey: 'trueDiscipline', descKey: 'trueDisciplineDesc', target: 66, icon: <MaterialCommunityIcons name="crown-outline" size={18} color={Colors.light.textTertiary} />, iconBgColor: Colors.light.surfaceSecondary },
  { id: '14', nameKey: 'zeroFails', descKey: 'zeroFailsDesc', target: -1, icon: <Ionicons name="checkmark-done-outline" size={18} color={Colors.light.textTertiary} />, iconBgColor: Colors.light.surfaceSecondary },
  { id: '15', nameKey: 'legend', descKey: 'legendDesc', target: -2, icon: <Ionicons name="medal-outline" size={18} color={Colors.light.textTertiary} />, iconBgColor: Colors.light.surfaceSecondary },
];

export default function TrophiesScreen() {
  const insets = useSafeAreaInsets();
  const { getCompletedCount } = useRigor();
  const { t } = useI18n();
  const completed = getCompletedCount();

  const unlockedCount = achievementDefs.filter(a => a.target > 0 && completed >= a.target).length;
  const totalProgress = Math.round((unlockedCount / achievementDefs.length) * 100);

  const achievements = t.trophies.achievements;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingTop: Platform.OS === 'web' ? 67 : insets.top + 16, paddingBottom: 120 }}
      contentInsetAdjustmentBehavior="automatic"
    >
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>{t.trophies.title}</Text>
          <Text style={styles.subtitle}>{completed} {t.trophies.daysCompleted}</Text>
        </View>
        <Text style={styles.counter}>{unlockedCount}/{achievementDefs.length}</Text>
      </View>

      <View style={styles.progressRow}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${totalProgress}%` }]} />
        </View>
        <Text style={styles.progressPercent}>{totalProgress}%</Text>
      </View>

      {achievementDefs.map((def) => {
        const unlocked = def.target > 0 && completed >= def.target;
        const progress = def.target > 0 ? Math.min(completed, def.target) : 0;
        const name = achievements[def.nameKey as keyof typeof achievements] || def.nameKey;
        const desc = achievements[def.descKey as keyof typeof achievements] || def.descKey;

        return (
          <View key={def.id} style={styles.achievementCard}>
            <View style={[styles.achievementIcon, { backgroundColor: unlocked ? '#FFF3E0' : Colors.light.surfaceSecondary }]}>
              {unlocked ? (
                <Ionicons name="flash" size={18} color={Colors.light.primary} />
              ) : def.icon}
            </View>
            <View style={styles.achievementInfo}>
              <Text style={[styles.achievementName, !unlocked && { color: Colors.light.textTertiary }]}>
                {name}
              </Text>
              <Text style={styles.achievementDesc}>{desc}</Text>
            </View>
            {def.target > 0 && (
              <Text style={[styles.achievementProgress, unlocked && { color: Colors.light.primary }]}>
                {progress}/{def.target}
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
