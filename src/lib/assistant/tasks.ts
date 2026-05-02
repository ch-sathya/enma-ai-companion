export interface Task {
  id: string;
  title: string;
  notes?: string;
  dueAt?: string; // ISO
  done: boolean;
  createdAt: string;
  completedAt?: string;
}

const KEY = "enma_tasks";

export const loadTasks = (): Task[] => {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const saveTasks = (t: Task[]) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(t));
  } catch {
    /* ignore */
  }
};

export const addTask = (title: string, dueAt?: string, notes?: string): Task => {
  const t: Task = {
    id: crypto.randomUUID(),
    title: title.trim(),
    notes,
    dueAt,
    done: false,
    createdAt: new Date().toISOString(),
  };
  saveTasks([t, ...loadTasks()]);
  return t;
};

export const toggleTask = (id: string) => {
  saveTasks(
    loadTasks().map((t) =>
      t.id === id
        ? {
            ...t,
            done: !t.done,
            completedAt: !t.done ? new Date().toISOString() : undefined,
          }
        : t
    )
  );
};

export const deleteTask = (id: string) => {
  saveTasks(loadTasks().filter((t) => t.id !== id));
};

export const updateTask = (id: string, patch: Partial<Task>) => {
  saveTasks(loadTasks().map((t) => (t.id === id ? { ...t, ...patch } : t)));
};

export const isOverdue = (t: Task): boolean =>
  !t.done && !!t.dueAt && new Date(t.dueAt).getTime() < Date.now();

export const isDueToday = (t: Task): boolean => {
  if (!t.dueAt) return false;
  const d = new Date(t.dueAt);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
};
