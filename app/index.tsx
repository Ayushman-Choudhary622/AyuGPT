import React from "react";
import {
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import colors from "@/constants/colors";
import { useChat } from "@/context/ChatContext";
import { ConversationItem } from "@/components/ConversationItem";

export default function HomeScreen() {
  const scheme = useColorScheme();
  const theme = scheme === "dark" ? colors.dark : colors.light;
  const insets = useSafeAreaInsets();
  const {
    conversations,
    createConversation,
    deleteConversation,
    activeConversationId,
    setActiveConversationId,
  } = useChat();

  const handleNew = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    const id = createConversation();
    setActiveConversationId(id);
    router.push({ pathname: "/chat/[id]", params: { id } });
  };

  const handleOpen = (id: string) => {
    setActiveConversationId(id);
    router.push({ pathname: "/chat/[id]", params: { id } });
  };

  const topInset =
    Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const bottomInset =
    Platform.OS === "web" ? Math.max(insets.bottom, 34) : insets.bottom;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient
        colors={[theme.headerGradientStart, theme.headerGradientEnd] as const}
        style={[styles.header, { paddingTop: topInset + 12 }]}
      >
        <View style={styles.headerRow}>
          <View>
            <Text
              style={[
                styles.brandName,
                { color: theme.accent, fontFamily: "Inter_700Bold" },
              ]}
            >
              AyuGPT
            </Text>
            <Text
              style={[
                styles.brandSub,
                { color: theme.textSecondary, fontFamily: "Inter_400Regular" },
              ]}
            >
              Your unified AI assistant
            </Text>
          </View>
          <Pressable
            onPress={handleNew}
            style={[styles.newBtn, { backgroundColor: theme.accent }]}
          >
            <Ionicons name="add" size={22} color="#FFF" />
          </Pressable>
        </View>
      </LinearGradient>

      {conversations.length === 0 ? (
        <View style={styles.empty}>
          <View
            style={[
              styles.emptyIconContainer,
              { backgroundColor: theme.surfaceElevated },
            ]}
          >
            <Ionicons name="sparkles" size={40} color={theme.accent} />
          </View>
          <Text
            style={[
              styles.emptyTitle,
              { color: theme.text, fontFamily: "Inter_600SemiBold" },
            ]}
          >
            Start a conversation
          </Text>
          <Text
            style={[
              styles.emptySubtitle,
              {
                color: theme.textSecondary,
                fontFamily: "Inter_400Regular",
              },
            ]}
          >
            Tap the + button to chat with GPT, Gemini, Groq or any free AI
            model
          </Text>
          <Pressable
            onPress={handleNew}
            style={[styles.emptyButton, { backgroundColor: theme.accent }]}
          >
            <Ionicons name="add" size={18} color="#FFF" />
            <Text
              style={[
                styles.emptyButtonText,
                { fontFamily: "Inter_600SemiBold" },
              ]}
            >
              New Chat
            </Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(c) => c.id}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: bottomInset + 20 },
          ]}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <ConversationItem
              conversation={item}
              isActive={item.id === activeConversationId}
              onPress={() => handleOpen(item.id)}
              onDelete={() => deleteConversation(item.id)}
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  brandName: {
    fontSize: 28,
    letterSpacing: -0.5,
  },
  brandSub: {
    fontSize: 13,
    marginTop: 2,
  },
  newBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  list: {
    paddingTop: 12,
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 16,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 22,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
  },
  emptyButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 30,
    gap: 8,
    marginTop: 8,
  },
  emptyButtonText: {
    color: "#FFF",
    fontSize: 16,
  },
});
