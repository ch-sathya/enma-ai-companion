export interface Note {
  id: string;
  title: string;
  body: string;
  tags: string[];
  updatedAt: string;
}

const KEY = "enma_notes";

export const loadNotes = (): Note[] => {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const saveNotes = (n: Note[]) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(n));
  } catch {
    /* ignore */
  }
};

export const addNote = (title: string, body = "", tags: string[] = []): Note => {
  const n: Note = {
    id: crypto.randomUUID(),
    title: title.trim() || "Untitled",
    body,
    tags,
    updatedAt: new Date().toISOString(),
  };
  saveNotes([n, ...loadNotes()]);
  return n;
};

export const updateNote = (id: string, patch: Partial<Note>) => {
  saveNotes(
    loadNotes().map((n) =>
      n.id === id ? { ...n, ...patch, updatedAt: new Date().toISOString() } : n
    )
  );
};

export const deleteNote = (id: string) => {
  saveNotes(loadNotes().filter((n) => n.id !== id));
};
