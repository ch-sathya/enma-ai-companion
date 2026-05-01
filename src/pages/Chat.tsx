import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChatMessage } from "@/components/ChatMessage";
import { ChatInput } from "@/components/ChatInput";
import { ModelPopup } from "@/components/ModelPopup";
import { PersonaPopup } from "@/components/PersonaPopup";
import { ConversationSidebar } from "@/components/ConversationSidebar";
import { SettingsPopup } from "@/components/SettingsPopup";
import { ProviderSettings } from "@/components/ProviderSettings";
import { EnmaLogo } from "@/components/EnmaLogo";
import { SparkleEffect } from "@/components/SparkleEffect";

import { useLocalChat } from "@/hooks/useLocalChat";
import { useLocalConversations } from "@/hooks/useLocalConversations";
import { useSwipeGesture } from "@/hooks/useSwipeGesture";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useVoice } from "@/hooks/useVoice";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { useProviders } from "@/hooks/useProviders";
import { getPersonaById, Persona } from "@/data/personas";
import { Settings, Sparkles, KeyRound } from "lucide-react";
import { MessageSkeleton } from "@/components/MessageSkeleton";
import { AttachedFile } from "@/components/FileAttachment";

interface ChatSettings {
  model: string;
  personaId: string;
  temperature: number;
  topP: number;
  maxTokens: number;
}

const SETTINGS_KEY = "enma-chat-settings";

const DEFAULT_SETTINGS: ChatSettings = {
  model: "default",
  personaId: "general",
  temperature: 0.7,
  topP: 0.9,
  maxTokens: 2048,
};

const loadSettings = (): ChatSettings => {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
  } catch {
    // ignore
  }
  return DEFAULT_SETTINGS;
};

const saveSettingsToStorage = (settings: ChatSettings) => {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // ignore
  }
};

export const Chat = () => {
  const [settings, setSettings] = useState<ChatSettings>(loadSettings);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [modelPopupOpen, setModelPopupOpen] = useState(false);
  const [personaPopupOpen, setPersonaPopupOpen] = useState(false);
  const [settingsPopupOpen, setSettingsPopupOpen] = useState(false);
  const [providerSettingsOpen, setProviderSettingsOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastSpokenRef = useRef<string>("");
  const usedVoiceInputRef = useRef(false);

  const { preferences, savePreferences } = useUserPreferences();
  const {
    activeProvider,
    activeSettings,
    isReady,
  } = useProviders();

  const {
    conversations,
    currentConversationId,
    setCurrentConversationId,
    createConversation,
    updateConversationTitle,
    deleteConversation,
    addMessage,
    getMessages,
  } = useLocalConversations();

  const persona = getPersonaById(settings.personaId);

  const personalizedSystemPrompt = useMemo(() => {
    let prompt = persona.systemPrompt;
    if (preferences.display_name) {
      prompt += ` Address the user as "${preferences.display_name}" and be warm and personalized.`;
    }
    return prompt;
  }, [persona.systemPrompt, preferences.display_name]);

  const chatSettings = useMemo(
    () => ({
      model: settings.model,
      temperature: settings.temperature,
      topP: settings.topP,
      maxTokens: settings.maxTokens,
      systemPrompt: personalizedSystemPrompt,
    }),
    [settings.model, settings.temperature, settings.topP, settings.maxTokens, personalizedSystemPrompt]
  );

  const localChatOptions = useMemo(
    () => ({
      onAddMessage: addMessage,
      onGetMessages: getMessages,
      onRequestProviderSetup: () => setProviderSettingsOpen(true),
    }),
    [addMessage, getMessages]
  );

  const { messages, isLoading, sendMessage, stopGeneration, loadMessages, clearMessages } =
    useLocalChat(currentConversationId, chatSettings, localChatOptions);

  const handleSendMessageInternal = useCallback(
    async (content: string, attachments?: AttachedFile[]) => {
      let convId = currentConversationId;
      if (!convId) {
        const newConv = createConversation(activeSettings?.model || settings.model);
        if (newConv) convId = newConv.id;
      }
      if (convId) {
        lastSpokenRef.current = "";
        await sendMessage(content, convId, attachments);
        if (messages.length === 0) {
          const title = content.slice(0, 50) + (content.length > 50 ? "..." : "");
          updateConversationTitle(convId, title);
        }
      }
    },
    [
      currentConversationId,
      createConversation,
      activeSettings?.model,
      settings.model,
      sendMessage,
      messages.length,
      updateConversationTitle,
    ]
  );

  const handleSendMessage = useCallback(
    (content: string, attachments?: AttachedFile[]) => {
      void handleSendMessageInternal(content, attachments);
    },
    [handleSendMessageInternal]
  );

  const handleVoiceTranscript = useCallback(
    (text: string) => {
      if (text.trim()) {
        usedVoiceInputRef.current = true;
        void handleSendMessageInternal(text);
      }
    },
    [handleSendMessageInternal]
  );

  const voice = useVoice({
    onTranscript: handleVoiceTranscript,
    voiceEnabled: preferences.voice_enabled,
    preferredVoice: preferences.preferred_voice,
  });

  const { toggleListening } = voice;
  const handleVoiceToggle = useCallback(() => toggleListening(), [toggleListening]);

  // Speak only when voice was used to send the message
  useEffect(() => {
    if (!preferences.voice_enabled || messages.length === 0 || isLoading) return;
    if (!usedVoiceInputRef.current) return;
    const last = messages[messages.length - 1];
    if (last.role === "assistant" && last.content && last.content !== lastSpokenRef.current) {
      lastSpokenRef.current = last.content;
      voice.speak(last.content);
      usedVoiceInputRef.current = false;
    }
  }, [messages, isLoading, preferences.voice_enabled, voice]);

  useEffect(() => saveSettingsToStorage(settings), [settings]);

  const openSidebar = useCallback(() => setSidebarOpen(true), []);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);
  useSwipeGesture({ onSwipeRight: openSidebar, onSwipeLeft: closeSidebar });

  useEffect(() => {
    if (currentConversationId) loadMessages(currentConversationId);
    else clearMessages();
  }, [currentConversationId, loadMessages, clearMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  const handleNewConversation = useCallback(() => {
    setCurrentConversationId(null);
    clearMessages();
    lastSpokenRef.current = "";
  }, [setCurrentConversationId, clearMessages]);

  const closeAllPopups = useCallback(() => {
    setModelPopupOpen(false);
    setPersonaPopupOpen(false);
    setSettingsPopupOpen(false);
    setProviderSettingsOpen(false);
  }, []);

  useKeyboardShortcuts({
    onToggleSidebar: useCallback(() => setSidebarOpen((p) => !p), []),
    onNewChat: handleNewConversation,
    onOpenModelPopup: useCallback(() => setModelPopupOpen(true), []),
    onClosePopups: closeAllPopups,
  });

  const handleSelectPersona = (newPersona: Persona) => {
    setSettings((prev) => ({ ...prev, personaId: newPersona.id }));
  };

  const messageElements = useMemo(
    () =>
      messages.map((message, index) => (
        <ChatMessage
          key={message.id}
          role={message.role}
          content={message.content}
          attachments={message.attachments}
          isStreaming={isLoading && index === messages.length - 1 && message.role === "assistant"}
        />
      )),
    [messages, isLoading]
  );

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    const name = preferences.display_name || "";
    const nameGreeting = name ? `, ${name}` : "";
    if (hour < 12) return `Good morning${nameGreeting}!`;
    if (hour < 17) return `Good afternoon${nameGreeting}!`;
    return `Good evening${nameGreeting}!`;
  }, [preferences.display_name]);

  return (
    <div className="h-screen flex overflow-hidden">
      <ConversationSidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        conversations={conversations}
        currentConversationId={currentConversationId}
        onSelectConversation={setCurrentConversationId}
        onNewConversation={handleNewConversation}
        onDeleteConversation={deleteConversation}
        providerLabel={activeProvider?.name}
        modelLabel={activeSettings?.model}
        isReady={isReady}
        onOpenProviders={() => setProviderSettingsOpen(true)}
      />

      <main
        className={`flex-1 flex flex-col transition-all duration-300 ${
          sidebarOpen ? "md:ml-[280px]" : ""
        }`}
      >
        {!sidebarOpen && (
          <div className="h-14 flex-shrink-0 flex items-center justify-between px-4 border-b border-white/5 safe-top">
            <EnmaLogo size="sm" />
            <div className="flex items-center gap-2">
              <button
                onClick={() => setProviderSettingsOpen(true)}
                className={`px-2.5 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-colors border ${
                  isReady
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300 hover:bg-emerald-500/20"
                    : "bg-amber-500/10 border-amber-500/20 text-amber-300 hover:bg-amber-500/20"
                }`}
                title="Configure model provider"
              >
                <KeyRound size={12} />
                <span className="font-medium">
                  {isReady ? activeProvider?.name : "Connect model"}
                </span>
              </button>
              <button
                onClick={() => setSettingsPopupOpen(true)}
                className="p-2 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
                title="Settings"
              >
                <Settings size={18} />
              </button>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto scroll-smooth" style={{ contain: "content" }}>
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center p-6 text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center text-center max-w-2xl w-full"
              >
                <div className="relative">
                  <EnmaLogo size="lg" centered asLink={false} />
                  <SparkleEffect isActive={isLoading} />
                </div>
                <p className="text-lg text-foreground mt-3">{greeting}</p>
                <p className="text-muted-foreground mt-1 mb-6">How can I help you today?</p>

                {!isReady && (
                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    onClick={() => setProviderSettingsOpen(true)}
                    className="mb-6 group inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-foreground text-background font-medium hover:opacity-90 transition-all"
                  >
                    <Sparkles size={16} />
                    Connect your model
                  </motion.button>
                )}

                <div className="flex flex-wrap justify-center gap-2 w-full">
                  {["Write a poem", "Explain something", "Brainstorm ideas"].map((s, i) => (
                    <motion.button
                      key={s}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + i * 0.1, duration: 0.3 }}
                      onClick={() => handleSendMessage(s)}
                      className="px-4 py-2 text-sm text-muted-foreground bg-white/5 rounded-full hover:bg-white/10 hover:text-foreground transition-all border border-white/10 hover:scale-105 hover:border-white/20"
                    >
                      {s}
                    </motion.button>
                  ))}
                </div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7, duration: 0.4 }}
                  className="mt-8 flex items-center gap-2 text-muted-foreground/60"
                >
                  <div className="flex gap-1">
                    {[0, 0.2, 0.4].map((d) => (
                      <motion.span
                        key={d}
                        className="w-1.5 h-1.5 bg-current rounded-full"
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1.4, repeat: Infinity, delay: d }}
                      />
                    ))}
                  </div>
                  <span className="text-xs">
                    {isReady ? `Ready · ${activeProvider?.name}` : "Demo mode — connect a key for real AI"}
                  </span>
                </motion.div>
              </motion.div>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={currentConversationId || "default"}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="max-w-3xl mx-auto px-4 py-8 space-y-6"
              >
                {messageElements}
                {isLoading &&
                  messages.length > 0 &&
                  messages[messages.length - 1].role === "user" && <MessageSkeleton />}
                <div ref={messagesEndRef} />
              </motion.div>
            </AnimatePresence>
          )}
        </div>

        <div className="px-4 pb-6 safe-bottom">
          <div className="max-w-3xl mx-auto">
            <ChatInput
              onSend={handleSendMessage}
              onStop={stopGeneration}
              isLoading={isLoading}
              selectedModel={settings.model}
              selectedPersonaId={settings.personaId}
              onOpenModelPopup={() => setModelPopupOpen(true)}
              onOpenPersonaPopup={() => setPersonaPopupOpen(true)}
              isListening={voice.isListening}
              isSpeaking={voice.isSpeaking}
              isVoiceSupported={voice.isSupported}
              onVoiceToggle={handleVoiceToggle}
              onStopSpeaking={voice.stopSpeaking}
            />
          </div>
        </div>
      </main>

      <ModelPopup
        isOpen={modelPopupOpen}
        onClose={() => setModelPopupOpen(false)}
        selectedModel={settings.model}
        onSelectModel={(model) => setSettings((p) => ({ ...p, model }))}
        temperature={settings.temperature}
        topP={settings.topP}
        maxTokens={settings.maxTokens}
        onTemperatureChange={(temperature) => setSettings((p) => ({ ...p, temperature }))}
        onTopPChange={(topP) => setSettings((p) => ({ ...p, topP }))}
        onMaxTokensChange={(maxTokens) => setSettings((p) => ({ ...p, maxTokens }))}
      />

      <PersonaPopup
        isOpen={personaPopupOpen}
        onClose={() => setPersonaPopupOpen(false)}
        selectedPersonaId={settings.personaId}
        onSelectPersona={handleSelectPersona}
      />

      <SettingsPopup
        isOpen={settingsPopupOpen}
        onClose={() => setSettingsPopupOpen(false)}
        preferences={preferences}
        onSave={savePreferences}
      />

      <ProviderSettings
        isOpen={providerSettingsOpen}
        onClose={() => setProviderSettingsOpen(false)}
      />
    </div>
  );
};

export default Chat;
