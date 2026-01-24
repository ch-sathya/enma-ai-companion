import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { ChatMessage } from "@/components/ChatMessage";
import { ChatInput } from "@/components/ChatInput";
import { ModelPopup } from "@/components/ModelPopup";
import { PersonaPopup } from "@/components/PersonaPopup";
import { ConversationSidebar } from "@/components/ConversationSidebar";
import { AuthModal } from "@/components/AuthModal";
import { SettingsPopup } from "@/components/SettingsPopup";
import { EnmaLogo } from "@/components/EnmaLogo";
import { GlassCard } from "@/components/GlassCard";

import { VoicePreviewCard } from "@/components/VoicePreviewCard";
import { useChat } from "@/hooks/useChat";
import { useConversations } from "@/hooks/useConversations";
import { useSwipeGesture } from "@/hooks/useSwipeGesture";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useVoice } from "@/hooks/useVoice";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { getPersonaById, Persona } from "@/data/personas";
import { Sparkles, Settings } from "lucide-react";
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
  model: "google/gemini-3-flash-preview",
  personaId: "general",
  temperature: 0.7,
  topP: 0.9,
  maxTokens: 2048,
};

const loadSettings = (): ChatSettings => {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    }
  } catch {
    // Ignore parse errors
  }
  return DEFAULT_SETTINGS;
};

const saveSettingsToStorage = (settings: ChatSettings) => {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // Ignore storage errors
  }
};

export const Chat = () => {
  const [user, setUser] = useState<User | null>(null);
  const [settings, setSettings] = useState<ChatSettings>(loadSettings);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [modelPopupOpen, setModelPopupOpen] = useState(false);
  const [personaPopupOpen, setPersonaPopupOpen] = useState(false);
  const [settingsPopupOpen, setSettingsPopupOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastSpokenRef = useRef<string>("");

  // User preferences
  const { preferences, savePreferences } = useUserPreferences(user);

  const {
    conversations,
    currentConversationId,
    setCurrentConversationId,
    createConversation,
    updateConversationTitle,
    deleteConversation,
    loadConversations,
  } = useConversations(user?.id || null);

  const persona = getPersonaById(settings.personaId);
  
  // Build personalized system prompt
  const personalizedSystemPrompt = useMemo(() => {
    let prompt = persona.systemPrompt;
    if (preferences.display_name) {
      prompt += ` Address the user as "${preferences.display_name}" and be warm and personalized in your responses.`;
    }
    return prompt;
  }, [persona.systemPrompt, preferences.display_name]);

  const chatSettings = useMemo(() => ({
    model: settings.model,
    temperature: settings.temperature,
    topP: settings.topP,
    maxTokens: settings.maxTokens,
    systemPrompt: personalizedSystemPrompt,
  }), [settings.model, settings.temperature, settings.topP, settings.maxTokens, personalizedSystemPrompt]);

  const { messages, isLoading, sendMessage, stopGeneration, loadMessages, clearMessages } =
    useChat(currentConversationId, chatSettings);

  const handleSendMessageInternal = useCallback(
    async (content: string, attachments?: AttachedFile[]) => {
      let convId = currentConversationId;

      // Create new conversation if none exists
      if (!convId) {
        const newConv = await createConversation(settings.model);
        if (newConv) {
          convId = newConv.id;
        }
      }

      if (convId) {
        // Reset last spoken to allow new response to be spoken
        lastSpokenRef.current = "";
        await sendMessage(content, convId, attachments);

        // Update title after first message
        if (messages.length === 0) {
          const title = content.slice(0, 50) + (content.length > 50 ? "..." : "");
          updateConversationTitle(convId, title);
        }
      }
    },
    [
      currentConversationId,
      createConversation,
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

  // Voice handling
  const handleVoiceTranscript = useCallback(
    (text: string) => {
      if (text.trim()) {
        void handleSendMessageInternal(text);
      }
    },
    [handleSendMessageInternal]
  );

  const handleWakeWord = useCallback(() => {
    // Wake word detected - visual feedback could be added here
    console.log("Wake word detected!");
  }, []);

  const voice = useVoice({
    onTranscript: handleVoiceTranscript,
    onWakeWord: handleWakeWord,
    wakeWordEnabled: preferences.wake_word_enabled,
    voiceEnabled: preferences.voice_enabled,
    preferredVoice: preferences.preferred_voice,
  });

  // Auto-start/stop wake word listening when enabled (only after mic permission)
  const {
    startWakeWordDetection,
    stopWakeWordDetection,
    toggleListening,
    hasPermission,
    isListening,
  } = voice;
  useEffect(() => {
    if (preferences.wake_word_enabled && hasPermission === true) {
      void startWakeWordDetection();
    } else {
      stopWakeWordDetection();
    }
    return () => stopWakeWordDetection();
  }, [
    preferences.wake_word_enabled,
    hasPermission,
    startWakeWordDetection,
    stopWakeWordDetection,
  ]);

  const handleVoiceToggle = useCallback(() => {
    // If wake word is enabled, mic button controls wake-word listening mode.
    // This ensures a user gesture kicks off permissions in stricter browsers.
    if (preferences.wake_word_enabled) {
      if (isListening) stopWakeWordDetection();
      else void startWakeWordDetection();
      return;
    }

    toggleListening();
  }, [
    preferences.wake_word_enabled,
    isListening,
    startWakeWordDetection,
    stopWakeWordDetection,
    toggleListening,
  ]);

  // Speak assistant responses
  useEffect(() => {
    if (!preferences.voice_enabled || messages.length === 0 || isLoading) return;

    const lastMessage = messages[messages.length - 1];
    if (
      lastMessage.role === "assistant" &&
      lastMessage.content &&
      lastMessage.content !== lastSpokenRef.current
    ) {
      lastSpokenRef.current = lastMessage.content;
      voice.speak(lastMessage.content);
    }
  }, [messages, isLoading, preferences.voice_enabled, voice]);

  // Save settings when changed
  useEffect(() => {
    saveSettingsToStorage(settings);
  }, [settings]);

  // Swipe gestures for mobile sidebar
  const openSidebar = useCallback(() => setSidebarOpen(true), []);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);
  useSwipeGesture({
    onSwipeRight: openSidebar,
    onSwipeLeft: closeSidebar,
  });

  useEffect(() => {
    supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadConversations();
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
  }, [loadConversations]);

  // Load messages when conversation changes
  useEffect(() => {
    if (currentConversationId) {
      loadMessages(currentConversationId);
    } else {
      clearMessages();
    }
  }, [currentConversationId, loadMessages, clearMessages]);

  // Smooth scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [messages]);

  const handleNewConversation = useCallback(() => {
    setCurrentConversationId(null);
    clearMessages();
    lastSpokenRef.current = "";
  }, [setCurrentConversationId, clearMessages]);

  // Keyboard shortcuts
  const closeAllPopups = useCallback(() => {
    setModelPopupOpen(false);
    setPersonaPopupOpen(false);
    setSettingsPopupOpen(false);
    setAuthOpen(false);
  }, []);

  useKeyboardShortcuts({
    onToggleSidebar: useCallback(() => setSidebarOpen(prev => !prev), []),
    onNewChat: handleNewConversation,
    onOpenModelPopup: useCallback(() => setModelPopupOpen(true), []),
    onClosePopups: closeAllPopups,
  });

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setCurrentConversationId(null);
    clearMessages();
  };

  const handleSelectPersona = (newPersona: Persona) => {
    setSettings(prev => ({ ...prev, personaId: newPersona.id }));
  };

  // Memoize messages list
  const messageElements = useMemo(() => (
    messages.map((message, index) => (
      <ChatMessage
        key={message.id}
        role={message.role}
        content={message.content}
        attachments={message.attachments}
        isStreaming={isLoading && index === messages.length - 1 && message.role === "assistant"}
      />
    ))
  ), [messages, isLoading]);

  // Personalized greeting
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
      {/* Sidebar */}
      <ConversationSidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        conversations={conversations}
        currentConversationId={currentConversationId}
        onSelectConversation={setCurrentConversationId}
        onNewConversation={handleNewConversation}
        onDeleteConversation={deleteConversation}
        user={user}
        onLogout={handleLogout}
        onLogin={() => setAuthOpen(true)}
      />

      {/* Main chat area */}
      <main
        className={`flex-1 flex flex-col transition-all duration-300 ${
          sidebarOpen ? "md:ml-[280px]" : ""
        }`}
      >
        {/* Header */}
        {!sidebarOpen && (
          <div className="h-14 flex-shrink-0 flex items-center justify-between px-4 border-b border-white/5 safe-top">
            <EnmaLogo size="sm" />
            <button
              onClick={() => setSettingsPopupOpen(true)}
              className="p-2 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
              title="Settings"
            >
              <Settings size={18} />
            </button>
          </div>
        )}

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto scroll-smooth" style={{ contain: "content" }}>
          {messages.length === 0 ? (
            // Welcome state
            <div className="h-full flex flex-col items-center justify-center p-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center max-w-2xl"
              >
                <EnmaLogo size="lg" centered asLink={false} />
                <p className="text-lg text-foreground mt-4">{greeting}</p>
                <p className="text-muted-foreground mt-2 mb-8">
                  How can I help you today?
                </p>

                <VoicePreviewCard
                  enabled={preferences.voice_enabled && voice.isTTSSupported}
                  isSpeaking={voice.isSpeaking}
                  onPlay={() =>
                    voice.speak(
                      preferences.display_name
                        ? `Hello ${preferences.display_name}. I'm Enma. How can I help you today?`
                        : "Hello. I'm Enma. How can I help you today?"
                    )
                  }
                  onStop={voice.stopSpeaking}
                />

                {/* Quick prompts */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto">
                  {[
                    "Explain quantum computing",
                    "Write a Python function",
                    "Help me brainstorm ideas",
                    "What can you help me with?",
                  ].map((prompt, index) => (
                    <motion.button
                      key={prompt}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 + index * 0.08 }}
                      onClick={() => handleSendMessage(prompt)}
                      className="text-left"
                    >
                      <GlassCard
                        variant="subtle"
                        glow
                        className="p-4 prompt-card cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <Sparkles size={14} className="text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">{prompt}</span>
                        </div>
                      </GlassCard>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            </div>
          ) : (
            // Messages
            <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
              {messageElements}
              {isLoading && messages.length > 0 && messages[messages.length - 1].role === "user" && (
                <MessageSkeleton />
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input area */}
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

      {/* Model popup */}
      <ModelPopup
        isOpen={modelPopupOpen}
        onClose={() => setModelPopupOpen(false)}
        selectedModel={settings.model}
        onSelectModel={(model) => setSettings(prev => ({ ...prev, model }))}
        temperature={settings.temperature}
        topP={settings.topP}
        maxTokens={settings.maxTokens}
        onTemperatureChange={(temperature) => setSettings(prev => ({ ...prev, temperature }))}
        onTopPChange={(topP) => setSettings(prev => ({ ...prev, topP }))}
        onMaxTokensChange={(maxTokens) => setSettings(prev => ({ ...prev, maxTokens }))}
      />

      {/* Persona popup */}
      <PersonaPopup
        isOpen={personaPopupOpen}
        onClose={() => setPersonaPopupOpen(false)}
        selectedPersonaId={settings.personaId}
        onSelectPersona={handleSelectPersona}
      />

      {/* Settings popup */}
      <SettingsPopup
        isOpen={settingsPopupOpen}
        onClose={() => setSettingsPopupOpen(false)}
        preferences={preferences}
        onSave={savePreferences}
      />

      {/* Auth modal */}
      <AuthModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        onSuccess={() => loadConversations()}
      />
    </div>
  );
};

export default Chat;
