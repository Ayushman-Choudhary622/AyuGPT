import React from "react";
import { Pressable, StyleSheet, Text, View, useColorScheme } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import colors from "@/constants/colors";
import { useChat } from "@/context/ChatContext";

export function WebSearchToggle() {
  const scheme = useColorScheme();
  const theme = scheme === "dark" ? colors.dark : colors.light;
  const { webSearchEnabled, setWebSearchEnabled } = useChat();

  const toggle = () => {
    Haptics.selectionAsync().catch(() => {});
    setWebSearchEnabled(!webSearchEnabled);
  };

  return (
    <Pressable
      onPress={toggle}
      style={[
        styles.container,
        {
          backgroundColor: webSearchEnabled
            ? theme.accent + "22"
            : theme.surfaceElevated,
          borderColor: webSearchEnabled ? theme.accent : theme.border,
        },
      ]}
    >
      <Ionicons
        name={webSearchEnabled ? "globe" : "globe-outline"}
        size={14}
        color={webSearchEnabled ? theme.accent : theme.textSecondary}
      />
      <Text
        style={[
          styles.label,
          {
            color: webSearchEnabled ? theme.accent : theme.textSecondary,
            fontFamily: "Inter_500Medium",
          },
        ]}
      >
        Web
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    gap: 5,
  },
  label: {
    fontSize: 13,
  },
});
