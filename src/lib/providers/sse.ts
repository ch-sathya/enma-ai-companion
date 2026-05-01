// Shared SSE line-by-line parser for OpenAI-style streaming
export async function parseSSEStream(
  response: Response,
  onLine: (jsonStr: string) => boolean | void, // return true to stop
  signal?: AbortSignal
): Promise<void> {
  if (!response.body) throw new Error("No response body");

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let textBuffer = "";

  while (true) {
    if (signal?.aborted) {
      reader.cancel().catch(() => {});
      return;
    }
    const { done, value } = await reader.read();
    if (done) break;

    textBuffer += decoder.decode(value, { stream: true });

    let newlineIndex: number;
    while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
      let line = textBuffer.slice(0, newlineIndex);
      textBuffer = textBuffer.slice(newlineIndex + 1);
      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (line.startsWith(":") || line.trim() === "") continue;
      if (!line.startsWith("data: ")) continue;
      const jsonStr = line.slice(6).trim();
      if (jsonStr === "[DONE]") return;
      try {
        if (onLine(jsonStr) === true) return;
      } catch {
        // Partial JSON across chunk boundary — push back and wait
        textBuffer = "data: " + jsonStr + "\n" + textBuffer;
        break;
      }
    }
  }
}
