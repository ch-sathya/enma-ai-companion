import { motion } from "framer-motion";
import { ListChecks, AlertTriangle, Calendar, Sparkles } from "lucide-react";
import { useTasks } from "@/hooks/useTasks";
import { useProfile } from "@/hooks/useProfile";
import { isOverdue, isDueToday } from "@/lib/assistant/tasks";

interface Props {
  greeting: string;
  onOpenTasks: () => void;
  onSuggest: (prompt: string) => void;
}

export const DailyBriefing = ({ greeting, onOpenTasks, onSuggest }: Props) => {
  const { tasks } = useTasks();
  const { profile } = useProfile();

  const open = tasks.filter((t) => !t.done);
  const overdue = open.filter(isOverdue);
  const today = open.filter((t) => !isOverdue(t) && isDueToday(t));

  if (!profile.onboarded && open.length === 0) return null;

  const suggestion =
    overdue.length > 0
      ? "I have overdue tasks. Help me triage them."
      : today.length > 0
      ? "Plan my day around today's tasks."
      : profile.role
      ? `What should I focus on today as a ${profile.role}?`
      : "Help me plan my day.";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15, duration: 0.35 }}
      className="w-full max-w-md mx-auto mt-6 rounded-2xl bg-white/5 border border-white/10 p-4 text-left"
    >
      <p className="text-sm text-foreground font-medium">{greeting}</p>

      {(overdue.length > 0 || today.length > 0) ? (
        <button onClick={onOpenTasks} className="w-full mt-3 space-y-1.5 text-left group">
          {overdue.length > 0 && (
            <div className="flex items-center gap-2 text-xs text-amber-300">
              <AlertTriangle size={12} />
              <span>{overdue.length} overdue task{overdue.length > 1 ? "s" : ""}</span>
            </div>
          )}
          {today.length > 0 && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar size={12} />
              <span>{today.length} due today</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-xs text-muted-foreground/70 group-hover:text-foreground transition-colors">
            <ListChecks size={12} />
            <span>Open tasks panel →</span>
          </div>
        </button>
      ) : (
        <p className="text-xs text-muted-foreground mt-2">No tasks for today. Clear runway ahead.</p>
      )}

      <button
        onClick={() => onSuggest(suggestion)}
        className="mt-4 w-full px-3 py-2 rounded-xl bg-foreground/90 text-background text-xs font-medium flex items-center justify-center gap-1.5 hover:opacity-90"
      >
        <Sparkles size={12} /> {suggestion}
      </button>
    </motion.div>
  );
};
