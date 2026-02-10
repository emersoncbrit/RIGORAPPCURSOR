import React, { useState } from "react";
import { StyleSheet, Text, View, Pressable, Modal, Platform } from "react-native";
import { Ionicons, Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { useI18n } from "@/lib/i18n";

interface ProUpgradeModalProps {
  visible: boolean;
  onClose: () => void;
}

type Plan = "monthly" | "annual";

export default function ProUpgradeModal({ visible, onClose }: ProUpgradeModalProps) {
  const { t } = useI18n();
  const [selectedPlan, setSelectedPlan] = useState<Plan>("annual");
  const pro = (t as any).pro;

  const handleSelect = (plan: Plan) => {
    setSelectedPlan(plan);
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleContinue = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Pressable style={styles.closeButton} onPress={onClose} hitSlop={12}>
            <Feather name="x" size={22} color={Colors.light.textTertiary} />
          </Pressable>

          <View style={styles.iconContainer}>
            <Ionicons name="flash" size={28} color="#fff" />
          </View>

          <Text style={styles.title}>{pro.upgradeTitle}</Text>
          <Text style={styles.subtitle}>{pro.upgradeSubtitle}</Text>

          <View style={styles.featuresCard}>
            <View style={styles.featureRow}>
              <Ionicons name="checkmark" size={18} color={Colors.light.primary} />
              <Text style={styles.featureText}>{pro.feature1}</Text>
            </View>
            <View style={styles.featureRow}>
              <Ionicons name="checkmark" size={18} color={Colors.light.primary} />
              <Text style={styles.featureText}>{pro.feature2}</Text>
            </View>
            <View style={styles.featureRow}>
              <Ionicons name="checkmark" size={18} color={Colors.light.primary} />
              <Text style={styles.featureText}>{pro.feature3}</Text>
            </View>
          </View>

          <Pressable
            style={[styles.planCard, selectedPlan === "monthly" && styles.planCardSelected]}
            onPress={() => handleSelect("monthly")}
          >
            <View style={styles.radioOuter}>
              {selectedPlan === "monthly" && <View style={styles.radioInner} />}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.planName}>{pro.monthly}</Text>
              <Text style={styles.planDesc}>{pro.monthlyDesc}</Text>
            </View>
            <Text style={styles.planPrice}>{pro.monthlyPrice}</Text>
          </Pressable>

          <Pressable
            style={[styles.planCard, selectedPlan === "annual" && styles.planCardSelected]}
            onPress={() => handleSelect("annual")}
          >
            <View style={styles.radioOuter}>
              {selectedPlan === "annual" && <View style={styles.radioInner} />}
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.planNameRow}>
                <Text style={styles.planName}>{pro.annual}</Text>
                <View style={styles.bestValueBadge}>
                  <Text style={styles.bestValueText}>{pro.annualBadge}</Text>
                </View>
              </View>
              <Text style={styles.planDesc}>{pro.annualDesc}</Text>
            </View>
            <Text style={styles.planPrice}>{pro.annualPrice}</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.continueButton, pressed && { opacity: 0.9 }]}
            onPress={handleContinue}
          >
            <Text style={styles.continueText}>{pro.continue}</Text>
          </Pressable>

          <View style={styles.linksRow}>
            <Text style={styles.linkText}>{pro.restorePurchase}</Text>
            <Text style={styles.linkSep}>|</Text>
            <Text style={styles.linkText}>{pro.termsOfUse}</Text>
            <Text style={styles.linkSep}>|</Text>
            <Text style={styles.linkText}>{pro.privacyPolicy}</Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  container: {
    backgroundColor: Colors.light.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: Platform.OS === "web" ? 34 : 44,
    alignItems: "center",
  },
  closeButton: {
    position: "absolute",
    top: 18,
    right: 18,
    zIndex: 10,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: Colors.light.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    marginTop: 8,
  },
  title: {
    fontFamily: "Rubik_700Bold",
    fontSize: 22,
    color: Colors.light.text,
    marginBottom: 6,
  },
  subtitle: {
    fontFamily: "Rubik_400Regular",
    fontSize: 14,
    color: Colors.light.textTertiary,
    marginBottom: 20,
  },
  featuresCard: {
    backgroundColor: Colors.light.background,
    borderRadius: 16,
    padding: 18,
    width: "100%",
    gap: 14,
    marginBottom: 20,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  featureText: {
    fontFamily: "Rubik_500Medium",
    fontSize: 15,
    color: Colors.light.text,
  },
  planCard: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    backgroundColor: Colors.light.background,
    borderRadius: 14,
    padding: 18,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: "transparent",
    gap: 14,
  },
  planCardSelected: {
    borderColor: Colors.light.primary,
    backgroundColor: "#FFF7F0",
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.light.border,
    alignItems: "center",
    justifyContent: "center",
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.light.primary,
  },
  planName: {
    fontFamily: "Rubik_600SemiBold",
    fontSize: 16,
    color: Colors.light.text,
  },
  planNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  planDesc: {
    fontFamily: "Rubik_400Regular",
    fontSize: 13,
    color: Colors.light.textTertiary,
    marginTop: 2,
  },
  planPrice: {
    fontFamily: "Rubik_700Bold",
    fontSize: 16,
    color: Colors.light.text,
  },
  bestValueBadge: {
    backgroundColor: Colors.light.primary,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  bestValueText: {
    fontFamily: "Rubik_700Bold",
    fontSize: 9,
    color: "#fff",
    letterSpacing: 0.5,
  },
  continueButton: {
    backgroundColor: Colors.light.primary,
    width: "100%",
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: "center",
    marginTop: 10,
  },
  continueText: {
    fontFamily: "Rubik_700Bold",
    fontSize: 17,
    color: "#fff",
  },
  linksRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 16,
  },
  linkText: {
    fontFamily: "Rubik_400Regular",
    fontSize: 12,
    color: Colors.light.textTertiary,
    textDecorationLine: "underline",
  },
  linkSep: {
    fontFamily: "Rubik_400Regular",
    fontSize: 12,
    color: Colors.light.border,
  },
});
