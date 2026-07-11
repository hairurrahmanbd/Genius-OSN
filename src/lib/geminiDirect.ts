interface DirectCallConfig {
  userApiKeys: string[];
  systemInstruction?: string;
  prompt: string;
  responseMimeType?: string;
  responseSchema?: any;
  temperature?: number;
  chatHistory?: { role: "user" | "model"; text: string }[];
}

export async function callGeminiDirectRest({
  userApiKeys,
  systemInstruction,
  prompt,
  responseMimeType,
  responseSchema,
  temperature,
  chatHistory
}: DirectCallConfig): Promise<{ text: string; model: string }> {
  const keysToTry = userApiKeys.map(k => k.trim()).filter(Boolean);
  if (keysToTry.length === 0) {
    throw new Error("API Key Gemini belum diisi. Silakan isi API Key Anda di Menu Utama terlebih dahulu.");
  }

  // We rotate models to find one that succeeds and supports our generation options
  const modelsToTry = ["gemini-2.5-flash", "gemini-1.5-flash", "gemini-1.5-flash-8b"];

  let lastError: any = null;

  for (const key of keysToTry) {
    for (const model of modelsToTry) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
        
        const contents = [];
        if (chatHistory && chatHistory.length > 0) {
          for (const msg of chatHistory) {
            contents.push({
              role: msg.role === "user" ? "user" : "model",
              parts: [{ text: msg.text }]
            });
          }
        }
        contents.push({
          role: "user",
          parts: [{ text: prompt }]
        });

        const body: any = {
          contents
        };

        if (systemInstruction) {
          body.systemInstruction = {
            parts: [{ text: systemInstruction }]
          };
        }

        const generationConfig: any = {};
        if (temperature !== undefined) {
          generationConfig.temperature = temperature;
        }
        if (responseMimeType) {
          generationConfig.responseMimeType = responseMimeType;
        }
        if (responseSchema) {
          generationConfig.responseSchema = responseSchema;
        }

        if (Object.keys(generationConfig).length > 0) {
          body.generationConfig = generationConfig;
        }

        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(body)
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`HTTP ${response.status}: ${errText}`);
        }

        const resData = await response.json();
        const candidateText = resData.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!candidateText) {
          throw new Error("Respon kosong atau tidak valid dari Gemini API.");
        }

        return {
          text: candidateText,
          model
        };
      } catch (err: any) {
        console.warn(`Direct client call failed for model ${model}:`, err.message || err);
        lastError = err;
      }
    }
  }

  throw lastError || new Error("Gagal berkomunikasi dengan Gemini API secara langsung.");
}
