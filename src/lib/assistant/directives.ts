// Parses <!--enma:...--> directives from assistant output, executes them
// against local stores, and returns the cleaned message.
import { addMemory } from "./memory";
import { addTask } from "./tasks";
import { addNote } from "./notes";
import { addReminder } from "./reminders";

export interface DirectiveResult {
  cleaned: string;
  applied: { kind: "remember" | "task" | "note"; label: string }[];
}

const DIRECTIVE_RE = /<!--\s*enma:(\w+)\s+([\s\S]*?)-->/g;

const parseAttrs = (raw: string): Record<string, string> => {
  const attrs: Record<string, string> = {};
  // matches key="value" or key='value' or bare "value"
  const re = /(\w+)\s*=\s*"([^"]*)"|(\w+)\s*=\s*'([^']*)'/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(raw))) {
    if (m[1]) attrs[m[1]] = m[2];
    else if (m[3]) attrs[m[3]] = m[4];
  }
  // also allow remember "..." with no key
  const bare = raw.match(/^\s*"([^"]+)"\s*$/);
  if (bare) attrs._ = bare[1];
  return attrs;
};

export const processDirectives = (text: string): DirectiveResult => {
  const applied: DirectiveResult["applied"] = [];
  const cleaned = text.replace(DIRECTIVE_RE, (_full, kind, body) => {
    try {
      const attrs = parseAttrs(body);
      if (kind === "remember") {
        const t = attrs.text || attrs._ || body.trim().replace(/^"|"$/g, "");
        if (t) {
          addMemory(t, "chat");
          applied.push({ kind: "remember", label: t });
        }
      } else if (kind === "task") {
        const title = attrs.title || attrs._;
        if (title) {
          let dueIso: string | undefined;
          if (attrs.due) {
            const d = new Date(attrs.due);
            if (!isNaN(d.getTime())) dueIso = d.toISOString();
          }
          const task = addTask(title, dueIso, attrs.notes);
          if (dueIso) addReminder(dueIso, task.id);
          applied.push({ kind: "task", label: title });
        }
      } else if (kind === "note") {
        const title = attrs.title || "Quick note";
        const noteBody = attrs.body || attrs._ || "";
        addNote(title, noteBody);
        applied.push({ kind: "note", label: title });
      }
    } catch (e) {
      console.warn("Directive failed", e);
    }
    return "";
  });
  return { cleaned: cleaned.trimEnd(), applied };
};
