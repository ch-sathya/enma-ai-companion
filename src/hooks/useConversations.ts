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

export const useConversations = (userId: string | null) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadConversations = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("conversations")
      .select("*")
      .order("updated_at", { ascending: false });

    if (!error && data) {
      setConversations(data as Conversation[]);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations, userId]);

  const createConversation = useCallback(
    async (model: string = "google/gemini-3-flash-preview") => {
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
    [userId]
  );

  const updateConversationTitle = useCallback(async (id: string, title: string) => {
    const { error } = await supabase
      .from("conversations")
      .update({ title })
      .eq("id", id);

    if (!error) {
      setConversations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, title } : c))
      );
    }
  }, []);

  const deleteConversation = useCallback(async (id: string) => {
    const { error } = await supabase.from("conversations").delete().eq("id", id);

    if (!error) {
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (currentConversationId === id) {
        setCurrentConversationId(null);
      }
    }
  }, [currentConversationId]);

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
