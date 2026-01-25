import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
import { SparkleEffect } from "@/components/SparkleEffect";

import { useChat } from "@/hooks/useChat";
import { useConversations } from "@/hooks/useConversations";
import { useSwipeGesture } from "@/hooks/useSwipeGesture";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useVoice } from "@/hooks/useVoice";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { getPersonaById, Persona } from "@/data/personas";
import { Settings } from "lucide-react";
import { toast } from "sonner";
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
  const usedVoiceInputRef = useRef(false);

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

  // Voice handling - mark that voice was used
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
    onWakeWord: () => {
      // When wake word detected, start main listening mode
      voice.stopWakeWordDetection?.();
      toast.success("Hey! I'm listening...");
    },
    wakeWordEnabled: preferences.wake_word_enabled,
    voiceEnabled: preferences.voice_enabled,
    preferredVoice: preferences.preferred_voice,
  });

  // Start wake word detection when enabled
  useEffect(() => {
    if (preferences.wake_word_enabled && voice.isSupported && !voice.isListening) {
      voice.startWakeWordDetection?.();
    }
    return () => {
      if (voice.isWakeWordMode) {
        voice.stopWakeWordDetection?.();
      }
    };
  }, [preferences.wake_word_enabled, voice.isSupported]);

  // Destructure voice methods
  const {
    toggleListening,
    hasPermission,
    isListening,
    isSupported,
  } = voice;

  const handleVoiceToggle = useCallback(() => {
    toggleListening();
  }, [toggleListening]);

  // Speak assistant responses ONLY if user used voice input
  useEffect(() => {
    if (!preferences.voice_enabled || messages.length === 0 || isLoading) return;
    if (!usedVoiceInputRef.current) return; // Only speak if voice was used

    const lastMessage = messages[messages.length - 1];
    if (
      lastMessage.role === "assistant" &&
      lastMessage.content &&
      lastMessage.content !== lastSpokenRef.current
    ) {
      lastSpokenRef.current = lastMessage.content;
      voice.speak(lastMessage.content);
      usedVoiceInputRef.current = false; // Reset after speaking
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
                <p className="text-lg text-foreground mt-3 text-center w-full">{greeting}</p>
                <p className="text-muted-foreground mt-1 mb-6 text-center w-full">
                  How can I help you today?
                </p>
                
                {/* Minimal suggestions */}
                <div className="flex flex-wrap justify-center gap-2 w-full">
                  {[
                    "Write a poem",
                    "Explain something",
                    "Brainstorm ideas",
                  ].map((suggestion, index) => (
                    <motion.button
                      key={suggestion}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + index * 0.1, duration: 0.3 }}
                      onClick={() => handleSendMessage(suggestion)}
                      className="px-4 py-2 text-sm text-muted-foreground bg-white/5 rounded-full 
                                 hover:bg-white/10 hover:text-foreground transition-all border border-white/10
                                 hover:scale-105 hover:border-white/20"
                    >
                      {suggestion}
                    </motion.button>
                  ))}
                </div>
                
                {/* Typing indicator - ready to help */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7, duration: 0.4 }}
                  className="mt-8 flex items-center gap-2 text-muted-foreground/60"
                >
                  <div className="flex gap-1">
                    <motion.span
                      className="w-1.5 h-1.5 bg-current rounded-full"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1.4, repeat: Infinity, delay: 0 }}
                    />
                    <motion.span
                      className="w-1.5 h-1.5 bg-current rounded-full"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1.4, repeat: Infinity, delay: 0.2 }}
                    />
                    <motion.span
                      className="w-1.5 h-1.5 bg-current rounded-full"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1.4, repeat: Infinity, delay: 0.4 }}
                    />
                  </div>
                  <span className="text-xs">Ready to assist</span>
                </motion.div>
              </motion.div>
            </div>
          ) : (
            // Messages with conversation transition
            <AnimatePresence mode="wait">
              <motion.div 
                key={currentConversationId || 'default'}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="max-w-3xl mx-auto px-4 py-8 space-y-6"
              >
                {messageElements}
                {isLoading && messages.length > 0 && messages[messages.length - 1].role === "user" && (
                  <MessageSkeleton />
                )}
                <div ref={messagesEndRef} />
              </motion.div>
            </AnimatePresence>
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
