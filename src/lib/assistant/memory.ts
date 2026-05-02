export interface Memory {
  id: string;
  text: string;
  tags: string[];
  source: "manual" | "auto" | "chat";
  pinned: boolean;
  createdAt: string;
}

const KEY = "enma_memories";

export const loadMemories = (): Memory[] => {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const saveMemories = (m: Memory[]) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(m));
  } catch {
    /* ignore */
  }
};

export const addMemory = (
  text: string,
  source: Memory["source"] = "manual",
  tags: string[] = []
): Memory => {
  const all = loadMemories();
  // de-duplicate (case-insensitive)
  const existing = all.find(
    (m) => m.text.trim().toLowerCase() === text.trim().toLowerCase()
  );
  if (existing) return existing;
  const memo: Memory = {
    id: crypto.randomUUID(),
    text: text.trim(),
    tags,
    source,
    pinned: false,
    createdAt: new Date().toISOString(),
  };
  saveMemories([memo, ...all]);
  return memo;
};

export const deleteMemory = (id: string) => {
  saveMemories(loadMemories().filter((m) => m.id !== id));
};

export const togglePin = (id: string) => {
  saveMemories(
    loadMemories().map((m) => (m.id === id ? { ...m, pinned: !m.pinned } : m))
  );
};

export const updateMemory = (id: string, text: string) => {
  saveMemories(
    loadMemories().map((m) => (m.id === id ? { ...m, text } : m))
  );
};

export const clearMemories = () => saveMemories([]);
