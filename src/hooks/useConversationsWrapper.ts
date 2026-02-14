import { useConversations } from "./useConversations";
import { useLocalConversations } from "./useLocalConversations";
import { useAppConfig } from "@/config/appConfig";

// Unified interface that works for both remote and local
export interface ConversationItem {
  id: string;
  title: string;
  model: string;
  temperature: number;
  top_p: number;
  max_tokens: number;
  updated_at: string;
}

export const useConversationsWrapper = (userId: string | null) => {
  const config = useAppConfig();
  
  // Only enable remote hook when NOT in demo mode
  const remoteHook = useConversations(userId, !config.isDemo);
  const localHook = useLocalConversations();

  if (config.isDemo) {
    return {
      conversations: localHook.conversations as ConversationItem[],
      currentConversationId: localHook.currentConversationId,
      setCurrentConversationId: localHook.setCurrentConversationId,
      isLoading: localHook.isLoading,
      createConversation: localHook.createConversation,
      updateConversationTitle: localHook.updateConversationTitle,
      deleteConversation: localHook.deleteConversation,
      getCurrentConversation: localHook.getCurrentConversation,
      loadConversations: localHook.loadConversations,
      // Local-specific methods for message handling
      addMessage: localHook.addMessage,
      updateMessage: localHook.updateMessage,
      getMessages: localHook.getMessages,
    };
  }

  return {
    conversations: remoteHook.conversations as ConversationItem[],
    currentConversationId: remoteHook.currentConversationId,
    setCurrentConversationId: remoteHook.setCurrentConversationId,
    isLoading: remoteHook.isLoading,
    createConversation: remoteHook.createConversation,
    updateConversationTitle: remoteHook.updateConversationTitle,
    deleteConversation: remoteHook.deleteConversation,
    getCurrentConversation: remoteHook.getCurrentConversation,
    loadConversations: remoteHook.loadConversations,
    // These are undefined for remote mode since messages are handled separately
    addMessage: undefined,
    updateMessage: undefined,
    getMessages: undefined,
  };
};
