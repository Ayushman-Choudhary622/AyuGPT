import React, { useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import colors from "@/constants/colors";
import { MODELS, PROVIDER_COLORS, type AIModel } from "@/lib/models";
import { useChat } from "@/context/ChatContext";

export function ModelSelector() {
  const scheme = useColorScheme();
  const theme = scheme === "dark" ? colors.dark : colors.light;
  const { selectedModel, setSelectedModel } = useChat();
  const [open, setOpen] = useState(false);

  const handleSelect = (model: AIModel) => {
    Haptics.selectionAsync().catch(() => {});
    setSelectedModel(model);
    setOpen(false);
  };

  const providerColor = PROVIDER_COLORS[selectedModel.provider];

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        style={[
          styles.trigger,
          {
            backgroundColor: theme.surfaceElevated,
            borderColor: theme.border,
          },
        ]}
      >
        <View style={[styles.dot, { backgroundColor: providerColor }]} />
        <Text
          style={[
            styles.triggerText,
            { color: theme.text, fontFamily: "Inter_500Medium" },
          ]}
          numberOfLines={1}
        >
          {selectedModel.name}
        </Text>
        <Ionicons name="chevron-down" size={14} color={theme.textSecondary} />
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="slide"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setOpen(false)}>
          <View
            style={[
              styles.sheet,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <View style={styles.handle} />
            <Text
              style={[
                styles.sheetTitle,
                { color: theme.text, fontFamily: "Inter_700Bold" },
              ]}
            >
              Select Model
            </Text>
            <FlatList
              data={MODELS}
              keyExtractor={(m) => m.id}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const pc = PROVIDER_COLORS[item.provider];
                const isSelected = item.id === selectedModel.id;
                return (
                  <Pressable
                    onPress={() => handleSelect(item)}
                    style={[
                      styles.modelItem,
                      {
                        backgroundColor: isSelected
                          ? theme.surfaceElevated
                          : "transparent",
                        borderColor: isSelected ? theme.accent : "transparent",
                      },
                    ]}
                  >
                    <View
                      style={[styles.modelDot, { backgroundColor: pc }]}
                    />
                    <View style={styles.modelInfo}>
                      <Text
                        style={[
                          styles.modelName,
                          {
                            color: theme.text,
                            fontFamily: "Inter_600SemiBold",
                          },
                        ]}
                      >
                        {item.name}
                      </Text>
                      <Text
                        style={[
                          styles.modelDesc,
                          {
                            color: theme.textSecondary,
                            fontFamily: "Inter_400Regular",
                          },
                        ]}
                      >
                        {item.providerLabel} • {item.description}
                      </Text>
                    </View>
                    {isSelected && (
                      <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color={theme.accent}
                      />
                    )}
                  </Pressable>
                );
              }}
            />
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
    maxWidth: 160,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  triggerText: {
    fontSize: 13,
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    paddingTop: 12,
    paddingBottom: 40,
    maxHeight: "80%",
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#555",
    alignSelf: "center",
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 18,
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  modelItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginHorizontal: 12,
    marginVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  modelDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  modelInfo: {
    flex: 1,
    gap: 2,
  },
  modelName: {
    fontSize: 15,
  },
  modelDesc: {
    fontSize: 12,
  },
});
