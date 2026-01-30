import { useChat } from "./useChat";
import { useLocalChat } from "./useLocalChat";
import { useAppConfig } from "@/config/appConfig";
import { AttachedFile } from "@/components/FileAttachment";

interface Attachment {
  url: string;
  type: string;
  name: string;
}

interface ChatSettings {
  model: string;
  temperature: number;
  topP: number;
  maxTokens: number;
  systemPrompt: string;
}

interface LocalChatOptions {
  onAddMessage?: (
    conversationId: string,
    role: "user" | "assistant",
    content: string,
    attachments?: Attachment[]
  ) => { id: string };
  onUpdateMessage?: (conversationId: string, messageId: string, content: string) => void;
  onGetMessages?: (conversationId: string) => Array<{
    id: string;
    role: "user" | "assistant";
    content: string;
    attachments?: Attachment[];
  }>;
}

export const useChatWrapper = (
  conversationId: string | null,
  settings: ChatSettings,
  localOptions: LocalChatOptions = {}
) => {
  const config = useAppConfig();
  
  const remoteHook = useChat(conversationId, settings);
  const localHook = useLocalChat(conversationId, settings, localOptions);

  if (config.isDemo) {
    return {
      messages: localHook.messages,
      isLoading: localHook.isLoading,
      sendMessage: localHook.sendMessage,
      stopGeneration: localHook.stopGeneration,
      loadMessages: localHook.loadMessages,
      clearMessages: localHook.clearMessages,
    };
  }

  return {
    messages: remoteHook.messages,
    isLoading: remoteHook.isLoading,
    sendMessage: remoteHook.sendMessage,
    stopGeneration: remoteHook.stopGeneration,
    loadMessages: remoteHook.loadMessages,
    clearMessages: remoteHook.clearMessages,
  };
};
