import { useEffect, useRef } from "react";
import { dueNow, markFired, requestNotificationPermission } from "@/lib/assistant/reminders";
import { loadTasks } from "@/lib/assistant/tasks";
import { toast } from "sonner";

// Polls every 30s for reminders that became due, fires desktop notification + toast.
export const useReminderPoller = () => {
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    // best-effort permission ask (will be ignored if user already decided)
    void requestNotificationPermission();

    const tick = () => {
      const due = dueNow();
      if (due.length === 0) return;
      const tasks = loadTasks();
      for (const r of due) {
        const taskTitle =
          r.message ||
          (r.taskId && tasks.find((t) => t.id === r.taskId)?.title) ||
          "Reminder";
        try {
          if (typeof Notification !== "undefined" && Notification.permission === "granted") {
            new Notification("Enma reminder", { body: taskTitle });
          }
        } catch {
          /* ignore */
        }
        toast(`⏰ ${taskTitle}`, { description: "Reminder from Enma" });
        markFired(r.id);
      }
      window.dispatchEvent(new Event("enma:tasks-change"));
    };

    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);
};
