import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Helper function to initialize Gemini client with fallback for dynamic keys
function getGeminiClient(clientKey?: string) {
  const apiKey = clientKey || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY_MISSING");
  }
  return new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Helper to execute AI actions with rate limit fallback (rotation)
async function executeWithFallback(
  userApiKeys: string[],
  action: (ai: GoogleGenAI, model: string) => Promise<any>
) {
  // If user provided custom keys, try them in order. Otherwise try environment variable key.
  const keysToTry = userApiKeys && userApiKeys.length > 0 
    ? userApiKeys 
    : [process.env.GEMINI_API_KEY].filter(Boolean) as string[];

  if (keysToTry.length === 0) {
    throw new Error("GEMINI_API_KEY_MISSING");
  }

  // We rotate models if one fails due to 503 high demand or 429 rate limit
  const modelsToTry = ["gemini-3.5-flash", "gemini-3.1-flash-lite"];

  let lastError: any = null;
  for (let i = 0; i < keysToTry.length; i++) {
    const key = keysToTry[i];
    
    for (const model of modelsToTry) {
      try {
        const ai = new GoogleGenAI({
          apiKey: key,
          httpOptions: {
            headers: {
              "User-Agent": "aistudio-build",
            },
          },
        });
        const response = await action(ai, model);
        return { response, usedKeyIndex: i, usedModel: model };
      } catch (err: any) {
        console.warn(`⚠️ Key di indeks ${i} dengan model ${model} mengalami error:`, err.message || err);
        lastError = err;
        // Proceed to next model or next API key if all models fail on this key
      }
    }
  }
  throw lastError || new Error("Semua API Key yang disediakan gagal atau terkena limit kuota.");
}

// 1. API: Generate OSN Questions
app.post("/api/generate", async (req, res) => {
  try {
    const { subject = "IPA", topics, difficulty, approach, count, userApiKey, userApiKeys = [] } = req.body;

    if (!topics || !Array.isArray(topics) || topics.length === 0) {
      return res.status(400).json({ error: "Silakan pilih setidaknya satu topik kuis!" });
    }

    // Combine userApiKey if provided alone for backwards compatibility
    const keysArray = [...userApiKeys];
    if (userApiKey && !keysArray.includes(userApiKey)) {
      keysArray.unshift(userApiKey);
    }

    const topicsString = topics.join(", ");
    
    // Customize prompt based on Subject
    let subjectTitle = "OSN IPA SD";
    let subjectFocus = "sains mendalam, bukan sekadar hafalan fakta";
    let systemInstruction = "Kamu adalah pembuat soal olimpiade sains (OSN) IPA SD terbaik tingkat nasional. Desain soal pilihan ganda kamu menuntut kemampuan analisis tingkat tinggi (HOTS), logis, mendalam, dan mendidik.";
    let descriptionText = "Daftar soal OSN IPA SD materi fisika, biologi, atau kimia dasar kelas 6";

    if (subject === "IPS") {
      subjectTitle = "OSN IPS (Ilmu Pengetahuan Sosial) SD";
      subjectFocus = "pemahaman geografi, interaksi sosial, sosiologi, sejarah perjuangan bangsa, dan ekonomi dasar secara kritis";
      systemInstruction = "Kamu adalah pembuat soal olimpiade IPS (OSN) SD terbaik tingkat nasional. Desain soal pilihan ganda kamu menuntut analisis spasial, sejarah kritis, sosiologi, dan ekonomi dasar yang mendidik dan HOTS.";
      descriptionText = "Daftar soal OSN IPS SD materi geografi, sejarah, sosiologi, atau ekonomi kelas 6";
    } else if (subject === "Matematika") {
      subjectTitle = "OSN Matematika SD";
      subjectFocus = "logika matematis, pemecahan masalah kreatif (problem solving), geometri, kombinatorik, dan aritmatika tingkat tinggi";
      systemInstruction = "Kamu adalah pembuat soal olimpiade Matematika (OSN) SD terbaik tingkat nasional. Desain soal pilihan ganda kamu menuntut kecerdasan logika, eksplorasi pola, geometri, pemecahan masalah matematis (HOTS) yang kreatif.";
      descriptionText = "Daftar soal OSN Matematika SD materi bilangan, aritmatika, geometri, statistika, atau kombinatorik kelas 6";
    }

    const prompt = `Buatlah tepat ${count} soal pilihan ganda ${subjectTitle} tingkat nasional (kelas 6) bernilai HOTS (Higher Order Thinking Skills).
Topik yang dicakup: [ ${topicsString} ]
Tingkat Kesulitan: ${difficulty}
Pendekatan Soal: ${approach}

Kualitas soal wajib memenuhi kriteria berikut:
- Menguji kemampuan analisis, eksperimen, inkuiri, atau ${subjectFocus}.
- Opsi pengecoh (distraktor) harus logis, realistis, dan menantang, memaksa siswa menganalisis variabel atau prinsip dengan seksama.
- Penjelasan ("explanation") harus menjabarkan konsep secara komprehensif, logis, dan mudah dimengerti anak SD.
- Trik olimpiade ("trick") harus memberikan cara cepat menganalisis soal, shortcut memahami pola soal, atau jembatan keledai yang memudahkan mengingat prinsip tersebut.
- Semua teks dalam Bahasa Indonesia yang baik dan benar. Opsi jawaban harus diawali dengan "A. ", "B. ", "C. ", atau "D. ".`;

    const { response, usedKeyIndex } = await executeWithFallback(keysArray, async (ai, model) => {
      return ai.models.generateContent({
        model: model,
        contents: prompt,
        config: {
          systemInstruction: systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              questions: {
                type: Type.ARRAY,
                description: descriptionText,
                minItems: count,
                maxItems: count,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    topic: {
                      type: Type.STRING,
                      description: "Topik spesifik dari silabus resmi Kemendikdasmen",
                    },
                    difficulty: {
                      type: Type.STRING,
                      description: "Mudah, Sedang, Sulit, atau Olimpiade",
                    },
                    question: {
                      type: Type.STRING,
                      description: "Pertanyaan HOTS yang menantang pemikiran logis siswa",
                    },
                    options: {
                      type: Type.ARRAY,
                      description: "Empat pilihan jawaban berkode A, B, C, D",
                      items: {
                        type: Type.STRING,
                      },
                    },
                    correctIndex: {
                      type: Type.INTEGER,
                      description: "Index jawaban yang benar (0 untuk A, 1 untuk B, 2 untuk C, 3 untuk D)",
                    },
                    explanation: {
                      type: Type.STRING,
                      description: "Penjelasan mendalam dan ilmiah",
                    },
                    trick: {
                      type: Type.STRING,
                      description: "Shortcut analisis cerdas atau trik cepat mengingat pola tipe soal ini untuk olimpiade",
                    },
                  },
                  required: ["topic", "difficulty", "question", "options", "correctIndex", "explanation", "trick"],
                },
              },
            },
            required: ["questions"],
          },
        },
      });
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error("Gagal menerima respon teks dari model AI");
    }

    const data = JSON.parse(responseText.trim());
    res.json({ ...data, usedKeyIndex });
  } catch (error: any) {
    console.error("Generate error:", error);
    if (error.message === "GEMINI_API_KEY_MISSING") {
      res.status(401).json({
        error: "API Key Gemini belum diset. Silakan isi API Key di kolom pengaturan gerigi aplikasi atau di panel Secrets.",
        code: "KEY_MISSING"
      });
    } else {
      res.status(500).json({ error: `Gagal membuat soal: ${error.message || error}` });
    }
  }
});

// 2. API: Tutor AI
app.post("/api/tutor", async (req, res) => {
  try {
    const { 
      subject = "IPA",
      question, 
      options, 
      correctIndex, 
      explanation, 
      userSelectedAnswer, 
      chatHistory, 
      message, 
      userApiKey,
      userApiKeys = []
    } = req.body;

    const keysArray = [...userApiKeys];
    if (userApiKey && !keysArray.includes(userApiKey)) {
      keysArray.unshift(userApiKey);
    }

    // Build the discussion context
    const contextPrompt = `Kamu adalah Tutor AI OSN ${subject} SD yang bersahabat, sabar, dan menggunakan metode Socratic (tanya jawab pemandu). 
Tugasmu adalah membimbing siswa SD Kelas 6 agar paham konsep mandiri tanpa pernah menyebut jawaban kunci ("A", "B", "C", "D" atau isinya) secara langsung!

SOAL YANG SEDANG DIBAHAS:
- Soal: "${question}"
- Pilihan Jawaban:
  ${options.map((opt: string, idx: number) => `Index ${idx}: ${opt}`).join("\n  ")}
- Index Jawaban Benar: ${correctIndex} (Jawaban yang benar adalah "${options[correctIndex]}")
- Penjelasan Ilmiah: "${explanation}"
- Siswa memilih saat kuis: ${userSelectedAnswer !== null ? `Jawaban ke-${userSelectedAnswer} ("${options[userSelectedAnswer]}")` : "Belum memilih"}

ATURAN KETAT UNTUK TUTOR:
1. JANGAN PERNAH menyodorkan pilihan yang benar kepada siswa (misal: "Jadi jawabannya B", "Pilih C ya").
2. Jika mereka bertanya langsung jawabannya apa, jawablah dengan bercanda, teka-teki, analogi, atau carikan petunjuk logisnya terlebih dahulu agar siswa yang menebaknya sendiri.
3. Gunakan analogi kehidupan sehari-hari anak-anak (seperti main bola, mengamati semut, membagi makanan, menabung uang, mengamati bintang).
4. Anggap siswa adalah peserta olimpiade cerdas dari SDN Bindang 2 Pamekasan. Semangati mereka dengan kata-kata hangat!
5. Jawab dengan paragraf yang singkat, ramah, gunakan emojis (😊, 🪐, 🧫, 🔍, 📈, 📐) agar tidak membosankan anak-anak.`;

    // Process history
    const contents = chatHistory.map((hist: any) => ({
      role: hist.role === "user" ? "user" : "model",
      parts: [{ text: hist.text }],
    }));

    const finalChoiceContext = message;

    const { response } = await executeWithFallback(keysArray, async (ai, model) => {
      return ai.models.generateContent({
        model: model,
        contents: [
          ...contents,
          { role: "user", parts: [{ text: finalChoiceContext }] }
        ],
        config: {
          systemInstruction: contextPrompt,
          temperature: 0.8,
        }
      });
    });

    res.json({ reply: response.text });
  } catch (error: any) {
    console.error("Tutor error:", error);
    if (error.message === "GEMINI_API_KEY_MISSING") {
      res.status(401).json({ error: "API Key Gemini belum diset.", code: "KEY_MISSING" });
    } else {
      res.status(500).json({ error: `Tutor AI sedang offline: ${error.message || error}` });
    }
  }
});


// 3. API: Bermain dengan Soal endpoints (Proxying to Gemini securely)
app.post("/api/bermain/generate", async (req, res) => {
  try {
    const { systemPrompt, prompt, userApiKeys = [], responseSchema } = req.body;
    const { response, usedModel } = await executeWithFallback(userApiKeys, async (ai, model) => {
      return ai.models.generateContent({
        model: model,
        contents: prompt,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: "application/json",
          responseSchema: responseSchema
        }
      });
    });
    res.json({ text: response.text, model: usedModel });
  } catch (error: any) {
    console.error("Bermain generate error:", error);
    res.status(500).json({ error: error.message || error });
  }
});

app.post("/api/bermain/hint", async (req, res) => {
  try {
    const { systemPrompt, prompt, userApiKeys = [] } = req.body;
    const { response, usedModel } = await executeWithFallback(userApiKeys, async (ai, model) => {
      return ai.models.generateContent({
        model: model,
        contents: prompt,
        config: {
          systemInstruction: systemPrompt
        }
      });
    });
    res.json({ text: response.text, model: usedModel });
  } catch (error: any) {
    console.error("Bermain hint error:", error);
    res.status(500).json({ error: error.message || error });
  }
});

app.post("/api/bermain/materi", async (req, res) => {
  try {
    const { systemPrompt, prompt, userApiKeys = [] } = req.body;
    const { response, usedModel } = await executeWithFallback(userApiKeys, async (ai, model) => {
      return ai.models.generateContent({
        model: model,
        contents: prompt,
        config: {
          systemInstruction: systemPrompt
        }
      });
    });
    res.json({ text: response.text, model: usedModel });
  } catch (error: any) {
    console.error("Bermain materi error:", error);
    res.status(500).json({ error: error.message || error });
  }
});


// 4. Vite Server / Production files integration
async function setupVite() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Genius OSN Server] Running on http://localhost:${PORT} in ${process.env.NODE_ENV || "development"} mode`);
  });
}

setupVite();
