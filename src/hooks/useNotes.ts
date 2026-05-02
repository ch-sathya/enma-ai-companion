import { useCallback, useEffect, useState } from "react";
import {
  Note,
  loadNotes,
  addNote as add,
  updateNote as upd,
  deleteNote as del,
} from "@/lib/assistant/notes";

const EVT = "enma:notes-change";

export const useNotes = () => {
  const [notes, setNotes] = useState<Note[]>([]);

  const refresh = useCallback(() => setNotes(loadNotes()), []);

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
    notes,
    addNote: (title: string, body?: string) => {
      const n = add(title, body);
      fire();
      return n;
    },
    updateNote: (id: string, patch: Partial<Note>) => {
      upd(id, patch);
      fire();
    },
    deleteNote: (id: string) => {
      del(id);
      fire();
    },
  };
};
