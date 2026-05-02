import { useCallback, useEffect, useState } from "react";
import {
  Memory,
  loadMemories,
  addMemory as add,
  deleteMemory as del,
  togglePin as pin,
  updateMemory as upd,
  clearMemories as clear,
  saveMemories,
} from "@/lib/assistant/memory";

const EVT = "enma:memories-change";

export const useMemories = () => {
  const [memories, setMemories] = useState<Memory[]>([]);

  const refresh = useCallback(() => setMemories(loadMemories()), []);

  useEffect(() => {
    refresh();
    window.addEventListener(EVT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(EVT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [refresh]);

  const fire = () => window.dispatchEvent(new Event(EVT));

  return {
    memories,
    addMemory: (text: string, tags?: string[]) => {
      add(text, "manual", tags);
      fire();
    },
    deleteMemory: (id: string) => {
      del(id);
      fire();
    },
    togglePin: (id: string) => {
      pin(id);
      fire();
    },
    updateMemory: (id: string, text: string) => {
      upd(id, text);
      fire();
    },
    clearAll: () => {
      clear();
      fire();
    },
    importMemories: (m: Memory[]) => {
      saveMemories(m);
      fire();
    },
  };
};
