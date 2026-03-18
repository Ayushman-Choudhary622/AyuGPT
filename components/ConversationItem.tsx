import React, { useRef } from "react";
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import colors from "@/constants/colors";
import type { Conversation } from "@/context/ChatContext";

interface Props {
  conversation: Conversation;
  onPress: () => void;
  onDelete: () => void;
  isActive: boolean;
}

export function ConversationItem({
  conversation,
  onPress,
  onDelete,
  isActive,
}: Props) {
  const scheme = useColorScheme();
  const theme = scheme === "dark" ? colors.dark : colors.light;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const lastMessage =
    conversation.messages[conversation.messages.length - 1];

  const handlePress = () => {
    Haptics.selectionAsync().catch(() => {});
    onPress();
  };

  const handleDelete = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    onDelete();
  };

  const onPressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true }).start();
  };
  const onPressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable
        onPress={handlePress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        style={[
          styles.item,
          {
            backgroundColor: isActive ? theme.surfaceElevated : theme.surface,
            borderColor: isActive ? theme.accent + "40" : theme.border,
          },
        ]}
      >
        <View style={styles.content}>
          <Text
            style={[
              styles.title,
              { color: theme.text, fontFamily: "Inter_600SemiBold" },
            ]}
            numberOfLines={1}
          >
            {conversation.title}
          </Text>
          {lastMessage && (
            <Text
              style={[
                styles.preview,
                { color: theme.textSecondary, fontFamily: "Inter_400Regular" },
              ]}
              numberOfLines={1}
            >
              {lastMessage.role === "assistant" ? "AyuGPT: " : "You: "}
              {lastMessage.content}
            </Text>
          )}
        </View>
        <Pressable onPress={handleDelete} style={styles.deleteBtn} hitSlop={8}>
          <Ionicons name="trash-outline" size={16} color={theme.error} />
        </Pressable>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  content: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 15,
  },
  preview: {
    fontSize: 13,
  },
  deleteBtn: {
    padding: 4,
  },
});
