import { motion } from "framer-motion";

export const MessageSkeleton = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex gap-3 animate-pulse"
    >
      <div className="w-8 h-8 rounded-full bg-white/10 flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-white/10 rounded w-3/4" />
        <div className="h-4 bg-white/10 rounded w-1/2" />
        <div className="h-4 bg-white/10 rounded w-2/3" />
      </div>
    </motion.div>
  );
};

export const ConversationSkeleton = () => {
  return (
    <div className="space-y-2 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-3 px-3 py-2.5">
          <div className="w-4 h-4 rounded bg-white/10" />
          <div className="flex-1 space-y-1">
            <div className="h-3 bg-white/10 rounded w-3/4" />
            <div className="h-2 bg-white/10 rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
};
