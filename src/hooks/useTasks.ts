import { useCallback, useEffect, useState } from "react";
import {
  Task,
  loadTasks,
  addTask as add,
  toggleTask as toggle,
  deleteTask as del,
  updateTask as upd,
} from "@/lib/assistant/tasks";

const EVT = "enma:tasks-change";

export const useTasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);

  const refresh = useCallback(() => setTasks(loadTasks()), []);

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
    tasks,
    addTask: (title: string, dueAt?: string, notes?: string) => {
      const t = add(title, dueAt, notes);
      fire();
      return t;
    },
    toggleTask: (id: string) => {
      toggle(id);
      fire();
    },
    deleteTask: (id: string) => {
      del(id);
      fire();
    },
    updateTask: (id: string, patch: Partial<Task>) => {
      upd(id, patch);
      fire();
    },
  };
};
