import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Check, Trash2, ListChecks, Calendar } from "lucide-react";
import { useState } from "react";
import { GlassCard } from "@/components/GlassCard";
import { useTasks } from "@/hooks/useTasks";
import { isOverdue, isDueToday } from "@/lib/assistant/tasks";
import { addReminder } from "@/lib/assistant/reminders";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const TasksPanel = ({ isOpen, onClose }: Props) => {
  const { tasks, addTask, toggleTask, deleteTask } = useTasks();
  const [title, setTitle] = useState("");
  const [due, setDue] = useState("");

  const submit = () => {
    if (!title.trim()) return;
    const dueIso = due ? new Date(due).toISOString() : undefined;
    const t = addTask(title.trim(), dueIso);
    if (dueIso) addReminder(dueIso, t.id);
    setTitle("");
    setDue("");
  };

  const open = tasks.filter((t) => !t.done);
  const done = tasks.filter((t) => t.done).slice(0, 20);

  const overdue = open.filter(isOverdue);
  const today = open.filter((t) => !isOverdue(t) && isDueToday(t));
  const upcoming = open.filter((t) => !isOverdue(t) && !isDueToday(t));

  const Section = ({ label, items }: { label: string; items: typeof tasks }) =>
    items.length ? (
      <div>
        <p className="px-1 pb-1.5 text-[10px] uppercase tracking-wider text-muted-foreground/60">{label}</p>
        <div className="space-y-1 mb-3">
          {items.map((t) => {
            const overdueRow = !t.done && isOverdue(t);
            return (
              <div key={t.id} className="group flex items-center gap-2 p-2.5 rounded-xl bg-white/5 border border-white/5 hover:border-white/10">
                <button
                  onClick={() => toggleTask(t.id)}
                  className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                    t.done ? "bg-emerald-500/30 border-emerald-500/50 text-emerald-200" : "border-white/20 hover:border-white/40"
                  }`}
                >
                  {t.done && <Check size={12} />}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm truncate ${t.done ? "line-through text-muted-foreground" : "text-foreground"}`}>{t.title}</p>
                  {t.dueAt && (
                    <p className={`text-[11px] flex items-center gap-1 ${overdueRow ? "text-amber-300" : "text-muted-foreground/70"}`}>
                      <Calendar size={10} /> {new Date(t.dueAt).toLocaleString()}
                    </p>
                  )}
                </div>
                <button onClick={() => deleteTask(t.id)} className="p-1.5 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity">
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    ) : null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            className="fixed left-4 right-4 top-[6%] z-50 mx-auto max-w-lg"
          >
            <GlassCard variant="clean" className="flex flex-col max-h-[calc(100dvh-4rem)] overflow-hidden border border-white/10 rounded-2xl shadow-2xl">
              <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-white/5">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-white/5"><ListChecks size={16} /></div>
                  <div>
                    <h2 className="font-medium text-foreground">Tasks</h2>
                    <p className="text-xs text-muted-foreground">{open.length} open · {done.length} done</p>
                  </div>
                </div>
                <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-foreground"><X size={18} /></button>
              </div>

              <div className="p-4 border-b border-white/5 space-y-2">
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && submit()}
                  placeholder="What needs doing?"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-white/20"
                />
                <div className="flex gap-2">
                  <input
                    type="datetime-local"
                    value={due}
                    onChange={(e) => setDue(e.target.value)}
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-muted-foreground focus:outline-none focus:border-white/20"
                  />
                  <button onClick={submit} className="px-3 py-2 rounded-xl bg-foreground text-background text-sm font-medium flex items-center gap-1 hover:opacity-90">
                    <Plus size={14} /> Add
                  </button>
                </div>
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto p-3">
                <Section label="Overdue" items={overdue} />
                <Section label="Today" items={today} />
                <Section label="Upcoming" items={upcoming} />
                <Section label="Completed" items={done} />
                {tasks.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground/60 text-sm">
                    No tasks yet.<br />Add one above or say "remind me to…" in chat.
                  </div>
                )}
              </div>
            </GlassCard>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
