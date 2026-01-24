import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { ChatMessage } from "@/components/ChatMessage";
import { ChatInput } from "@/components/ChatInput";
import { SettingsPanel } from "@/components/SettingsPanel";
import { ConversationSidebar } from "@/components/ConversationSidebar";
import { AuthModal } from "@/components/AuthModal";
import { EnmaLogo } from "@/components/EnmaLogo";
import { GlassCard } from "@/components/GlassCard";
import { useChat } from "@/hooks/useChat";
import { useConversations } from "@/hooks/useConversations";
import { Sparkles } from "lucide-react";

interface Settings {
  model: string;
  temperature: number;
  topP: number;
  maxTokens: number;
  accentHue: number;
  systemPrompt: string;
}

const DEFAULT_SETTINGS: Settings = {
  model: "google/gemini-3-flash-preview",
  temperature: 0.7,
  topP: 0.9,
  maxTokens: 2048,
  accentHue: 185,
  systemPrompt: "You are Enma, a helpful AI assistant. You provide clear, accurate, and thoughtful responses.",
};

export const Chat = () => {
  const [user, setUser] = useState<User | null>(null);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    conversations,
    currentConversationId,
    setCurrentConversationId,
    createConversation,
    updateConversationTitle,
    deleteConversation,
    loadConversations,
  } = useConversations(user?.id || null);

  const { messages, isLoading, sendMessage, stopGeneration, loadMessages, clearMessages } =
    useChat(currentConversationId, settings);

  // Auth state
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

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Apply accent hue on mount
  useEffect(() => {
    document.documentElement.style.setProperty("--accent-hue", String(settings.accentHue));
  }, [settings.accentHue]);

  const handleSendMessage = async (content: string) => {
    let convId = currentConversationId;

    // Create new conversation if none exists
    if (!convId) {
      const newConv = await createConversation(settings.model);
      if (newConv) {
        convId = newConv.id;
      }
    }

    if (convId) {
      await sendMessage(content, convId);

      // Update title after first message
      if (messages.length === 0) {
        const title = content.slice(0, 50) + (content.length > 50 ? "..." : "");
        updateConversationTitle(convId, title);
      }
    }
  };

  const handleNewConversation = async () => {
    setCurrentConversationId(null);
    clearMessages();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setCurrentConversationId(null);
    clearMessages();
  };

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
        {/* Messages area */}
        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            // Welcome state
            <div className="h-full flex flex-col items-center justify-center p-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center max-w-2xl"
              >
                <EnmaLogo size="lg" />
                <p className="text-muted-foreground mt-4 mb-8">
                  Select a model and start chatting. Your conversation will be saved automatically.
                </p>

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
                      transition={{ delay: 0.3 + index * 0.1 }}
                      onClick={() => handleSendMessage(prompt)}
                      className="text-left"
                    >
                      <GlassCard
                        variant="subtle"
                        className="p-4 hover:bg-white/5 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <Sparkles size={14} className="text-primary" />
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
            <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
              {messages.map((message, index) => (
                <ChatMessage
                  key={message.id}
                  role={message.role}
                  content={message.content}
                  isStreaming={isLoading && index === messages.length - 1 && message.role === "assistant"}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input area */}
        <div className="p-4 pb-6">
          <div className="max-w-4xl mx-auto">
            <ChatInput
              onSend={handleSendMessage}
              onStop={stopGeneration}
              isLoading={isLoading}
              onOpenSettings={() => setSettingsOpen(true)}
            />
          </div>
        </div>
      </main>

      {/* Settings panel */}
      <SettingsPanel
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        onSettingsChange={setSettings}
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
