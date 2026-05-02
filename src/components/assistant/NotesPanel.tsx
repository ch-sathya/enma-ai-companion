import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Trash2, NotebookPen } from "lucide-react";
import { useState } from "react";
import { GlassCard } from "@/components/GlassCard";
import { useNotes } from "@/hooks/useNotes";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const NotesPanel = ({ isOpen, onClose }: Props) => {
  const { notes, addNote, updateNote, deleteNote } = useNotes();
  const [activeId, setActiveId] = useState<string | null>(null);

  const active = notes.find((n) => n.id === activeId) ?? notes[0];

  const create = () => {
    const n = addNote("Untitled");
    setActiveId(n.id);
  };

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
            className="fixed left-4 right-4 top-[6%] z-50 mx-auto max-w-3xl"
          >
            <GlassCard variant="clean" className="flex flex-col max-h-[calc(100dvh-4rem)] overflow-hidden border border-white/10 rounded-2xl shadow-2xl">
              <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-white/5">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-white/5"><NotebookPen size={16} /></div>
                  <h2 className="font-medium text-foreground">Notes</h2>
                </div>
                <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-foreground"><X size={18} /></button>
              </div>

              <div className="flex-1 min-h-0 grid grid-cols-1 sm:grid-cols-[200px_1fr]">
                <div className="border-r border-white/5 flex flex-col min-h-0">
                  <button onClick={create} className="m-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs flex items-center justify-center gap-1.5 border border-white/10">
                    <Plus size={12} /> New note
                  </button>
                  <div className="flex-1 min-h-0 overflow-y-auto px-2 pb-2 space-y-1">
                    {notes.map((n) => (
                      <button
                        key={n.id}
                        onClick={() => setActiveId(n.id)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm truncate ${
                          (active?.id === n.id) ? "bg-white/10 text-foreground" : "text-muted-foreground hover:bg-white/5"
                        }`}
                      >
                        {n.title || "Untitled"}
                      </button>
                    ))}
                    {notes.length === 0 && <p className="text-xs text-muted-foreground/60 text-center py-6">No notes yet</p>}
                  </div>
                </div>

                <div className="flex flex-col min-h-0 p-3">
                  {active ? (
                    <>
                      <div className="flex items-center gap-2 mb-2">
                        <input
                          value={active.title}
                          onChange={(e) => updateNote(active.id, { title: e.target.value })}
                          className="flex-1 bg-transparent border-none text-base font-medium focus:outline-none text-foreground"
                          placeholder="Title"
                        />
                        <button onClick={() => { deleteNote(active.id); setActiveId(null); }} className="p-1.5 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-destructive">
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <textarea
                        value={active.body}
                        onChange={(e) => updateNote(active.id, { body: e.target.value })}
                        placeholder="Start writing…"
                        className="flex-1 min-h-[200px] bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:border-white/20"
                      />
                    </>
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-muted-foreground/60 text-sm">
                      Select or create a note
                    </div>
                  )}
                </div>
              </div>
            </GlassCard>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
