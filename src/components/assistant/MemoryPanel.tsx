import { motion, AnimatePresence } from "framer-motion";
import { X, Pin, PinOff, Trash2, Plus, Brain, Download, Upload, AlertTriangle } from "lucide-react";
import { useRef, useState } from "react";
import { GlassCard } from "@/components/GlassCard";
import { useMemories } from "@/hooks/useMemories";
import { Memory } from "@/lib/assistant/memory";
import { toast } from "sonner";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const MemoryPanel = ({ isOpen, onClose }: Props) => {
  const { memories, addMemory, deleteMemory, togglePin, clearAll, importMemories } = useMemories();
  const [draft, setDraft] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const submit = () => {
    const t = draft.trim();
    if (!t) return;
    addMemory(t);
    setDraft("");
    toast.success("Memory saved");
  };

  const exportData = () => {
    const blob = new Blob([JSON.stringify(memories, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `enma-memories-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importData = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string) as Memory[];
        if (!Array.isArray(data)) throw new Error("Invalid file");
        importMemories(data);
        toast.success(`Imported ${data.length} memories`);
      } catch {
        toast.error("Import failed — file is not valid memory JSON");
      }
    };
    reader.readAsText(file);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            className="fixed left-4 right-4 top-[6%] z-50 mx-auto max-w-lg"
          >
            <GlassCard
              variant="clean"
              className="flex flex-col max-h-[calc(100dvh-4rem)] overflow-hidden border border-white/10 rounded-2xl shadow-2xl"
            >
              <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-white/5">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-white/5"><Brain size={16} /></div>
                  <div>
                    <h2 className="font-medium text-foreground">Memory</h2>
                    <p className="text-xs text-muted-foreground">{memories.length} stored facts</p>
                  </div>
                </div>
                <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-foreground"><X size={18} /></button>
              </div>

              <div className="p-4 border-b border-white/5 flex gap-2">
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && submit()}
                  placeholder="Add a fact about yourself…"
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-white/20"
                />
                <button onClick={submit} className="px-3 py-2 rounded-xl bg-foreground text-background text-sm font-medium flex items-center gap-1 hover:opacity-90">
                  <Plus size={14} /> Add
                </button>
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-1.5">
                {memories.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground/60 text-sm">
                    No memories yet.<br />Tell Enma things to remember about you.
                  </div>
                ) : (
                  memories.map((m) => (
                    <div
                      key={m.id}
                      className={`group flex items-start gap-2 p-3 rounded-xl border transition-colors ${
                        m.pinned ? "bg-amber-500/10 border-amber-500/20" : "bg-white/5 border-white/5 hover:border-white/10"
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground break-words">{m.text}</p>
                        <p className="text-[10px] text-muted-foreground/60 mt-1 uppercase tracking-wide">
                          {m.source} · {new Date(m.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <button
                        onClick={() => togglePin(m.id)}
                        className="p-1.5 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                        title={m.pinned ? "Unpin" : "Pin"}
                      >
                        {m.pinned ? <PinOff size={14} /> : <Pin size={14} />}
                      </button>
                      <button
                        onClick={() => deleteMemory(m.id)}
                        className="p-1.5 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))
                )}
              </div>

              <div className="flex-shrink-0 p-3 border-t border-white/5 flex items-center gap-2">
                <button onClick={exportData} className="flex-1 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs flex items-center justify-center gap-1.5 border border-white/10">
                  <Download size={12} /> Export
                </button>
                <button onClick={() => fileRef.current?.click()} className="flex-1 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs flex items-center justify-center gap-1.5 border border-white/10">
                  <Upload size={12} /> Import
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="application/json"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) importData(f);
                    e.target.value = "";
                  }}
                />
                <button
                  onClick={() => {
                    if (confirm("Clear all memories? This cannot be undone.")) {
                      clearAll();
                      toast.success("Memory cleared");
                    }
                  }}
                  className="px-3 py-2 rounded-xl bg-destructive/10 hover:bg-destructive/20 text-destructive text-xs flex items-center justify-center gap-1.5 border border-destructive/20"
                >
                  <AlertTriangle size={12} /> Clear
                </button>
              </div>
            </GlassCard>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
