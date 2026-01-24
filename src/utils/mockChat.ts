// Mock chat for local development without backend

const MOCK_RESPONSES = [
  "I'm Enma, running in **demo mode** without a backend connection. In this mode, I can show you the interface, but I'm not connected to real AI models.\n\nTo use the full AI capabilities:\n1. Deploy via Lovable Cloud\n2. Or connect your own backend API\n\nThe interface you see is fully functional - try switching models, personas, and exploring the UI!",
  
  "This is a demonstration response from the mock system. In production, this would be a real AI response from models like **Gemini** or **GPT-5**.\n\n```javascript\n// Example code block\nconst greeting = 'Hello from Enma!';\nconsole.log(greeting);\n```\n\nThe streaming animation and markdown rendering are working as expected!",
  
  "Great question! Here's what I can demonstrate in demo mode:\n\n- ✅ Streaming text animation\n- ✅ Markdown rendering\n- ✅ Code syntax highlighting\n- ✅ Conversation management\n- ✅ Model & persona switching\n- ✅ Dark glassmorphism UI\n\nConnect to a backend to unlock real AI responses!",
];

export const getMockResponse = (): string => {
  return MOCK_RESPONSES[Math.floor(Math.random() * MOCK_RESPONSES.length)];
};

export const streamMockResponse = async (
  onChunk: (chunk: string) => void,
  onComplete: () => void,
  signal?: AbortSignal
): Promise<void> => {
  const response = getMockResponse();
  const words = response.split(' ');
  
  for (let i = 0; i < words.length; i++) {
    if (signal?.aborted) {
      break;
    }
    
    // Simulate streaming delay
    await new Promise(resolve => setTimeout(resolve, 30 + Math.random() * 50));
    
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
