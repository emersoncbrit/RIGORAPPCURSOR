import React, { useRef, useCallback } from "react";
import { StyleSheet, Text, View, Pressable, Platform, ScrollView, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import ViewShot from "react-native-view-shot";
import * as Sharing from "expo-sharing";
import Colors from "@/constants/colors";
import { useRigor } from "@/lib/rigor-context";

const CARD_BG = "#1A1A1A";
const CARD_TEXT = "#FAFAFA";
const CARD_MUTED = "#999999";
const CARD_ORANGE = "#E8611A";
const CARD_RED = "#E53935";
const DOT_EMPTY = "#D4D4D4";
const DOTS_PER_ROW = 10;

export default function ShareCardScreen() {
  const insets = useSafeAreaInsets();
  const viewShotRef = useRef<ViewShot>(null);
  const { contract, dayRecords, getDayNumber, getCompletedCount, getFailedCount, getCompletionRate } = useRigor();

  const dayNumber = getDayNumber();
  const completed = getCompletedCount();
  const failed = getFailedCount();
  const rate = getCompletionRate();
  const duration = contract?.duration ?? 30;
  const ruleText = contract?.rule ?? "";

  const buildDotGrid = useCallback(() => {
    if (!contract) return [];
    const totalDays = contract.duration;
    const dots: Array<{ day: number; status: "completed" | "failed" | "critical" | "pending" }> = [];

    for (let i = 0; i < totalDays; i++) {
      const d = new Date(contract.start_date + "T00:00:00");
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split("T")[0];
      const record = dayRecords.find((r) => r.date === dateStr);

      if (record) {
        if (record.critical) dots.push({ day: i + 1, status: "critical" });
        else if (record.failed) dots.push({ day: i + 1, status: "failed" });
        else if (record.completed) dots.push({ day: i + 1, status: "completed" });
        else dots.push({ day: i + 1, status: "pending" });
      } else {
        dots.push({ day: i + 1, status: "pending" });
      }
    }
    return dots;
  }, [contract, dayRecords]);

  const dots = buildDotGrid();
  const rows: typeof dots[] = [];
  for (let i = 0; i < dots.length; i += DOTS_PER_ROW) {
    rows.push(dots.slice(i, i + DOTS_PER_ROW));
  }

  const getDotColor = (status: string) => {
    switch (status) {
      case "completed": return CARD_ORANGE;
      case "failed": return CARD_MUTED;
      case "critical": return CARD_RED;
      default: return DOT_EMPTY;
    }
  };

  const handleDownload = async () => {
    try {
      if (!viewShotRef.current?.capture) return;
      const uri = await viewShotRef.current.capture();

      if (Platform.OS === "web") {
        const link = document.createElement("a");
        link.href = uri;
        link.download = `rigor-day-${dayNumber}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        const isAvailable = await Sharing.isAvailableAsync();
        if (isAvailable) {
          await Sharing.shareAsync(uri, {
            mimeType: "image/png",
            dialogTitle: "Share your RIGOR progress",
          });
        } else {
          Alert.alert("Sharing not available on this device");
        }
      }
    } catch (e) {
      console.error("Failed to capture/share:", e);
    }
  };

  if (!contract) {
    router.back();
    return null;
  }

  return (
    <View style={[styles.container, { paddingTop: Platform.OS === "web" ? 67 : insets.top }]}>
      <View style={styles.topBar}>
        <View style={{ width: 32 }} />
        <Text style={styles.topBarTitle}>Compartilhar</Text>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Feather name="x" size={24} color={Colors.light.text} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ViewShot
          ref={viewShotRef}
          options={{ format: "png", quality: 1.0 }}
          style={styles.cardWrapper}
        >
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardLogo}>RIGOR</Text>
              <Text style={styles.cardDay}>DIA {dayNumber}</Text>
            </View>

            <Text style={styles.cardRule}>{ruleText}</Text>

            <Text style={styles.mapLabel}>MAPA DE CONSISTÊNCIA</Text>

            <View style={styles.dotGrid}>
              {rows.map((row, rowIdx) => (
                <View key={rowIdx} style={styles.dotRow}>
                  {row.map((dot, dotIdx) => (
                    <View
                      key={dotIdx}
                      style={[
                        styles.dot,
                        { backgroundColor: getDotColor(dot.status) },
                      ]}
                    />
                  ))}
                </View>
              ))}
            </View>

            <View style={styles.legend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: CARD_ORANGE }]} />
                <Text style={styles.legendText}>Cumprido</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: CARD_MUTED }]} />
                <Text style={styles.legendText}>Falha</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: CARD_RED }]} />
                <Text style={styles.legendText}>Crítica</Text>
              </View>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statBlock}>
                <Text style={styles.statValue}>{rate}%</Text>
                <Text style={styles.statLabel}>Taxa</Text>
              </View>
              <View style={styles.statBlock}>
                <Text style={styles.statValue}>{completed}</Text>
                <Text style={styles.statLabel}>Cumpridos</Text>
              </View>
              <View style={styles.statBlock}>
                <Text style={styles.statValue}>{duration}d</Text>
                <Text style={styles.statLabel}>Contrato</Text>
              </View>
            </View>
          </View>
        </ViewShot>

        <Pressable
          style={({ pressed }) => [styles.downloadButton, pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] }]}
          onPress={handleDownload}
        >
          <Feather name="download" size={20} color="#fff" style={{ marginRight: 10 }} />
          <Text style={styles.downloadText}>Baixar imagem</Text>
        </Pressable>

        <Text style={styles.hint}>PNG · Pronto para Instagram</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  topBarTitle: {
    fontFamily: "Rubik_600SemiBold",
    fontSize: 16,
    color: Colors.light.text,
  },
  scrollContent: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  cardWrapper: {
    width: "100%",
    borderRadius: 20,
    overflow: "hidden",
    marginTop: 12,
  },
  card: {
    backgroundColor: CARD_BG,
    borderRadius: 20,
    padding: 24,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  cardLogo: {
    fontFamily: "Rubik_800ExtraBold",
    fontSize: 20,
    color: CARD_TEXT,
    letterSpacing: 1,
  },
  cardDay: {
    fontFamily: "Rubik_700Bold",
    fontSize: 18,
    color: CARD_ORANGE,
    letterSpacing: 0.5,
  },
  cardRule: {
    fontFamily: "Rubik_400Regular",
    fontSize: 14,
    color: CARD_MUTED,
    marginBottom: 20,
  },
  mapLabel: {
    fontFamily: "Rubik_600SemiBold",
    fontSize: 11,
    color: CARD_MUTED,
    letterSpacing: 1.5,
    marginBottom: 14,
  },
  dotGrid: {
    gap: 6,
    marginBottom: 14,
  },
  dotRow: {
    flexDirection: "row",
    gap: 6,
    justifyContent: "flex-start",
  },
  dot: {
    width: 26,
    height: 26,
    borderRadius: 13,
  },
  legend: {
    flexDirection: "row",
    gap: 18,
    marginBottom: 24,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  legendText: {
    fontFamily: "Rubik_400Regular",
    fontSize: 12,
    color: CARD_MUTED,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 4,
  },
  statBlock: {
    alignItems: "flex-start",
  },
  statValue: {
    fontFamily: "Rubik_700Bold",
    fontSize: 26,
    color: CARD_TEXT,
  },
  statLabel: {
    fontFamily: "Rubik_400Regular",
    fontSize: 12,
    color: CARD_MUTED,
    marginTop: 2,
  },
  downloadButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: CARD_ORANGE,
    borderRadius: 50,
    paddingVertical: 16,
    paddingHorizontal: 40,
    marginTop: 28,
    width: "100%",
    maxWidth: 320,
  },
  downloadText: {
    fontFamily: "Rubik_700Bold",
    fontSize: 16,
    color: "#fff",
  },
  hint: {
    fontFamily: "Rubik_400Regular",
    fontSize: 13,
    color: Colors.light.textTertiary,
    marginTop: 12,
  },
});
