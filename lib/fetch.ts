// lib/ollama.ts

export async function generateFromOllama(prompt: string): Promise<string> {
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      controller.abort();
    }, 120_000); // 2 minutes timeout
  
    try {
      // Split the prompt into smaller chunks if it exceeds 2000 characters (to prevent large requests)
      const MAX_INPUT_LENGTH = 2000;
      if (prompt.length > MAX_INPUT_LENGTH) {
        console.log("⚠️ Prompt is too long, splitting into smaller chunks.");
        const chunks = splitTextIntoChunks(prompt, MAX_INPUT_LENGTH);
        let fullResponse = "";
  
        for (const chunk of chunks) {
          const chunkResponse = await sendRequestToOllama(chunk);
          fullResponse += chunkResponse;
        }
  
        clearTimeout(timeout);
        return fullResponse;
      } else {
        const response = await sendRequestToOllama(prompt);
        clearTimeout(timeout);
        return response;
      }
  
    } catch (err: any) {
      clearTimeout(timeout);
      handleOllamaError(err);
      throw new Error("Ollama fetch failed");
    }
  }
  
  // Send request to local Ollama API with llama2 model
  async function sendRequestToOllama(prompt: string): Promise<string> {
    try {
      const response = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama2', // ✅ UPDATED: using locally pulled model
          prompt,
          stream: false
        }),
        signal: new AbortController().signal
      });
  
      if (!response.ok) {
        const errText = await response.text();
        console.error("❌ Ollama returned error:", errText);
        throw new Error(`Ollama request failed with status ${response.status}`);
      }
  
      const data = await response.json();
  
      if (!data.response) {
        console.error("⚠️ Ollama returned no 'response' field:", data);
        throw new Error("No response from Ollama");
      }
  
      return data.response.trim();
    } catch (err: any) {
      console.error("❌ Error sending request to Ollama:", err);
      throw new Error("Error with Ollama request");
    }
  }
  
  // Split large text into chunks for LLM input safety
  function splitTextIntoChunks(text: string, maxLength: number): string[] {
    const chunks: string[] = [];
    let chunk = "";
  
    for (const word of text.split(" ")) {
      if (chunk.length + word.length + 1 <= maxLength) {
        chunk += " " + word;
      } else {
        chunks.push(chunk.trim());
        chunk = word;
      }
    }
  
    if (chunk) {
      chunks.push(chunk.trim());
    }
  
    return chunks;
  }
  
  // Log timeout or other errors
  function handleOllamaError(err: any): void {
    if (err.name === 'AbortError') {
      console.error("⏰ Request to Ollama timed out");
    } else {
      console.error("❌ Ollama fetch failed:", err);
    }
  }
  