

# Making Enma Fully Independent & Locally Runnable

## Current External Dependencies

After analyzing the codebase, here are all the external services currently required:

| Dependency | Used For | Current Implementation |
|------------|----------|------------------------|
| **Lovable AI Gateway** | Chat completions (GPT-5, Gemini) | Edge function calls `ai.gateway.lovable.dev` |
| **ElevenLabs API** | Voice transcription (speech-to-text) | `useElevenLabsVoice` hook + edge function |
| **Lovable Cloud (Database)** | Conversations, messages, profiles storage | All database operations |
| **Lovable Cloud (Auth)** | User authentication | Login/signup via database auth |
| **Lovable Cloud (Storage)** | File attachments | Chat attachment uploads |

## Proposed Solution: Demo Mode Architecture

Make the app **work fully offline** with a robust "demo mode" that uses:
- **Browser's Web Speech API** for voice recognition (no ElevenLabs)
- **Local Storage** for all data persistence (no database)
- **Mock AI responses** for chat (already partially exists)
- **Guest-only mode** (no authentication required)
- **IndexedDB or localStorage** for file attachments

The app will automatically detect when backend is unavailable and seamlessly switch to demo mode.

---

## Implementation Plan

### Phase 1: Environment Detection & Configuration

**Create a centralized config system:**
- Add `src/config/appConfig.ts` with feature flags
- Detect if backend is available at startup
- Allow manual override via localStorage setting

### Phase 2: Local Storage Data Layer

**Replace database calls with localStorage alternatives:**

1. **Conversations Storage** (`src/hooks/useLocalConversations.ts`)
   - Store conversations in localStorage/IndexedDB
   - Same interface as `useConversations`

2. **Messages Storage** (`src/hooks/useLocalMessages.ts`)  
   - Store messages alongside conversations
   - Support for attachments as base64

3. **User Preferences** (already partially done)
   - Guest preferences already use localStorage
   - Make this the default when offline

### Phase 3: Local Voice Recognition

**Switch to Browser's Web Speech API:**

1. **Update `Chat.tsx`** to use `useVoice` hook instead of `useElevenLabsVoice`
2. **The `useVoice` hook** already exists and uses the browser's native Web Speech API
3. No external API calls required - works completely offline

### Phase 4: Mock/Offline Chat System

**Expand the existing mock chat utility:**

1. **Enhanced mock responses** with more variety
2. **Configurable AI personality** based on selected persona
3. **Simulated streaming** for realistic UX
4. **Create `useLocalChat.ts`** hook that mirrors `useChat` interface

### Phase 5: Unified Hook Wrappers

**Create smart hooks that auto-switch between modes:**

```text
+------------------+     +-------------------+
|   useChat()      | --> | useChatWrapper()  |
+------------------+     +-------------------+
                               |
              +----------------+----------------+
              |                                 |
    +---------v---------+           +-----------v-----------+
    | useRemoteChat()   |           | useLocalChat()        |
    | (Lovable Cloud)   |           | (Demo Mode)           |
    +-------------------+           +-----------------------+
```

Similar pattern for:
- `useConversationsWrapper` → remote or local
- `useVoiceWrapper` → ElevenLabs or Web Speech API

### Phase 6: Attachment Handling

**Local file storage for demo mode:**

1. Convert files to base64 for localStorage
2. Store with message data
3. Limit file sizes for localStorage constraints
4. Use IndexedDB for larger files if needed

### Phase 7: UI Indicators

**Show current mode to user:**

1. Small indicator badge showing "Demo Mode" or "Cloud Connected"
2. Toast notification when switching modes
3. Settings option to force demo mode

---

## Technical Details

### Files to Create

| File | Purpose |
|------|---------|
| `src/config/appConfig.ts` | Central configuration & mode detection |
| `src/hooks/useLocalConversations.ts` | localStorage-based conversations |
| `src/hooks/useLocalChat.ts` | Mock AI chat with streaming |
| `src/hooks/useChatWrapper.ts` | Auto-switches between remote/local |
| `src/hooks/useConversationsWrapper.ts` | Auto-switches between remote/local |
| `src/hooks/useVoiceWrapper.ts` | Auto-switches ElevenLabs/Web Speech |
| `src/components/ModeIndicator.tsx` | Shows current mode in UI |

### Files to Modify

| File | Changes |
|------|---------|
| `src/pages/Chat.tsx` | Use wrapper hooks, add mode indicator |
| `src/utils/mockChat.ts` | Expand with persona-aware responses |
| `src/components/ConversationSidebar.tsx` | Hide auth buttons in demo mode |

### Key Implementation Details

**Mode Detection Logic:**
```text
1. Check if VITE_SUPABASE_URL is configured
2. Attempt a lightweight health check to backend
3. If fails → activate demo mode
4. Store mode in React context for app-wide access
```

**Local Storage Schema:**
```text
enma_conversations: [
  {
    id: "uuid",
    title: "string",
    model: "string",
    messages: [...],
    created_at: "ISO date",
    updated_at: "ISO date"
  }
]

enma_preferences: {
  display_name: "string",
  voice_enabled: boolean,
  preferred_voice: "string"
}
```

---

## Benefits

- **Works completely offline** - no internet required
- **No API keys needed** for demo/local use
- **Seamless fallback** - if cloud is down, app still works
- **Same UI/UX** - users don't notice the difference
- **Easy local development** - no backend setup required
- **Mobile-ready** - works in Capacitor apps without network

## Limitations (Demo Mode)

- AI responses are pre-written mocks (no real AI)
- Data is device-local only (no sync across devices)
- Voice recognition may be less accurate than ElevenLabs
- File attachments limited by localStorage size (~5-10MB)

