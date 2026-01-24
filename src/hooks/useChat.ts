import { useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AttachedFile } from "@/components/FileAttachment";
import type { Json } from "@/integrations/supabase/types";

interface Attachment {
  url: string;
  type: string;
  name: string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  attachments?: Attachment[];
}

interface ChatSettings {
  model: string;
  temperature: number;
  topP: number;
  maxTokens: number;
  systemPrompt: string;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

export const useChat = (conversationId: string | null, settings: ChatSettings) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const loadMessages = useCallback(async (convId: string) => {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", convId)
      .order("created_at", { ascending: true });

    if (!error && data) {
      setMessages(
        data
          .filter((m) => m.role !== "system")
          .map((m) => ({
            id: m.id,
            role: m.role as "user" | "assistant",
            content: m.content,
            attachments: (m.attachments as unknown as Attachment[]) || [],
          }))
      );
    }
  }, []);

  const saveMessage = async (
    role: "user" | "assistant",
    content: string,
    convId: string,
    attachments?: Attachment[]
  ) => {
    const insertData: {
      conversation_id: string;
      role: string;
      content: string;
      attachments?: Json;
    } = {
      conversation_id: convId,
      role,
      content,
    };

    if (attachments && attachments.length > 0) {
      insertData.attachments = attachments as unknown as Json;
    }

    const { data, error } = await supabase
      .from("messages")
      .insert(insertData)
      .select()
      .maybeSingle();

    return data;
  };

  const uploadAttachments = useCallback(
    async (files: AttachedFile[]): Promise<Attachment[]> => {
      const uploaded: Attachment[] = [];

      for (const file of files) {
        const fileName = `${Date.now()}-${file.file.name}`;
        const { data, error } = await supabase.storage
          .from("chat-attachments")
          .upload(fileName, file.file);

        if (error) {
          console.error("Error uploading file:", error);
          continue;
        }

        const { data: urlData } = supabase.storage
          .from("chat-attachments")
          .getPublicUrl(data.path);

        uploaded.push({
          url: urlData.publicUrl,
          type: file.type,
          name: file.file.name,
        });
      }

      return uploaded;
    },
    []
  );

  const sendMessage = useCallback(
    async (content: string, convId: string, attachments?: AttachedFile[]) => {
      if (!content.trim() && (!attachments || attachments.length === 0)) return;
      if (isLoading) return;

      setIsLoading(true);

      // Upload attachments first
      let uploadedAttachments: Attachment[] = [];
      if (attachments && attachments.length > 0) {
        uploadedAttachments = await uploadAttachments(attachments);
      }

      // Add user message
      const userMsgId = crypto.randomUUID();
      const userMsg: Message = { 
        id: userMsgId, 
        role: "user", 
        content,
        attachments: uploadedAttachments,
      };
      setMessages((prev) => [...prev, userMsg]);

      // Save user message
      await saveMessage("user", content, convId, uploadedAttachments);

      // Prepare messages for API - handle multimodal content
      const apiMessages = [
        ...messages.map((m) => {
          if (m.attachments && m.attachments.length > 0) {
            const contentParts: any[] = [];
            if (m.content) {
              contentParts.push({ type: "text", text: m.content });
            }
            for (const att of m.attachments) {
              if (att.type === "image") {
                contentParts.push({
                  type: "image_url",
                  image_url: { url: att.url },
                });
              }
            }
            return { role: m.role, content: contentParts.length > 0 ? contentParts : m.content };
          }
          return { role: m.role, content: m.content };
        }),
        // Add current message
        (() => {
          if (uploadedAttachments.length > 0) {
            const contentParts: any[] = [];
            if (content) {
              contentParts.push({ type: "text", text: content });
            }
            for (const att of uploadedAttachments) {
              if (att.type === "image") {
                contentParts.push({
                  type: "image_url",
                  image_url: { url: att.url },
                });
              }
            }
            return { role: "user" as const, content: contentParts.length > 0 ? contentParts : content };
          }
          return { role: "user" as const, content };
        })(),
      ];

      // Create abort controller
      abortControllerRef.current = new AbortController();

      try {
        const response = await fetch(CHAT_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: apiMessages,
            model: settings.model,
            temperature: settings.temperature,
            top_p: settings.topP,
            max_tokens: settings.maxTokens,
            system_prompt: settings.systemPrompt,
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || "Failed to get response");
        }

        if (!response.body) throw new Error("No response body");

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let textBuffer = "";
        let assistantContent = "";
        const assistantMsgId = crypto.randomUUID();

        // Add empty assistant message
        setMessages((prev) => [
          ...prev,
          { id: assistantMsgId, role: "assistant", content: "" },
        ]);

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          textBuffer += decoder.decode(value, { stream: true });

          let newlineIndex: number;
          while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
            let line = textBuffer.slice(0, newlineIndex);
            textBuffer = textBuffer.slice(newlineIndex + 1);

            if (line.endsWith("\r")) line = line.slice(0, -1);
            if (line.startsWith(":") || line.trim() === "") continue;
            if (!line.startsWith("data: ")) continue;

            const jsonStr = line.slice(6).trim();
            if (jsonStr === "[DONE]") break;

            try {
              const parsed = JSON.parse(jsonStr);
              const delta = parsed.choices?.[0]?.delta?.content;
              if (delta) {
                assistantContent += delta;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMsgId
                      ? { ...m, content: assistantContent }
                      : m
                  )
                );
              }
            } catch {
              textBuffer = line + "\n" + textBuffer;
              break;
            }
          }
        }

        // Save assistant message
        if (assistantContent) {
          await saveMessage("assistant", assistantContent, convId);
        }
      } catch (error: any) {
        if (error.name !== "AbortError") {
          console.error("Chat error:", error);
          setMessages((prev) => [
            ...prev,
            {
              id: crypto.randomUUID(),
              role: "assistant",
              content: `Error: ${error.message || "Failed to get response"}`,
            },
          ]);
        }
      } finally {
        setIsLoading(false);
        abortControllerRef.current = null;
      }
    },
    [messages, settings, isLoading, uploadAttachments]
  );

  const stopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsLoading(false);
    }
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    isLoading,
    sendMessage,
    stopGeneration,
    loadMessages,
    clearMessages,
  };
};