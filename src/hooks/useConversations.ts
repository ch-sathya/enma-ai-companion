import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Conversation {
  id: string;
  title: string;
  model: string;
  temperature: number;
  top_p: number;
  max_tokens: number;
  updated_at: string;
}

export const useConversations = (userId: string | null, enabled: boolean = true) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadConversations = useCallback(async () => {
    if (!enabled) return;
    setIsLoading(true);
    const { data, error } = await supabase
      .from("conversations")
      .select("*")
      .order("updated_at", { ascending: false });

    if (!error && data) {
      setConversations(data as Conversation[]);
    }
    setIsLoading(false);
  }, [enabled]);

  useEffect(() => {
    if (enabled) {
      loadConversations();
    }
  }, [loadConversations, userId, enabled]);

  const createConversation = useCallback(
    async (model: string = "google/gemini-3-flash-preview") => {
      if (!enabled) return null;
      const { data, error } = await supabase
        .from("conversations")
        .insert({
          user_id: userId,
          title: "New Conversation",
          model,
        })
        .select()
        .single();

      if (!error && data) {
        const conv = data as Conversation;
        setConversations((prev) => [conv, ...prev]);
        setCurrentConversationId(conv.id);
        return conv;
      }
      return null;
    },
    [userId, enabled]
  );

  const updateConversationTitle = useCallback(async (id: string, title: string) => {
    if (!enabled) return;
    const { error } = await supabase
      .from("conversations")
      .update({ title })
      .eq("id", id);

    if (!error) {
      setConversations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, title } : c))
      );
    }
  }, [enabled]);

  const deleteConversation = useCallback(async (id: string) => {
    if (!enabled) return;
    const { error } = await supabase.from("conversations").delete().eq("id", id);

    if (!error) {
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (currentConversationId === id) {
        setCurrentConversationId(null);
      }
    }
  }, [currentConversationId, enabled]);

  const getCurrentConversation = useCallback(() => {
    return conversations.find((c) => c.id === currentConversationId) || null;
  }, [conversations, currentConversationId]);

  return {
    conversations,
    currentConversationId,
    setCurrentConversationId,
    isLoading,
    createConversation,
    updateConversationTitle,
    deleteConversation,
    getCurrentConversation,
    loadConversations,
  };
};
