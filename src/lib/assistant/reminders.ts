export interface Reminder {
  id: string;
  taskId?: string;
  fireAt: string; // ISO
  message?: string;
  fired: boolean;
}

const KEY = "enma_reminders";

export const loadReminders = (): Reminder[] => {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const saveReminders = (r: Reminder[]) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(r));
  } catch {
    /* ignore */
  }
};

export const addReminder = (fireAt: string, taskId?: string, message?: string): Reminder => {
  const r: Reminder = {
    id: crypto.randomUUID(),
    taskId,
    fireAt,
    message,
    fired: false,
  };
  saveReminders([r, ...loadReminders()]);
  return r;
};

export const markFired = (id: string) => {
  saveReminders(
    loadReminders().map((r) => (r.id === id ? { ...r, fired: true } : r))
  );
};

export const deleteReminder = (id: string) => {
  saveReminders(loadReminders().filter((r) => r.id !== id));
};

export const dueNow = (now = Date.now()): Reminder[] =>
  loadReminders().filter((r) => !r.fired && new Date(r.fireAt).getTime() <= now);

export const requestNotificationPermission = async (): Promise<boolean> => {
  if (typeof window === "undefined" || !("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  try {
    const res = await Notification.requestPermission();
    return res === "granted";
  } catch {
    return false;
  }
};
