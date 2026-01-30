import { useState, useCallback, useEffect } from "react";

interface LocalMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  attachments?: { url: string; type: string; name: string }[];
  created_at: string;
}

interface LocalConversation {
  id: string;
  title: string;
  model: string;
  temperature: number;
  top_p: number;
  max_tokens: number;
  messages: LocalMessage[];
  created_at: string;
  updated_at: string;
}

const STORAGE_KEY = "enma_conversations";

const loadFromStorage = (): LocalConversation[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const saveToStorage = (conversations: LocalConversation[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
  } catch (error) {
    console.error("Failed to save conversations to localStorage:", error);
  }
};

export const useLocalConversations = () => {
  const [conversations, setConversations] = useState<LocalConversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load conversations on mount
  useEffect(() => {
    setIsLoading(true);
    const stored = loadFromStorage();
    setConversations(stored);
    setIsLoading(false);
  }, []);

  // Save to storage whenever conversations change
  useEffect(() => {
    if (conversations.length > 0 || loadFromStorage().length > 0) {
      saveToStorage(conversations);
    }
  }, [conversations]);

  const loadConversations = useCallback(() => {
    setIsLoading(true);
    const stored = loadFromStorage();
    setConversations(stored);
    setIsLoading(false);
  }, []);

  const createConversation = useCallback(
    (model: string = "google/gemini-3-flash-preview") => {
      const now = new Date().toISOString();
      const newConv: LocalConversation = {
        id: crypto.randomUUID(),
        title: "New Conversation",
        model,
        temperature: 0.7,
        top_p: 0.9,
        max_tokens: 2048,
        messages: [],
        created_at: now,
        updated_at: now,
      };

      setConversations((prev) => [newConv, ...prev]);
      setCurrentConversationId(newConv.id);
      return newConv;
    },
    []
  );

  const updateConversationTitle = useCallback((id: string, title: string) => {
    setConversations((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, title, updated_at: new Date().toISOString() } : c
      )
    );
  }, []);

  const deleteConversation = useCallback(
    (id: string) => {
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (currentConversationId === id) {
        setCurrentConversationId(null);
      }
    },
    [currentConversationId]
  );

  const getCurrentConversation = useCallback((): LocalConversation | null => {
    return conversations.find((c) => c.id === currentConversationId) || null;
  }, [conversations, currentConversationId]);

  const addMessage = useCallback(
    (
      conversationId: string,
      role: "user" | "assistant",
      content: string,
      attachments?: { url: string; type: string; name: string }[]
    ) => {
      const message: LocalMessage = {
        id: crypto.randomUUID(),
        role,
        content,
        attachments,
        created_at: new Date().toISOString(),
      };

      setConversations((prev) =>
        prev.map((c) =>
          c.id === conversationId
            ? {
                ...c,
                messages: [...c.messages, message],
                updated_at: new Date().toISOString(),
              }
            : c
        )
      );

      return message;
    },
    []
  );

  const updateMessage = useCallback(
    (conversationId: string, messageId: string, content: string) => {
      setConversations((prev) =>
        prev.map((c) =>
          c.id === conversationId
            ? {
                ...c,
                messages: c.messages.map((m) =>
                  m.id === messageId ? { ...m, content } : m
                ),
                updated_at: new Date().toISOString(),
              }
            : c
        )
      );
    },
    []
  );

  const getMessages = useCallback(
    (conversationId: string): LocalMessage[] => {
      const conv = conversations.find((c) => c.id === conversationId);
      return conv?.messages || [];
    },
    [conversations]
  );

  return {
    conversations: conversations.map((c) => ({
      id: c.id,
      title: c.title,
      model: c.model,
      temperature: c.temperature,
      top_p: c.top_p,
      max_tokens: c.max_tokens,
      updated_at: c.updated_at,
    })),
    currentConversationId,
    setCurrentConversationId,
    isLoading,
    createConversation,
    updateConversationTitle,
    deleteConversation,
    getCurrentConversation,
    loadConversations,
    // Additional methods for message handling
    addMessage,
    updateMessage,
    getMessages,
  };
};
