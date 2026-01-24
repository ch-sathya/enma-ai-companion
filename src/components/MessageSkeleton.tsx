import { motion } from "framer-motion";

export const MessageSkeleton = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex gap-3"
    >
      <div className="w-8 h-8 rounded-full shimmer flex-shrink-0" />
      <div className="flex-1 space-y-3">
        <div className="h-4 shimmer rounded-lg w-3/4" />
        <div className="h-4 shimmer rounded-lg w-1/2" />
        <div className="h-4 shimmer rounded-lg w-2/3" />
      </div>
    </motion.div>
  );
};

export const ConversationSkeleton = () => {
  return (
    <div className="space-y-2">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-3 px-3 py-2.5">
          <div className="w-4 h-4 rounded shimmer" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 shimmer rounded w-3/4" />
            <div className="h-2 shimmer rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
};
