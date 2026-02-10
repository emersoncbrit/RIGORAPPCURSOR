import React, { useState, useEffect, useCallback } from "react";
import { StyleSheet, Text, View, ScrollView, Pressable, TextInput, Modal, Alert, Platform, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Clipboard from "expo-clipboard";
import Colors from "@/constants/colors";
import { useRigor, Squad } from "@/lib/rigor-context";
import { getApiUrl } from "@/lib/query-client";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { fetch } from "expo/fetch";

const AUTH_TOKEN_KEY = "@rigor_auth_token";

interface SquadMember {
  user_id: string;
  display_name: string;
  is_me: boolean;
  completed_days: number;
  failed_days: number;
  joined_at: string;
}

export default function SquadsScreen() {
  const insets = useSafeAreaInsets();
  const { squads, createSquad, joinSquad, leaveSquad } = useRigor();
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [squadName, setSquadName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [selectedSquad, setSelectedSquad] = useState<Squad | null>(null);
  const [members, setMembers] = useState<SquadMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);

  const loadMembers = useCallback(async (squadId: string) => {
    setLoadingMembers(true);
    try {
      const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      const baseUrl = getApiUrl();
      const res = await fetch(new URL(`/api/squads/${squadId}/members`, baseUrl).toString(), {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setMembers(data.members || []);
      }
    } catch (e) {
      console.error("Failed to load members:", e);
    } finally {
      setLoadingMembers(false);
    }
  }, []);

  const openSquadDetail = useCallback((squad: Squad) => {
    setSelectedSquad(squad);
    setCodeCopied(false);
    loadMembers(squad.id);
  }, [loadMembers]);

  const handleCreate = async () => {
    if (!squadName.trim()) return;
    await createSquad(squadName.trim());
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSquadName("");
    setShowCreate(false);
  };

  const handleJoin = async () => {
    if (!joinCode.trim()) return;
    const success = await joinSquad(joinCode.trim().toLowerCase());
    if (success) {
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setJoinCode("");
      setShowJoin(false);
    } else {
      Alert.alert("Erro", "Código inválido ou você já faz parte deste squad.");
    }
  };

  const handleLeave = (id: string, name: string) => {
    Alert.alert("Sair do Squad", `Sair de "${name}"? Isso não pode ser desfeito.`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Sair",
        style: "destructive",
        onPress: async () => {
          await leaveSquad(id);
          setSelectedSquad(null);
          setMembers([]);
        },
      },
    ]);
  };

  const handleCopyCode = async (code: string) => {
    try {
      await Clipboard.setStringAsync(code);
      setCodeCopied(true);
      if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setTimeout(() => setCodeCopied(false), 2000);
    } catch {}
  };

  const formatJoinDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const day = d.getDate();
      const months = ["jan.", "fev.", "mar.", "abr.", "mai.", "jun.", "jul.", "ago.", "set.", "out.", "nov.", "dez."];
      return `${day} de ${months[d.getMonth()]}`;
    } catch {
      return "";
    }
  };

  if (selectedSquad) {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingTop: Platform.OS === "web" ? 67 : insets.top + 16, paddingBottom: Platform.OS === "web" ? 34 : 120 }}
      >
        <View style={styles.detailHeader}>
          <Text style={styles.detailTitle}>{selectedSquad.name}</Text>
          <Pressable onPress={() => { setSelectedSquad(null); setMembers([]); }} hitSlop={12}>
            <Text style={styles.backText}>Voltar</Text>
          </Pressable>
        </View>

        <View style={styles.codeCard}>
          <Text style={styles.codeLabel}>CÓDIGO</Text>
          <View style={styles.codeRow}>
            <Text style={styles.codeValue}>{selectedSquad.code}</Text>
            <Pressable onPress={() => handleCopyCode(selectedSquad.code)} hitSlop={12}>
              <Feather name={codeCopied ? "check" : "copy"} size={20} color={codeCopied ? Colors.light.success : Colors.light.textTertiary} />
            </Pressable>
          </View>
        </View>

        <Text style={styles.sectionLabel}>RANKING</Text>

        {loadingMembers ? (
          <ActivityIndicator size="small" color={Colors.light.primary} style={{ marginTop: 20 }} />
        ) : members.length === 0 ? (
          <Text style={styles.noMembers}>Nenhum membro encontrado</Text>
        ) : (
          members.map((member, idx) => (
            <View key={member.user_id} style={styles.memberCard}>
              <View style={styles.memberRank}>
                <Text style={styles.rankNumber}>{idx + 1}</Text>
              </View>
              <View style={styles.memberInfo}>
                <View style={styles.memberNameRow}>
                  <Text style={styles.memberName}>{member.display_name}</Text>
                  {idx === 0 && members.length > 1 && (
                    <MaterialCommunityIcons name="crown" size={16} color={Colors.light.primary} style={{ marginLeft: 4 }} />
                  )}
                  {member.is_me && (
                    <View style={styles.meBadge}>
                      <Text style={styles.meBadgeText}>you</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.memberStats}>
                  {member.completed_days} dias · {member.failed_days} falhas
                </Text>
              </View>
              <Text style={styles.memberDate}>{formatJoinDate(member.joined_at)}</Text>
            </View>
          ))
        )}

        <Pressable
          style={({ pressed }) => [styles.leaveButton, pressed && { opacity: 0.7 }]}
          onPress={() => handleLeave(selectedSquad.id, selectedSquad.name)}
        >
          <Feather name="log-out" size={16} color={Colors.light.primary} />
          <Text style={styles.leaveText}>Sair do squad</Text>
        </Pressable>
      </ScrollView>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: Platform.OS === "web" ? 67 : insets.top + 16 }]}>
      <ScrollView contentContainerStyle={{ paddingBottom: Platform.OS === "web" ? 34 : 120 }}>
        <Text style={styles.title}>Squads</Text>

        <View style={styles.buttonsRow}>
          <Pressable
            style={({ pressed }) => [styles.actionButton, pressed && { opacity: 0.85 }]}
            onPress={() => setShowCreate(true)}
          >
            <Feather name="plus" size={18} color={Colors.light.primary} />
            <Text style={styles.actionButtonText}>Criar</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.actionButton, pressed && { opacity: 0.85 }]}
            onPress={() => setShowJoin(true)}
          >
            <Ionicons name="people" size={18} color={Colors.light.primary} />
            <Text style={styles.actionButtonText}>Entrar</Text>
          </Pressable>
        </View>

        {squads.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={40} color={Colors.light.textTertiary} />
            <Text style={styles.emptyText}>Nenhum squad ainda</Text>
            <Text style={styles.emptySubtext}>Crie ou entre em um squad para ter responsabilidade social.</Text>
          </View>
        ) : (
          squads.map((squad) => (
            <Pressable
              key={squad.id}
              style={({ pressed }) => [styles.squadCard, pressed && { opacity: 0.9 }]}
              onPress={() => openSquadDetail(squad)}
            >
              <View>
                <Text style={styles.squadName}>{squad.name}</Text>
                <Text style={styles.squadCode}>Código: {squad.code}</Text>
              </View>
              <Feather name="chevron-right" size={18} color={Colors.light.textTertiary} />
            </Pressable>
          ))
        )}
      </ScrollView>

      <Modal visible={showCreate} animationType="fade" transparent>
        <Pressable style={styles.modalOverlay} onPress={() => setShowCreate(false)}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Criar Squad</Text>
            <Text style={styles.modalSubtitle}>NOME DO SQUAD</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Ex: Disciplina Total"
              placeholderTextColor={Colors.light.textTertiary}
              value={squadName}
              onChangeText={setSquadName}
              autoFocus
            />
            <Pressable
              style={({ pressed }) => [styles.modalButton, !squadName.trim() && styles.modalButtonDisabled, pressed && { opacity: 0.85 }]}
              onPress={handleCreate}
              disabled={!squadName.trim()}
            >
              <Text style={styles.modalButtonText}>Criar</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={showJoin} animationType="fade" transparent>
        <Pressable style={styles.modalOverlay} onPress={() => setShowJoin(false)}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Entrar no Squad</Text>
            <Text style={styles.modalSubtitle}>CÓDIGO DO SQUAD</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Ex: a1b2c3d4"
              placeholderTextColor={Colors.light.textTertiary}
              value={joinCode}
              onChangeText={setJoinCode}
              autoCapitalize="none"
              autoFocus
            />
            <Pressable
              style={({ pressed }) => [styles.modalButton, !joinCode.trim() && styles.modalButtonDisabled, pressed && { opacity: 0.85 }]}
              onPress={handleJoin}
              disabled={!joinCode.trim()}
            >
              <Text style={styles.modalButtonText}>Entrar</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
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
  buttonsRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.light.surface,
    borderRadius: 14,
    paddingVertical: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  actionButtonText: {
    fontFamily: "Rubik_600SemiBold",
    fontSize: 15,
    color: Colors.light.text,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
    gap: 8,
  },
  emptyText: {
    fontFamily: "Rubik_600SemiBold",
    fontSize: 16,
    color: Colors.light.text,
    marginTop: 8,
  },
  emptySubtext: {
    fontFamily: "Rubik_400Regular",
    fontSize: 13,
    color: Colors.light.textTertiary,
    textAlign: "center",
    paddingHorizontal: 40,
  },
  squadCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.light.surface,
    marginHorizontal: 20,
    borderRadius: 14,
    padding: 18,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  squadName: {
    fontFamily: "Rubik_600SemiBold",
    fontSize: 16,
    color: Colors.light.text,
    marginBottom: 2,
  },
  squadCode: {
    fontFamily: "Rubik_400Regular",
    fontSize: 12,
    color: Colors.light.textTertiary,
  },
  detailHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  detailTitle: {
    fontFamily: "Rubik_700Bold",
    fontSize: 28,
    color: Colors.light.text,
  },
  backText: {
    fontFamily: "Rubik_500Medium",
    fontSize: 15,
    color: Colors.light.textTertiary,
  },
  codeCard: {
    backgroundColor: Colors.light.surface,
    marginHorizontal: 20,
    borderRadius: 14,
    padding: 20,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  codeLabel: {
    fontFamily: "Rubik_600SemiBold",
    fontSize: 11,
    color: Colors.light.textTertiary,
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  codeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  codeValue: {
    fontFamily: "Rubik_600SemiBold",
    fontSize: 22,
    color: Colors.light.text,
    letterSpacing: 2,
  },
  sectionLabel: {
    fontFamily: "Rubik_600SemiBold",
    fontSize: 11,
    color: Colors.light.textTertiary,
    letterSpacing: 1.5,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  noMembers: {
    fontFamily: "Rubik_400Regular",
    fontSize: 14,
    color: Colors.light.textTertiary,
    textAlign: "center",
    marginTop: 20,
  },
  memberCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.surface,
    marginHorizontal: 20,
    borderRadius: 14,
    padding: 16,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  memberRank: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.light.background,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  rankNumber: {
    fontFamily: "Rubik_700Bold",
    fontSize: 14,
    color: Colors.light.text,
  },
  memberInfo: {
    flex: 1,
  },
  memberNameRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },
  memberName: {
    fontFamily: "Rubik_600SemiBold",
    fontSize: 15,
    color: Colors.light.text,
  },
  meBadge: {
    backgroundColor: Colors.light.primary + "20",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 1,
    marginLeft: 6,
  },
  meBadgeText: {
    fontFamily: "Rubik_500Medium",
    fontSize: 10,
    color: Colors.light.primary,
  },
  memberStats: {
    fontFamily: "Rubik_400Regular",
    fontSize: 12,
    color: Colors.light.textTertiary,
  },
  memberDate: {
    fontFamily: "Rubik_400Regular",
    fontSize: 12,
    color: Colors.light.textTertiary,
  },
  leaveButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginTop: 12,
  },
  leaveText: {
    fontFamily: "Rubik_500Medium",
    fontSize: 14,
    color: Colors.light.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
  },
  modalContent: {
    backgroundColor: Colors.light.surface,
    borderRadius: 20,
    padding: 28,
    width: "100%",
    maxWidth: 360,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10,
  },
  modalTitle: {
    fontFamily: "Rubik_700Bold",
    fontSize: 22,
    color: Colors.light.text,
    marginBottom: 20,
  },
  modalSubtitle: {
    fontFamily: "Rubik_600SemiBold",
    fontSize: 11,
    color: Colors.light.textTertiary,
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  modalInput: {
    fontFamily: "Rubik_400Regular",
    fontSize: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 20,
    color: Colors.light.text,
    backgroundColor: Colors.light.background,
  },
  modalButton: {
    backgroundColor: Colors.light.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  modalButtonDisabled: {
    opacity: 0.4,
  },
  modalButtonText: {
    fontFamily: "Rubik_700Bold",
    fontSize: 16,
    color: "#fff",
  },
});
