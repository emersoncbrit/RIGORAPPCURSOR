import React, { useState } from "react";
import { StyleSheet, Text, View, Pressable, TextInput, ScrollView, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Feather, Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";
import Colors from "@/constants/colors";
import { useRigor } from "@/lib/rigor-context";
import { useI18n } from "@/lib/i18n";

const DURATIONS = [14, 30, 66];

export default function CreateContractScreen() {
  const insets = useSafeAreaInsets();
  const { signContract } = useRigor();
  const { t } = useI18n();
  const [step, setStep] = useState(0);
  const [rule, setRule] = useState("");
  const [deadlineHour, setDeadlineHour] = useState(23);
  const [deadlineMinute, setDeadlineMinute] = useState(0);
  const [duration, setDuration] = useState(30);

  const handleSign = async () => {
    if (!rule.trim()) return;
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    await signContract(rule.trim(), deadlineHour, deadlineMinute, duration);
    router.back();
  };

  const adjustHour = (delta: number) => {
    setDeadlineHour((prev) => {
      const next = prev + delta;
      if (next < 0) return 23;
      if (next > 23) return 0;
      return next;
    });
    if (Platform.OS !== 'web') Haptics.selectionAsync();
  };

  const adjustMinute = (delta: number) => {
    setDeadlineMinute((prev) => {
      const next = prev + delta;
      if (next < 0) return 45;
      if (next > 59) return 0;
      return Math.floor(next / 15) * 15;
    });
    if (Platform.OS !== 'web') Haptics.selectionAsync();
  };

  return (
    <View style={[styles.container, { paddingTop: Platform.OS === 'web' ? 67 : insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.closeBtn}>
          <Feather name="x" size={24} color={Colors.light.text} />
        </Pressable>
        <Text style={styles.headerTitle}>{t.createContract.title}</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {step === 0 && (
          <Animated.View entering={Platform.OS !== 'web' ? FadeInDown.duration(300) : undefined}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>01</Text>
            </View>
            <Text style={styles.stepTitle}>{t.createContract.step1Title}</Text>
            <Text style={styles.stepDesc}>{t.createContract.step1Desc}</Text>
            <TextInput
              style={styles.ruleInput}
              placeholder={t.createContract.inputPlaceholder}
              placeholderTextColor={Colors.light.textTertiary}
              value={rule}
              onChangeText={setRule}
              autoFocus
              multiline={false}
            />
            <View style={styles.examplesContainer}>
              {['Workout', 'Study for 1 hour', 'Wake up at 5am', 'No sugar', 'Read 30 pages'].map((ex) => (
                <Pressable
                  key={ex}
                  style={({ pressed }) => [styles.exampleChip, pressed && { opacity: 0.7 }]}
                  onPress={() => setRule(ex)}
                >
                  <Text style={styles.exampleText}>{ex}</Text>
                </Pressable>
              ))}
            </View>
            <Pressable
              style={({ pressed }) => [styles.nextButton, !rule.trim() && { opacity: 0.4 }, pressed && { opacity: 0.85 }]}
              onPress={() => rule.trim() && setStep(1)}
              disabled={!rule.trim()}
            >
              <Text style={styles.nextButtonText}>{t.createContract.next}</Text>
            </Pressable>
          </Animated.View>
        )}

        {step === 1 && (
          <Animated.View entering={Platform.OS !== 'web' ? FadeInDown.duration(300) : undefined}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>02</Text>
            </View>
            <Text style={styles.stepTitle}>{t.createContract.step2Title}</Text>
            <Text style={styles.stepDesc}>{t.createContract.step2Desc}</Text>

            <View style={styles.timePickerContainer}>
              <View style={styles.timeColumn}>
                <Pressable onPress={() => adjustHour(1)} style={styles.timeArrow}>
                  <Feather name="chevron-up" size={28} color={Colors.light.textTertiary} />
                </Pressable>
                <Text style={styles.timeValue}>{deadlineHour.toString().padStart(2, '0')}</Text>
                <Pressable onPress={() => adjustHour(-1)} style={styles.timeArrow}>
                  <Feather name="chevron-down" size={28} color={Colors.light.textTertiary} />
                </Pressable>
              </View>
              <Text style={styles.timeSeparator}>:</Text>
              <View style={styles.timeColumn}>
                <Pressable onPress={() => adjustMinute(15)} style={styles.timeArrow}>
                  <Feather name="chevron-up" size={28} color={Colors.light.textTertiary} />
                </Pressable>
                <Text style={styles.timeValue}>{deadlineMinute.toString().padStart(2, '0')}</Text>
                <Pressable onPress={() => adjustMinute(-15)} style={styles.timeArrow}>
                  <Feather name="chevron-down" size={28} color={Colors.light.textTertiary} />
                </Pressable>
              </View>
            </View>

            <Text style={styles.deadlineNote}>{t.createContract.deadlineNote}</Text>

            <View style={styles.buttonRow}>
              <Pressable style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.7 }]} onPress={() => setStep(0)}>
                <Feather name="arrow-left" size={20} color={Colors.light.text} />
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.nextButton, { flex: 1 }, pressed && { opacity: 0.85 }]}
                onPress={() => setStep(2)}
              >
                <Text style={styles.nextButtonText}>{t.createContract.next}</Text>
              </Pressable>
            </View>
          </Animated.View>
        )}

        {step === 2 && (
          <Animated.View entering={Platform.OS !== 'web' ? FadeInDown.duration(300) : undefined}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>03</Text>
            </View>
            <Text style={styles.stepTitle}>{t.createContract.step3Title}</Text>
            <Text style={styles.stepDesc}>{t.createContract.step3Desc}</Text>

            <View style={styles.durationOptions}>
              {DURATIONS.map((d) => (
                <Pressable
                  key={d}
                  style={[styles.durationOption, duration === d && styles.durationSelected]}
                  onPress={() => {
                    setDuration(d);
                    if (Platform.OS !== 'web') Haptics.selectionAsync();
                  }}
                >
                  <Text style={[styles.durationNumber, duration === d && styles.durationNumberSelected]}>{d}</Text>
                  <Text style={[styles.durationLabel, duration === d && styles.durationLabelSelected]}>{t.createContract.days}</Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.contractSummary}>
              <Text style={styles.summaryTitle}>{t.createContract.contractSummary}</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>{t.createContract.rule}</Text>
                <Text style={styles.summaryValue}>{rule}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>{t.createContract.deadline}</Text>
                <Text style={styles.summaryValue}>
                  {deadlineHour.toString().padStart(2, '0')}:{deadlineMinute.toString().padStart(2, '0')}
                </Text>
              </View>
              <View style={[styles.summaryRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.summaryLabel}>{t.createContract.duration}</Text>
                <Text style={styles.summaryValue}>{duration} {t.createContract.days}</Text>
              </View>
            </View>

            <View style={styles.warningBox}>
              <Ionicons name="warning" size={16} color={Colors.light.primary} />
              <Text style={styles.warningText}>{t.createContract.warning}</Text>
            </View>

            <View style={styles.buttonRow}>
              <Pressable style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.7 }]} onPress={() => setStep(1)}>
                <Feather name="arrow-left" size={20} color={Colors.light.text} />
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.signButton, { flex: 1 }, pressed && { opacity: 0.85 }]}
                onPress={handleSign}
              >
                <Text style={styles.signButtonText}>{t.createContract.signContract}</Text>
              </Pressable>
            </View>
          </Animated.View>
        )}
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
    paddingTop: 16,
    paddingBottom: 60,
  },
  stepBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.light.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  stepBadgeText: {
    fontFamily: "Rubik_700Bold",
    fontSize: 14,
    color: "#fff",
  },
  stepTitle: {
    fontFamily: "Rubik_700Bold",
    fontSize: 24,
    color: Colors.light.text,
    marginBottom: 8,
  },
  stepDesc: {
    fontFamily: "Rubik_400Regular",
    fontSize: 14,
    color: Colors.light.textTertiary,
    lineHeight: 20,
    marginBottom: 24,
  },
  ruleInput: {
    fontFamily: "Rubik_400Regular",
    fontSize: 16,
    borderWidth: 1.5,
    borderColor: Colors.light.border,
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 16,
    color: Colors.light.text,
    backgroundColor: Colors.light.surface,
    marginBottom: 16,
  },
  examplesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 32,
  },
  exampleChip: {
    backgroundColor: Colors.light.surfaceSecondary,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  exampleText: {
    fontFamily: "Rubik_400Regular",
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  nextButton: {
    backgroundColor: Colors.light.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  nextButtonText: {
    fontFamily: "Rubik_700Bold",
    fontSize: 16,
    color: "#fff",
  },
  timePickerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    marginBottom: 20,
  },
  timeColumn: {
    alignItems: "center",
    gap: 4,
  },
  timeArrow: {
    padding: 8,
  },
  timeValue: {
    fontFamily: "Rubik_700Bold",
    fontSize: 48,
    color: Colors.light.text,
    width: 80,
    textAlign: "center",
  },
  timeSeparator: {
    fontFamily: "Rubik_700Bold",
    fontSize: 48,
    color: Colors.light.text,
  },
  deadlineNote: {
    fontFamily: "Rubik_400Regular",
    fontSize: 12,
    color: Colors.light.textTertiary,
    textAlign: "center",
    marginBottom: 32,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "stretch",
  },
  backButton: {
    width: 52,
    height: 52,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.light.border,
    alignItems: "center",
    justifyContent: "center",
  },
  durationOptions: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  durationOption: {
    flex: 1,
    backgroundColor: Colors.light.surface,
    borderRadius: 14,
    paddingVertical: 24,
    alignItems: "center",
    borderWidth: 2,
    borderColor: Colors.light.border,
  },
  durationSelected: {
    borderColor: Colors.light.primary,
    backgroundColor: '#FFF3E0',
  },
  durationNumber: {
    fontFamily: "Rubik_700Bold",
    fontSize: 28,
    color: Colors.light.text,
  },
  durationNumberSelected: {
    color: Colors.light.primary,
  },
  durationLabel: {
    fontFamily: "Rubik_400Regular",
    fontSize: 13,
    color: Colors.light.textTertiary,
    marginTop: 2,
  },
  durationLabelSelected: {
    color: Colors.light.primary,
  },
  contractSummary: {
    backgroundColor: Colors.light.surface,
    borderRadius: 14,
    padding: 18,
    marginBottom: 16,
  },
  summaryTitle: {
    fontFamily: "Rubik_600SemiBold",
    fontSize: 14,
    color: Colors.light.text,
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderLight,
  },
  summaryLabel: {
    fontFamily: "Rubik_400Regular",
    fontSize: 14,
    color: Colors.light.textTertiary,
  },
  summaryValue: {
    fontFamily: "Rubik_500Medium",
    fontSize: 14,
    color: Colors.light.text,
  },
  warningBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    padding: 14,
    marginBottom: 24,
  },
  warningText: {
    fontFamily: "Rubik_400Regular",
    fontSize: 12,
    color: Colors.light.textSecondary,
    flex: 1,
    lineHeight: 18,
  },
  signButton: {
    backgroundColor: Colors.light.text,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  signButtonText: {
    fontFamily: "Rubik_700Bold",
    fontSize: 16,
    color: "#fff",
  },
});
