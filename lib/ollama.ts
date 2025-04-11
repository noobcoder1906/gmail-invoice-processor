export async function generateFromOllama(prompt: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort();
  }, 120_000); // Increased to 2 minutes timeout

  try {
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'tinyllama',
        prompt,
        stream: false,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errText = await response.text();
      console.error("❌ Ollama returned error:", errText);
      throw new Error(`Ollama request failed with status ${response.status}`);
    }

    const data = await response.json();

    if (!data.response) {
      console.error("⚠️ Ollama returned no response field in data:", data);
      throw new Error("No response from Ollama");
    }

    return data.response.trim();
  } catch (err: any) {
    clearTimeout(timeout);

    if (err.name === 'AbortError') {
      console.error("⏰ Request to Ollama timed out");
      throw new Error("Ollama request timed out");
    }

    console.error("❌ Ollama fetch failed:", err);
    throw new Error("Ollama fetch failed");
  }
}
