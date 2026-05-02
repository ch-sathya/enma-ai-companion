import { AssistantProfile } from "./profile";
import { Memory } from "./memory";
import { Task, isOverdue, isDueToday } from "./tasks";

interface BuildArgs {
  basePersonaPrompt: string;
  profile: AssistantProfile;
  memories: Memory[];
  tasks: Task[];
}

const fmtDate = (iso?: string) => {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
};

export const buildSystemPrompt = ({
  basePersonaPrompt,
  profile,
  memories,
  tasks,
}: BuildArgs): string => {
  const now = new Date();
  const today = now.toLocaleString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const lines: string[] = [];

  // Persona / identity
  lines.push(basePersonaPrompt);
  lines.push("");
  lines.push(`Today is ${today} (${profile.timezone}).`);

  // About the user
  if (profile.onboarded) {
    lines.push("");
    lines.push(`About ${profile.name || "the user"}:`);
    if (profile.name) lines.push(`- Name: ${profile.name}`);
    if (profile.role) lines.push(`- Role: ${profile.role}`);
    if (profile.workingHours) lines.push(`- Working hours: ${profile.workingHours}`);
    lines.push(`- Preferred communication style: ${profile.commStyle}`);
    if (profile.interests.length)
      lines.push(`- Interests: ${profile.interests.join(", ")}`);
    if (profile.bio) lines.push(`- Bio: ${profile.bio}`);
  }

  // Pinned + recent memories
  const orderedMems = [
    ...memories.filter((m) => m.pinned),
    ...memories.filter((m) => !m.pinned),
  ].slice(0, 25);
  if (orderedMems.length) {
    lines.push("");
    lines.push("Things to remember about the user:");
    for (const m of orderedMems) lines.push(`- ${m.text}`);
  }

  // Open tasks
  const open = tasks.filter((t) => !t.done);
  const overdue = open.filter(isOverdue);
  const todayList = open.filter(isDueToday);
  const others = open
    .filter((t) => !overdue.includes(t) && !todayList.includes(t))
    .slice(0, 5);
  if (open.length) {
    lines.push("");
    lines.push("Current open tasks:");
    for (const t of overdue) lines.push(`- [OVERDUE ${fmtDate(t.dueAt)}] ${t.title}`);
    for (const t of todayList) lines.push(`- [TODAY ${fmtDate(t.dueAt)}] ${t.title}`);
    for (const t of others)
      lines.push(`- ${t.dueAt ? `[due ${fmtDate(t.dueAt)}] ` : ""}${t.title}`);
  }

  // Behavior
  lines.push("");
  lines.push("How to behave:");
  if (profile.name)
    lines.push(`- Address ${profile.name} by name, warmly but not excessively.`);
  if (profile.commStyle === "concise")
    lines.push("- Keep answers short and to the point. No filler.");
  else if (profile.commStyle === "detailed")
    lines.push("- Provide thorough, well-structured explanations.");
  else lines.push("- Strike a balance between brevity and depth.");
  lines.push("- Proactively suggest the next helpful step when relevant.");
  lines.push(
    "- When the user states a durable personal fact (preferences, goals, key people, dates), acknowledge and remember it."
  );
  lines.push("");
  lines.push(
    "Action directives — when the user asks you to remember something, add a task, set a reminder, or save a note, append the matching directive on its own line at the very end of your reply (it will be parsed and hidden from the user):"
  );
  lines.push(`  <!--enma:remember "fact about the user"-->`);
  lines.push(`  <!--enma:task title="task title" due="2025-05-03T18:00"-->`);
  lines.push(`  <!--enma:note title="note title" body="note body"-->`);
  lines.push(
    "Use ISO-8601 local time for `due`. Only emit a directive when the user clearly asked for it. Never invent facts to remember."
  );

  return lines.join("\n");
};
