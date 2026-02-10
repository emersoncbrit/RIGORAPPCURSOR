import React from "react";
import { StyleSheet, Text, View, ScrollView, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, Feather } from "@expo/vector-icons";
import Colors from "@/constants/colors";
import { useRigor } from "@/lib/rigor-context";
import { useI18n } from "@/lib/i18n";

function ConsistencyDot({ status }: { status: 'done' | 'fail' | 'critical' | 'empty' }) {
  const color = status === 'done' ? Colors.light.dotDone
    : status === 'fail' ? Colors.light.dotFail
    : status === 'critical' ? Colors.light.dotCritical
    : Colors.light.dot;
  return <View style={[styles.dot, { backgroundColor: color }]} />;
}

export default function ProgressScreen() {
  const insets = useSafeAreaInsets();
  const { contract, dayRecords, getCompletionRate, getCompletedCount, getFailedCount, getBestStreak, getCurrentStreak } = useRigor();
  const { t } = useI18n();

  const rate = getCompletionRate();
  const done = getCompletedCount();
  const fails = getFailedCount();
  const bestStreak = getBestStreak();
  const currentStreak = getCurrentStreak();
  const duration = contract?.duration ?? 30;

  const dots: Array<'done' | 'fail' | 'critical' | 'empty'> = [];
  if (contract) {
    for (let i = 0; i < duration; i++) {
      const d = new Date(contract.start_date + 'T00:00:00');
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      const record = dayRecords.find(r => r.date === dateStr);
      if (record) {
        if (record.critical) dots.push('critical');
        else if (record.failed) dots.push('fail');
        else if (record.completed) dots.push('done');
        else dots.push('empty');
      } else {
        dots.push('empty');
      }
    }
  } else {
    for (let i = 0; i < 30; i++) dots.push('empty');
  }

  return (
    <ScrollView
      style={[styles.container]}
      contentContainerStyle={{ paddingTop: Platform.OS === 'web' ? 67 : insets.top + 16, paddingBottom: 120 }}
      contentInsetAdjustmentBehavior="automatic"
    >
      <Text style={styles.title}>{t.progress.title}</Text>
      <Text style={styles.subtitle}>{contract?.rule ?? 'Workout'}</Text>

      <View style={styles.dropdownContainer}>
        <Text style={styles.dropdownText}>
          {contract?.rule ?? 'Workout'} — {duration}d {contract ? `(${t.progress.active})` : ''}
        </Text>
        <Feather name="chevron-down" size={18} color={Colors.light.textSecondary} />
      </View>

      <View style={styles.statsCards}>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: Colors.light.primary }]}>{rate}%</Text>
          <Text style={styles.statCardLabel}>{t.progress.rate}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{done}</Text>
          <Text style={styles.statCardLabel}>{t.progress.done}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{fails}</Text>
          <Text style={styles.statCardLabel}>{t.progress.fails}</Text>
        </View>
      </View>

      <View style={styles.mapCard}>
        <Text style={styles.mapTitle}>{t.progress.consistencyMap}</Text>
        <View style={styles.dotsGrid}>
          {dots.map((status, i) => (
            <ConsistencyDot key={i} status={status} />
          ))}
        </View>
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: Colors.light.dotDone }]} />
            <Text style={styles.legendText}>{t.progress.legendDone}</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: Colors.light.dotFail }]} />
            <Text style={styles.legendText}>{t.progress.legendFail}</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: Colors.light.dotCritical }]} />
            <Text style={styles.legendText}>{t.progress.legendCritical}</Text>
          </View>
        </View>
      </View>

      <Text style={styles.insightsTitle}>{t.progress.insights}</Text>

      <View style={styles.insightCard}>
        <View style={[styles.insightIcon, { backgroundColor: '#FFF3E0' }]}>
          <Ionicons name="flame" size={20} color={Colors.light.primary} />
        </View>
        <Text style={styles.insightLabel}>{t.progress.bestStreak}</Text>
        <Text style={styles.insightValue}>{bestStreak} {bestStreak === 1 ? t.progress.day : t.progress.days}</Text>
      </View>

      <View style={styles.insightCard}>
        <View style={[styles.insightIcon, { backgroundColor: '#FFF3E0' }]}>
          <Ionicons name="trending-up" size={20} color={Colors.light.primary} />
        </View>
        <Text style={styles.insightLabel}>{t.progress.currentStreak}</Text>
        <Text style={styles.insightValue}>{currentStreak} {currentStreak === 1 ? t.progress.day : t.progress.days}</Text>
      </View>
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
    marginBottom: 2,
  },
  subtitle: {
    fontFamily: "Rubik_400Regular",
    fontSize: 14,
    color: Colors.light.textTertiary,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  dropdownContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.light.surface,
    marginHorizontal: 20,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginBottom: 20,
  },
  dropdownText: {
    fontFamily: "Rubik_400Regular",
    fontSize: 14,
    color: Colors.light.text,
  },
  statsCards: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.light.surface,
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  statValue: {
    fontFamily: "Rubik_700Bold",
    fontSize: 26,
    color: Colors.light.text,
    marginBottom: 4,
  },
  statCardLabel: {
    fontFamily: "Rubik_500Medium",
    fontSize: 10,
    color: Colors.light.textTertiary,
    letterSpacing: 0.5,
  },
  mapCard: {
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
  mapTitle: {
    fontFamily: "Rubik_600SemiBold",
    fontSize: 11,
    color: Colors.light.textTertiary,
    letterSpacing: 1,
    marginBottom: 16,
  },
  dotsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 16,
  },
  dot: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  legendRow: {
    flexDirection: "row",
    gap: 20,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontFamily: "Rubik_400Regular",
    fontSize: 12,
    color: Colors.light.textTertiary,
  },
  insightsTitle: {
    fontFamily: "Rubik_600SemiBold",
    fontSize: 11,
    color: Colors.light.textTertiary,
    letterSpacing: 1,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  insightCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.surface,
    marginHorizontal: 20,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  insightIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  insightLabel: {
    fontFamily: "Rubik_400Regular",
    fontSize: 14,
    color: Colors.light.text,
    flex: 1,
  },
  insightValue: {
    fontFamily: "Rubik_700Bold",
    fontSize: 16,
    color: Colors.light.text,
  },
});
