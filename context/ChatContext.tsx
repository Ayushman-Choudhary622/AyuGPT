import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { MODELS, DEFAULT_MODEL, type AIModel } from "@/lib/models";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
  model: string;
}

interface ChatContextType {
  conversations: Conversation[];
  activeConversationId: string | null;
  selectedModel: AIModel;
  webSearchEnabled: boolean;
  isStreaming: boolean;
  setSelectedModel: (model: AIModel) => void;
  setWebSearchEnabled: (enabled: boolean) => void;
  setActiveConversationId: (id: string | null) => void;
  createConversation: () => string;
  deleteConversation: (id: string) => void;
  getConversation: (id: string) => Conversation | undefined;
  sendMessage: (conversationId: string, content: string) => Promise<void>;
  clearAll: () => void;
}

const ChatContext = createContext<ChatContextType | null>(null);

const STORAGE_KEY = "ayugpt_conversations";
const MODEL_KEY = "ayugpt_selected_model";

let msgCounter = 0;
function genId(): string {
  msgCounter++;
  return `msg-${Date.now()}-${msgCounter}-${Math.random().toString(36).substr(2, 9)}`;
}

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [selectedModel, setSelectedModelState] = useState<AIModel>(DEFAULT_MODEL);
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const loadedRef = useRef(false);

  useEffect(() => {
    (async () => {
      try {
        const [stored, storedModel] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEY),
          AsyncStorage.getItem(MODEL_KEY),
        ]);
        if (stored) setConversations(JSON.parse(stored));
        if (storedModel) {
          const m = MODELS.find((m) => m.id === storedModel);
          if (m) setSelectedModelState(m);
        }
      } catch {}
      loadedRef.current = true;
    })();
  }, []);

  const persist = useCallback((convs: Conversation[]) => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(convs)).catch(() => {});
  }, []);

  const setSelectedModel = useCallback((model: AIModel) => {
    setSelectedModelState(model);
    AsyncStorage.setItem(MODEL_KEY, model.id).catch(() => {});
  }, []);

  const createConversation = useCallback((): string => {
    const id = `conv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const conv: Conversation = {
      id,
      title: "New Chat",
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      model: selectedModel.id,
    };
    setConversations((prev) => {
      const next = [conv, ...prev];
      persist(next);
      return next;
    });
    return id;
  }, [selectedModel.id, persist]);

  const deleteConversation = useCallback(
    (id: string) => {
      setConversations((prev) => {
        const next = prev.filter((c) => c.id !== id);
        persist(next);
        return next;
      });
      setActiveConversationId((cur) => (cur === id ? null : cur));
    },
    [persist]
  );

  const getConversation = useCallback(
    (id: string) => conversations.find((c) => c.id === id),
    [conversations]
  );

  const sendMessage = useCallback(
    async (conversationId: string, content: string) => {
      if (isStreaming) return;

      const userMsg: Message = {
        id: genId(),
        role: "user",
        content,
        timestamp: Date.now(),
      };

      let currentMessages: Message[] = [];

      setConversations((prev) => {
        const next = prev.map((c) => {
          if (c.id !== conversationId) return c;
          const msgs = [...c.messages, userMsg];
          currentMessages = msgs;
          const title =
            c.messages.length === 0
              ? content.slice(0, 40) + (content.length > 40 ? "…" : "")
              : c.title;
          return { ...c, messages: msgs, title, updatedAt: Date.now() };
        });
        persist(next);
        return next;
      });

      setIsStreaming(true);

      const domain = process.env.EXPO_PUBLIC_DOMAIN;
      const baseUrl = domain ? `https://${domain}/` : "/";

      try {
        const { fetch: expoFetch } = await import("expo/fetch");

        const chatHistory = currentMessages.map((m) => ({
          role: m.role,
          content: m.content,
        }));

        const response = await expoFetch(`${baseUrl}api/chat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "text/event-stream",
          },
          body: JSON.stringify({
            messages: chatHistory,
            model: selectedModel.id,
            webSearch: webSearchEnabled,
          }),
        });

        if (!response.ok) throw new Error("Request failed");

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response body");

        const decoder = new TextDecoder();
        let buffer = "";
        let fullContent = "";
        let assistantMsgId = genId();
        let assistantAdded = false;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6);
            if (data === "[DONE]") continue;

            try {
              const parsed = JSON.parse(data);
              if (parsed.error) {
                throw new Error(parsed.error);
              }
              if (parsed.content) {
                fullContent += parsed.content;

                if (!assistantAdded) {
                  const assistantMsg: Message = {
                    id: assistantMsgId,
                    role: "assistant",
                    content: fullContent,
                    timestamp: Date.now(),
                  };
                  setConversations((prev) => {
                    const next = prev.map((c) => {
                      if (c.id !== conversationId) return c;
                      return {
                        ...c,
                        messages: [...c.messages, assistantMsg],
                        updatedAt: Date.now(),
                      };
                    });
                    return next;
                  });
                  assistantAdded = true;
                } else {
                  setConversations((prev) => {
                    const next = prev.map((c) => {
                      if (c.id !== conversationId) return c;
                      const msgs = [...c.messages];
                      const lastIdx = msgs.length - 1;
                      if (msgs[lastIdx]?.id === assistantMsgId) {
                        msgs[lastIdx] = { ...msgs[lastIdx], content: fullContent };
                      }
                      return { ...c, messages: msgs };
                    });
                    return next;
                  });
                }
              }
            } catch {}
          }
        }

        setConversations((prev) => {
          const next = [...prev];
          persist(next);
          return next;
        });
      } catch (err) {
        const errMsg: Message = {
          id: genId(),
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
          timestamp: Date.now(),
        };
        setConversations((prev) => {
          const next = prev.map((c) => {
            if (c.id !== conversationId) return c;
            return {
              ...c,
              messages: [...c.messages, errMsg],
              updatedAt: Date.now(),
            };
          });
          persist(next);
          return next;
        });
      } finally {
        setIsStreaming(false);
      }
    },
    [isStreaming, selectedModel.id, webSearchEnabled, persist]
  );

  const clearAll = useCallback(() => {
    setConversations([]);
    setActiveConversationId(null);
    AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
  }, []);

  return (
    <ChatContext.Provider
      value={{
        conversations,
        activeConversationId,
        selectedModel,
        webSearchEnabled,
        isStreaming,
        setSelectedModel,
        setWebSearchEnabled,
        setActiveConversationId,
        createConversation,
        deleteConversation,
        getConversation,
        sendMessage,
        clearAll,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be used inside ChatProvider");
  return ctx;
}
