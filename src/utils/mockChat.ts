// Mock chat for local development without backend
// Enhanced with persona-aware responses

interface PersonaResponses {
  [key: string]: string[];
}

const GENERAL_RESPONSES = [
  "I'm Enma, running in **demo mode** without a backend connection. In this mode, I can show you the interface, but I'm not connected to real AI models.\n\nTo use the full AI capabilities:\n1. Deploy via Lovable Cloud\n2. Or connect your own backend API\n\nThe interface you see is fully functional - try switching models, personas, and exploring the UI!",
  
  "This is a demonstration response from the mock system. In production, this would be a real AI response from models like **Gemini** or **GPT-5**.\n\n```javascript\n// Example code block\nconst greeting = 'Hello from Enma!';\nconsole.log(greeting);\n```\n\nThe streaming animation and markdown rendering are working as expected!",
  
  "Great question! Here's what I can demonstrate in demo mode:\n\n- ✅ Streaming text animation\n- ✅ Markdown rendering\n- ✅ Code syntax highlighting\n- ✅ Conversation management\n- ✅ Model & persona switching\n- ✅ Dark glassmorphism UI\n- ✅ Voice input (Web Speech API)\n\nConnect to a backend to unlock real AI responses!",

  "I'm here to help! In demo mode, all data is stored locally in your browser. Your conversations persist between sessions and remain completely private.\n\n**Tip:** You can force demo mode from settings if you want to use Enma offline even when connected to the internet.",

  "Demo mode is perfect for:\n\n1. **Exploring the UI** - Test all features\n2. **Offline usage** - Works without internet\n3. **Privacy** - No data leaves your device\n4. **Development** - Test locally before deploying\n\nWhen you're ready for real AI, simply connect to Lovable Cloud!",
];

const PERSONA_RESPONSES: PersonaResponses = {
  coding: [
    "As your coding assistant in demo mode, I'd normally help with:\n\n```typescript\n// Code review\nfunction example(x: number): number {\n  return x * 2;\n}\n```\n\n- Debugging complex issues\n- Architecture decisions\n- Best practices\n\nConnect to real AI for actual coding help!",
    "In demo mode, I can show you how code formatting works:\n\n```python\ndef hello_world():\n    print('Hello from Enma Demo!')\n    return True\n```\n\nFor real code assistance, enable the backend connection.",
  ],
  creative: [
    "In demo mode, I'd love to help with your creative projects!\n\n*Imagine a world where...*\n\n> \"Every story begins with a single word, and every word carries the weight of infinite possibility.\"\n\nConnect to real AI for actual creative writing assistance!",
    "Creative writing in demo mode:\n\n🎨 **Story Ideas**\n📝 **Content Creation**\n✨ **Brainstorming**\n\nThe full creative experience awaits when you connect to the backend!",
  ],
  analyst: [
    "As your analyst in demo mode, here's what data analysis might look like:\n\n| Metric | Value | Change |\n|--------|-------|--------|\n| Users | 1,234 | +12% |\n| Revenue | $50K | +8% |\n| Engagement | 67% | +5% |\n\nConnect to real AI for actual data insights!",
  ],
  tutor: [
    "As your tutor in demo mode, I'd explain concepts step by step:\n\n**Step 1:** Understand the basics\n**Step 2:** Practice with examples\n**Step 3:** Apply to real problems\n\n💡 *Learning tip:* Break complex topics into smaller parts!\n\nFor real tutoring, connect to the backend.",
  ],
  business: [
    "In demo mode, I'd provide business insights like:\n\n**SWOT Analysis Framework:**\n- **S**trengths - Internal advantages\n- **W**eaknesses - Internal challenges\n- **O**pportunities - External potential\n- **T**hreats - External risks\n\nConnect for real strategic advice!",
  ],
  wellness: [
    "Taking care of yourself is important! 💚\n\nIn demo mode, I can remind you to:\n\n- 🧘 Take deep breaths\n- 💧 Stay hydrated\n- 🚶 Take regular breaks\n- 😴 Get enough rest\n\nFor personalized wellness guidance, connect to the backend.",
  ],
  brainstorm: [
    "Let's brainstorm in demo mode! 💡\n\n**Idea Generation Techniques:**\n1. Mind mapping\n2. Random word association\n3. Reverse thinking\n4. SCAMPER method\n\nFor real brainstorming sessions, connect to AI!",
  ],
};

export const getMockResponse = (personaId?: string): string => {
  // Check for persona-specific responses
  if (personaId && PERSONA_RESPONSES[personaId]) {
    const personaResponses = PERSONA_RESPONSES[personaId];
    const randomIndex = Math.floor(Math.random() * personaResponses.length);
    return personaResponses[randomIndex];
  }
  
  // Default to general responses
  return GENERAL_RESPONSES[Math.floor(Math.random() * GENERAL_RESPONSES.length)];
};

export const streamMockResponse = async (
  onChunk: (chunk: string) => void,
  onComplete: () => void,
  signal?: AbortSignal,
  personaId?: string
): Promise<void> => {
  const response = getMockResponse(personaId);
  const words = response.split(' ');
  
  for (let i = 0; i < words.length; i++) {
    if (signal?.aborted) {
      break;
    }
    
    // Simulate streaming delay - varies for natural feel
    await new Promise(resolve => setTimeout(resolve, 25 + Math.random() * 45));
    
    const word = words[i] + (i < words.length - 1 ? ' ' : '');
    onChunk(word);
  }
  
  onComplete();
};

export const isLocalDevelopment = (): boolean => {
  // Check if we're running locally without proper backend config
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  return !supabaseUrl || supabaseUrl.includes('localhost') || supabaseUrl === '';
};
