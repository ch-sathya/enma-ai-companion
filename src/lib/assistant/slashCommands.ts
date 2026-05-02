// Lightweight natural-language parsing for inline slash commands.
import { addMemory } from "./memory";
import { addTask } from "./tasks";
import { addNote } from "./notes";
import { addReminder } from "./reminders";

export interface SlashResult {
  handled: boolean;
  reply?: string; // synthetic assistant reply
  rewritten?: string; // text to send to LLM instead (when partial)
}

// Very small natural date parser: today, tomorrow, in N (min|hour|day),
// at HH(:MM)? (am|pm)?, on YYYY-MM-DD
const parseTimeHint = (raw: string): Date | undefined => {
  const s = raw.toLowerCase();
  const now = new Date();
  const out = new Date(now);

  const inMatch = s.match(/in\s+(\d+)\s*(min|mins|minute|minutes|hr|hrs|hour|hours|day|days)/);
  if (inMatch) {
    const n = parseInt(inMatch[1], 10);
    const unit = inMatch[2];
    if (unit.startsWith("min")) out.setMinutes(out.getMinutes() + n);
    else if (unit.startsWith("hr") || unit.startsWith("hour"))
      out.setHours(out.getHours() + n);
    else if (unit.startsWith("day")) out.setDate(out.getDate() + n);
    return out;
  }

  if (/\btomorrow\b/.test(s)) out.setDate(out.getDate() + 1);
  // default time later if "at" present, otherwise 9am
  let hour = 9;
  let minute = 0;
  const at = s.match(/at\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/);
  if (at) {
    hour = parseInt(at[1], 10);
    minute = at[2] ? parseInt(at[2], 10) : 0;
    const ap = at[3];
    if (ap === "pm" && hour < 12) hour += 12;
    if (ap === "am" && hour === 12) hour = 0;
    out.setHours(hour, minute, 0, 0);
    return out;
  }

  const iso = s.match(/on\s+(\d{4}-\d{2}-\d{2})/);
  if (iso) {
    const d = new Date(iso[1] + "T09:00");
    if (!isNaN(d.getTime())) return d;
  }

  if (/\btoday\b|\btomorrow\b/.test(s)) {
    out.setHours(hour, minute, 0, 0);
    return out;
  }
  return undefined;
};

export const handleSlash = (input: string): SlashResult => {
  const trimmed = input.trim();
  if (!trimmed.startsWith("/")) return { handled: false };

  const [cmd, ...rest] = trimmed.slice(1).split(/\s+/);
  const arg = rest.join(" ").trim();

  switch (cmd.toLowerCase()) {
    case "remember": {
      if (!arg) return { handled: true, reply: "Tell me what to remember. e.g. `/remember I'm vegetarian`" };
      addMemory(arg, "manual");
      return { handled: true, reply: `Got it — I'll remember that: *${arg}*` };
    }
    case "task":
    case "todo": {
      if (!arg) return { handled: true, reply: "What's the task? e.g. `/task buy milk tomorrow at 6pm`" };
      const due = parseTimeHint(arg);
      const title = arg
        .replace(/\bin\s+\d+\s*(min|mins|minute|minutes|hr|hrs|hour|hours|day|days)\b/gi, "")
        .replace(/\b(today|tomorrow)\b/gi, "")
        .replace(/\bat\s+\d{1,2}(:\d{2})?\s*(am|pm)?\b/gi, "")
        .replace(/\bon\s+\d{4}-\d{2}-\d{2}\b/gi, "")
        .trim();
      const task = addTask(title || arg, due?.toISOString());
      if (due) addReminder(due.toISOString(), task.id);
      return {
        handled: true,
        reply: `Task added: **${task.title}**${
          due ? ` — due ${due.toLocaleString()}` : ""
        }`,
      };
    }
    case "remind": {
      if (!arg) return { handled: true, reply: "e.g. `/remind call mom in 30 mins`" };
      const due = parseTimeHint(arg) || new Date(Date.now() + 60 * 60 * 1000);
      const title = arg
        .replace(/\bin\s+\d+\s*(min|mins|minute|minutes|hr|hrs|hour|hours|day|days)\b/gi, "")
        .replace(/\bat\s+\d{1,2}(:\d{2})?\s*(am|pm)?\b/gi, "")
        .trim() || arg;
      const task = addTask(title, due.toISOString());
      addReminder(due.toISOString(), task.id, title);
      return {
        handled: true,
        reply: `Reminder set for **${due.toLocaleString()}** — ${title}`,
      };
    }
    case "note": {
      if (!arg) return { handled: true, reply: "e.g. `/note Meeting ideas | discuss roadmap`" };
      const [title, ...bodyParts] = arg.split("|");
      addNote(title.trim(), bodyParts.join("|").trim());
      return { handled: true, reply: `Note saved: **${title.trim()}**` };
    }
    case "today": {
      return { handled: false, rewritten: "What's on my plate today? Summarise my open tasks and suggest priorities." };
    }
    case "help": {
      return {
        handled: true,
        reply:
          "**Slash commands**\n\n- `/remember <fact>` — store a long-term memory\n- `/task <title> [tomorrow] [at 6pm]` — add a task\n- `/remind <thing> in 30 mins` — quick reminder\n- `/note <title> | <body>` — save a note\n- `/today` — daily summary",
      };
    }
    default:
      return { handled: false };
  }
};
