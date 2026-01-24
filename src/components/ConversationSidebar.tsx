import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Plus, Trash2, Menu, X, LogOut, User, PanelLeftClose, PanelLeft } from "lucide-react";
import { GlassCard } from "./GlassCard";
import { EnmaLogo } from "./EnmaLogo";
import { ConversationSkeleton } from "./MessageSkeleton";
import { formatDistanceToNow } from "date-fns";

interface Conversation {
  id: string;
  title: string;
  updated_at: string;
}

interface ConversationSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  conversations: Conversation[];
  currentConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
  user: { email?: string } | null;
  onLogout: () => void;
  onLogin: () => void;
  isLoading?: boolean;
}

export const ConversationSidebar = ({
  isOpen,
  onToggle,
  conversations,
  currentConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  user,
  onLogout,
  onLogin,
  isLoading = false,
}: ConversationSidebarProps) => {
  return (
    <>
      {/* Mobile toggle - only visible on mobile when sidebar closed */}
      {!isOpen && (
        <button
          onClick={onToggle}
          className="fixed top-4 left-4 z-50 p-2 rounded-lg glass md:hidden safe-top"
        >
          <Menu size={20} />
        </button>
      )}

      {/* Backdrop for mobile */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-30 md:hidden"
            onClick={onToggle}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          x: isOpen ? 0 : -280,
        }}
        className="fixed left-0 top-0 h-full w-[280px] z-40 flex flex-col"
      >
        <GlassCard variant="strong" className="h-full rounded-none rounded-r-2xl flex flex-col">
          {/* Logo */}
          <div className="h-14 px-4 flex items-center border-b border-white/5 mt-safe">
            <EnmaLogo size="sm" showIcon={true} />
          </div>

          {/* New chat button */}
          <div className="px-4 py-4">
            <button
              onClick={onNewConversation}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-foreground border border-white/10 transition-all"
            >
              <Plus size={18} />
              <span className="font-medium">New Chat</span>
            </button>
          </div>

          {/* Conversations list */}
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            {isLoading ? (
              <ConversationSkeleton />
            ) : (
              <div className="space-y-1">
                {conversations.map((conv) => (
                  <motion.div
                    key={conv.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all ${
                      currentConversationId === conv.id
                        ? "bg-white/10 text-foreground"
                        : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                    }`}
                    onClick={() => onSelectConversation(conv.id)}
                  >
                    <MessageSquare size={16} className="flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{conv.title}</p>
                      <p className="text-xs text-muted-foreground/50">
                        {formatDistanceToNow(new Date(conv.updated_at), { addSuffix: true })}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteConversation(conv.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-white/10 text-muted-foreground hover:text-destructive transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </motion.div>
                ))}

                {conversations.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground/40">
                    <MessageSquare size={24} className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No conversations yet</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* User section */}
          <div className="px-4 py-4 pb-6 border-t border-white/5 mb-safe">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-foreground">
                  <User size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{user.email}</p>
                </div>
                <button
                  onClick={onLogout}
                  className="p-2 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
                  title="Sign out"
                >
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <button
                onClick={onLogin}
                className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-white/10 hover:bg-white/15 text-foreground border border-white/10 transition-all hover:scale-[1.02]"
              >
                <User size={18} />
                <span className="font-medium">Sign in to save chats</span>
              </button>
            )}
          </div>
        </GlassCard>
      </motion.aside>
    </>
  );
};
