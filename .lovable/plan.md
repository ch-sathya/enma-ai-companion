# Make Enma a Personal Assistant

Right now Enma is a polished local chat app with provider keys. To become a real **personal assistant**, it needs to *know you*, *remember things*, and *help you act* — not just answer prompts. Everything stays browser-local (no backend), so it remains private and standalone.

## What changes for the user  
  - Easy to use and portable app can be used in mobile and laptop as well.  
  - Has good rendering and niche 3D animations and scrolls and all are functional.

1. **First-run "Get to know you" flow** — name, role, timezone, interests, goals, communication style, working hours.
2. **Long-term memory** — Enma remembers facts across all chats ("I'm vegetarian", "my dog's name is Mochi", "I prefer terse answers"). Auto-extracted from conversations + manually editable.
3. **Tasks & reminders panel** — add/check off todos, set due dates; Enma can read & update them via natural language.
4. **Notes / journal** — quick-capture notes per topic; searchable.
5. **Daily briefing** — on opening the app: greeting, today's tasks, overdue items, a suggestion.
6. **Assistant-style system prompt** — every request is augmented with "About the user", current date/time, active tasks, and recent memories — so any LLM behaves like *your* assistant.
7. **Quick actions in chat** — slash commands: `/remind`, `/task`, `/note`, `/remember`, `/forget`, `/today`.
8. **New "Assistant" persona** as the default, replacing generic "General".

## New left-sidebar layout

```text
┌─ Enma ──────────────────┐
│ + New chat              │
│ ─ Today's briefing      │
│ ─ Tasks            (3)  │
│ ─ Notes                 │
│ ─ Memory (About me)     │
│ ─ Conversations         │
│   • Trip planning       │
│   • Recipe ideas        │
└─────────────────────────┘
```

## Technical design (all local, no backend)

### Storage (localStorage, namespaced)

- `enma_profile` — name, timezone, role, bio, working_hours, comm_style, interests[]
- `enma_memories` — `[{id, text, tags[], source: 'manual'|'auto', createdAt, pinned}]`
- `enma_tasks` — `[{id, title, notes, dueAt?, done, createdAt, completedAt?}]`
- `enma_notes` — `[{id, title, body, tags[], updatedAt}]`
- `enma_reminders` — `[{id, taskId?, fireAt, fired}]`

### New files

- `src/lib/assistant/profile.ts` — Profile type + load/save.
- `src/lib/assistant/memory.ts` — Memory CRUD, search (substring + tag), pin/unpin.
- `src/lib/assistant/tasks.ts` — Task CRUD, overdue/today selectors.
- `src/lib/assistant/notes.ts` — Note CRUD + search.
- `src/lib/assistant/reminders.ts` — Polls every 30 s; fires browser Notification (with permission) and toast.
- `src/lib/assistant/contextBuilder.ts` — Builds the personalized system prompt block (see below).
- `src/lib/assistant/memoryExtractor.ts` — After each assistant turn, runs a lightweight LLM call (same active provider, low max_tokens) asking: *"Extract 0–3 durable personal facts from this exchange as a JSON array, or []"* and stores them. Falls back to no-op in demo mode.
- `src/lib/assistant/slashCommands.ts` — Parses `/task buy milk tomorrow`, `/remember I'm gluten-free`, etc., before sending to LLM.
- `src/hooks/useProfile.ts`, `useMemories.ts`, `useTasks.ts`, `useNotes.ts`, `useReminders.ts`.
- `src/components/assistant/MemoryPanel.tsx` — list, add, edit, delete, pin memories.
- `src/components/assistant/TasksPanel.tsx` — checklist UI with due dates (date-fns formatting).
- `src/components/assistant/NotesPanel.tsx` — list + editor (textarea, no rich-text dep).
- `src/components/assistant/DailyBriefing.tsx` — shown on empty chat: greeting + today's tasks + overdue + 1 suggested prompt.
- `src/components/assistant/OnboardingWizard.tsx` — 3-step modal on first run; writes profile.

### Edited files

- `src/data/personas.ts` — add `assistant` persona (default), with prompt scaffold "You are Enma, {{name}}'s personal assistant…".
- `src/hooks/useLocalChat.ts` — before calling provider, run slash-command interceptor; build final system prompt via `contextBuilder` (persona + profile + active memories + today's tasks + current datetime); after each successful assistant turn, call `memoryExtractor` async (non-blocking).
- `src/pages/Chat.tsx` — show `DailyBriefing` when no messages and there are tasks/profile; render `OnboardingWizard` on first run; surface task/memory counts.
- `src/components/ConversationSidebar.tsx` — add Briefing / Tasks / Notes / Memory entries above conversation list, each opening its panel.
- `src/components/SettingsPopup.tsx` — add tabs: Profile, Voice, Memory (export/import/clear), About.

### The personalized system prompt (contextBuilder output)

```text
You are Enma, {{name}}'s personal assistant.
Today is {{weekday, date, time, timezone}}.

About {{name}}:
- Role: {{role}}
- Working hours: {{hours}}
- Communication style: {{style}}
- Interests: {{interests}}

Things to remember:
- {{memory 1}}
- {{memory 2}}
…

Current open tasks (top 5 by due date):
- [due today] Buy milk
- [overdue] Send report
…

Behavior:
- Address {{name}} by name, warmly but concise.
- Proactively suggest next steps when relevant.
- When the user states a durable fact ("I'm vegetarian", "my birthday is …"),
  acknowledge and it will be remembered automatically.
- When asked to remind / track / note something, confirm and use the
  appropriate slash-command-style summary at the end:
  <!--enma:task title="…" due="ISO"-->
  <!--enma:note title="…" body="…"-->
  <!--enma:remember "…"-->
```

The chat layer scans assistant output for those `<!--enma:…-->` directives and applies them to local stores, then strips them from the rendered message. This gives the assistant **agency without needing real tool-calling APIs** — works with any LLM (OpenAI, Anthropic, Gemini, Groq, OpenRouter, Ollama).

### Reminders

- On app load, request `Notification.permission` once (non-blocking, only after user enables reminders in settings).
- A single setInterval (30 s) in a top-level provider checks `enma_reminders` for due items, fires `new Notification(...)` and a toast, marks `fired=true`.

### Demo mode (no API key)

- Slash commands and manual panels work fully.
- Memory auto-extraction is skipped; mock responses are augmented to acknowledge tasks/notes the user just created so the UX feels alive.

### Privacy & control

- Settings → Memory tab: **Export** all data as JSON, **Import**, **Clear all**, toggle "Auto-extract memories from chats".
- Nothing is sent anywhere except the active LLM provider (with the user's own key).

## Out of scope (can be follow-ups)

- Calendar / email integrations (require OAuth + backend).
- Cross-device sync.
- Real function-calling / tool-use APIs (current directive-comment approach is provider-agnostic; native tool-calling can replace it later per provider).
- Rich-text note editor.

## Acceptance checklist

- First-run wizard captures name + basics; persists.
- Saying "remember I'm vegetarian" results in a stored memory and future replies respect it.
- "Remind me to call mom at 6pm" creates a task + reminder; notification fires.
- Tasks panel lists open items, checkbox completes them, completion reflected in next chat context.
- Daily briefing shows on empty chat with greeting + tasks.
- Works fully in demo mode (no key) for tasks/notes/memory; LLM features activate when a key is set.
- Export / import / clear memory all function.