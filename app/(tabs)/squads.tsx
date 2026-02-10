import React, { useState } from "react";
import { StyleSheet, Text, View, ScrollView, Pressable, TextInput, Modal, Alert, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { useRigor } from "@/lib/rigor-context";

export default function SquadsScreen() {
  const insets = useSafeAreaInsets();
  const { squads, createSquad, joinSquad, leaveSquad } = useRigor();
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [squadName, setSquadName] = useState("");
  const [joinCode, setJoinCode] = useState("");

  const handleCreate = async () => {
    if (!squadName.trim()) return;
    await createSquad(squadName.trim());
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSquadName("");
    setShowCreate(false);
  };

  const handleJoin = async () => {
    if (!joinCode.trim()) return;
    const success = await joinSquad(joinCode.trim().toLowerCase());
    if (success) {
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setJoinCode("");
      setShowJoin(false);
    } else {
      Alert.alert("Already in Squad", "You are already a member of this squad.");
    }
  };

  const handleLeave = (id: string, name: string) => {
    Alert.alert("Leave Squad", `Leave "${name}"? This cannot be undone.`, [
      { text: "Cancel", style: "cancel" },
      { text: "Leave", style: "destructive", onPress: () => leaveSquad(id) },
    ]);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingTop: Platform.OS === 'web' ? 67 : insets.top + 16, paddingBottom: 120 }}
      contentInsetAdjustmentBehavior="automatic"
    >
      <Text style={styles.title}>Squads</Text>

      <View style={styles.buttonsRow}>
        <Pressable
          style={({ pressed }) => [styles.actionButton, pressed && { opacity: 0.85 }]}
          onPress={() => setShowCreate(true)}
        >
          <Feather name="plus" size={18} color={Colors.light.primary} />
          <Text style={styles.actionButtonText}>Create</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.actionButton, pressed && { opacity: 0.85 }]}
          onPress={() => setShowJoin(true)}
        >
          <Ionicons name="people" size={18} color={Colors.light.primary} />
          <Text style={styles.actionButtonText}>Join</Text>
        </Pressable>
      </View>

      {squads.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={40} color={Colors.light.textTertiary} />
          <Text style={styles.emptyText}>No squads yet</Text>
          <Text style={styles.emptySubtext}>Create or join a squad for social accountability.</Text>
        </View>
      ) : (
        squads.map((squad) => (
          <Pressable
            key={squad.id}
            style={({ pressed }) => [styles.squadCard, pressed && { opacity: 0.9 }]}
            onLongPress={() => handleLeave(squad.id, squad.name)}
          >
            <View>
              <Text style={styles.squadName}>{squad.name}</Text>
              <Text style={styles.squadCode}>Code: {squad.code}</Text>
            </View>
            <Feather name="chevron-right" size={18} color={Colors.light.textTertiary} />
          </Pressable>
        ))
      )}

      <Modal visible={showCreate} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Create Squad</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Squad name"
              placeholderTextColor={Colors.light.textTertiary}
              value={squadName}
              onChangeText={setSquadName}
              autoFocus
            />
            <Pressable
              style={({ pressed }) => [styles.modalButton, pressed && { opacity: 0.85 }]}
              onPress={handleCreate}
            >
              <Text style={styles.modalButtonText}>Create</Text>
            </Pressable>
            <Pressable onPress={() => setShowCreate(false)} style={styles.modalCancel}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal visible={showJoin} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Join Squad</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Enter squad code"
              placeholderTextColor={Colors.light.textTertiary}
              value={joinCode}
              onChangeText={setJoinCode}
              autoCapitalize="none"
              autoFocus
            />
            <Pressable
              style={({ pressed }) => [styles.modalButton, pressed && { opacity: 0.85 }]}
              onPress={handleJoin}
            >
              <Text style={styles.modalButtonText}>Join</Text>
            </Pressable>
            <Pressable onPress={() => setShowJoin(false)} style={styles.modalCancel}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: Colors.light.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  modalHandle: {
    width: 36,
    height: 4,
    backgroundColor: Colors.light.border,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontFamily: "Rubik_700Bold",
    fontSize: 20,
    color: Colors.light.text,
    marginBottom: 20,
  },
  modalInput: {
    fontFamily: "Rubik_400Regular",
    fontSize: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
    color: Colors.light.text,
    backgroundColor: Colors.light.background,
  },
  modalButton: {
    backgroundColor: Colors.light.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 12,
  },
  modalButtonText: {
    fontFamily: "Rubik_700Bold",
    fontSize: 16,
    color: "#fff",
  },
  modalCancel: {
    alignItems: "center",
    paddingVertical: 8,
  },
  modalCancelText: {
    fontFamily: "Rubik_500Medium",
    fontSize: 15,
    color: Colors.light.textTertiary,
  },
});
