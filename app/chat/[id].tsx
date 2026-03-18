import React, { useRef, useEffect, useState } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import colors from "@/constants/colors";
import { useChat } from "@/context/ChatContext";
import { MessageBubble } from "@/components/MessageBubble";
import { TypingIndicator } from "@/components/TypingIndicator";
import { ChatInput } from "@/components/ChatInput";
import { ModelSelector } from "@/components/ModelSelector";
import { WebSearchToggle } from "@/components/WebSearchToggle";
import type { Message } from "@/context/ChatContext";

export default function ChatScreen() {
  const scheme = useColorScheme();
  const theme = scheme === "dark" ? colors.dark : colors.light;
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getConversation, sendMessage, isStreaming, deleteConversation } =
    useChat();

  const conversation = id ? getConversation(id) : undefined;
  const messages = conversation?.messages ?? [];

  const reversedMessages = [...messages].reverse();
  const showTyping = isStreaming && messages[messages.length - 1]?.role === "user";

  const handleSend = (text: string) => {
    if (!id) return;
    sendMessage(id, text);
  };

  const handleDelete = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    if (id) deleteConversation(id);
    router.back();
  };

  const topInset =
    Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const bottomInset =
    Platform.OS === "web" ? Math.max(insets.bottom, 34) : insets.bottom;

  if (!conversation) {
    return (
      <View
        style={[
          styles.notFound,
          { backgroundColor: theme.background, paddingTop: topInset },
        ]}
      >
        <Text style={{ color: theme.text, fontFamily: "Inter_400Regular" }}>
          Conversation not found
        </Text>
        <Pressable onPress={() => router.back()}>
          <Text
            style={{
              color: theme.accent,
              fontFamily: "Inter_600SemiBold",
              marginTop: 12,
            }}
          >
            Go back
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior="padding"
      keyboardVerticalOffset={0}
    >
      <LinearGradient
        colors={[theme.headerGradientStart, theme.headerGradientEnd] as const}
        style={[styles.header, { paddingTop: topInset + 8 }]}
      >
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color={theme.text} />
          </Pressable>
          <View style={styles.headerCenter}>
            <Text
              style={[
                styles.headerTitle,
                { color: theme.text, fontFamily: "Inter_600SemiBold" },
              ]}
              numberOfLines={1}
            >
              {conversation.title}
            </Text>
          </View>
          <Pressable onPress={handleDelete} style={styles.deleteBtn}>
            <Ionicons name="trash-outline" size={20} color={theme.error} />
          </Pressable>
        </View>
        <View style={styles.toolbarRow}>
          <ModelSelector />
          <WebSearchToggle />
        </View>
      </LinearGradient>

      <FlatList
        data={reversedMessages}
        keyExtractor={(item: Message) => item.id}
        renderItem={({ item, index }: { item: Message; index: number }) => (
          <MessageBubble
            message={item}
            isLatestAssistant={index === 0 && item.role === "assistant" && isStreaming}
          />
        )}
        inverted={messages.length > 0}
        ListHeaderComponent={showTyping ? <TypingIndicator /> : null}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.messageList}
        ListFooterComponent={
          messages.length === 0 ? (
            <View style={styles.emptyChat}>
              <View
                style={[
                  styles.emptyIcon,
                  { backgroundColor: theme.surfaceElevated },
                ]}
              >
                <Ionicons name="sparkles" size={32} color={theme.accent} />
              </View>
              <Text
                style={[
                  styles.emptyChatTitle,
                  { color: theme.text, fontFamily: "Inter_600SemiBold" },
                ]}
              >
                AyuGPT
              </Text>
              <Text
                style={[
                  styles.emptyChatSub,
                  {
                    color: theme.textSecondary,
                    fontFamily: "Inter_400Regular",
                  },
                ]}
              >
                How can I help you today?
              </Text>
            </View>
          ) : null
        }
      />

      <View style={{ paddingBottom: bottomInset }}>
        <ChatInput onSend={handleSend} disabled={isStreaming} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  notFound: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    paddingBottom: 12,
    paddingHorizontal: 16,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 8,
  },
  headerTitle: {
    fontSize: 16,
  },
  deleteBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  toolbarRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  messageList: {
    paddingVertical: 12,
  },
  emptyChat: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 12,
    paddingHorizontal: 32,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyChatTitle: {
    fontSize: 24,
    letterSpacing: -0.3,
  },
  emptyChatSub: {
    fontSize: 15,
    textAlign: "center",
  },
});
