// lib/ollama.ts

export async function generateFromOllama(prompt: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort();
  }, 120_000); // 2 minutes timeout

  try {
    const MAX_INPUT_LENGTH = 2000;
    if (prompt.length > MAX_INPUT_LENGTH) {
      console.log("⚠️ Prompt is too long, splitting into smaller chunks.");
      const chunks = splitTextIntoChunks(prompt, MAX_INPUT_LENGTH);
      let fullResponse = "";

      for (const chunk of chunks) {
        try {
          const chunkResponse = await sendRequestToOllama(chunk);
          fullResponse += chunkResponse;
        } catch (ollamaErr) {
          console.warn("🔁 Falling back to Gemini for chunk...");
          const geminiChunk = await sendRequestToGemini(chunk);
          fullResponse += geminiChunk;
        }
      }

      clearTimeout(timeout);
      return fullResponse;
    } else {
      try {
        const response = await sendRequestToOllama(prompt);
        clearTimeout(timeout);
        return response;
      } catch (ollamaErr) {
        console.warn("🔁 Falling back to Gemini for full prompt...");
        const geminiResponse = await sendRequestToGemini(prompt);
        clearTimeout(timeout);
        return geminiResponse;
      }
    }
  } catch (err: any) {
    clearTimeout(timeout);
    handleOllamaError(err);
    throw new Error("LLM fetch failed");
  }
}

// Send request to local Ollama API with llama2 model
async function sendRequestToOllama(prompt: string): Promise<string> {
  const response = await fetch('http://localhost:11434/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'llama2', prompt, stream: false }),
    signal: new AbortController().signal
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Ollama request failed with status ${response.status}: ${errText}`);
  }

  const data = await response.json();
  if (!data.response) {
    throw new Error("No response from Ollama");
  }
  return data.response.trim();
}

// Send request to Gemini API
async function sendRequestToGemini(prompt: string): Promise<string> {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro-001:generateContent?key=${process.env.GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }]
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini request failed with status ${response.status}: ${errText}`);
  }

  const json = await response.json();
  return json?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "{}";
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
  if (chunk) chunks.push(chunk.trim());
  return chunks;
}

function handleOllamaError(err: any): void {
  if (err.name === 'AbortError') {
    console.error("⏰ Request to Ollama timed out");
  } else {
    console.error("❌ Ollama fetch failed:", err);
  }
}
