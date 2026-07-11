import React, { useState, useEffect, useRef } from "react";
import { AlertCircle, ArrowLeft, BookOpen, Check, Copy, HelpCircle, Home, Key, Play, RotateCcw, Settings, Volume2, VolumeX } from "lucide-react";
import { callGeminiDirectRest } from "../lib/geminiDirect";

interface PlayPageProps {
  onBackToMainMenu: () => void;
  apiKeys: string[];
}

export default function BermainDenganSoal({ onBackToMainMenu, apiKeys }: PlayPageProps) {
  // === AUDIO STATE ===
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // === TAB STATE ===
  const [activeTab, setActiveTab] = useState<"soal" | "materi">("soal");

  // === GENERAL QUIZ CONFIG STATE ===
  const [mapelValue, setMapelValue] = useState<string>("IPAS");
  const [kelasSelect, setKelasSelect] = useState<string>("Kelas 5 SD");
  const [materiInput, setMateriInput] = useState<string>("");
  const [diffValue, setDiffValue] = useState<string>("sedang");
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [selectedBloom, setSelectedBloom] = useState<string[]>([
    "C2 (Memahami)",
    "C3 (Mengaplikasikan)",
    "C4 (Menganalisis)"
  ]);
  const [qLength, setQLength] = useState<string>("Pendek (Sederhana dan ringkas, 10-20 kata)");

  // === MATERI STATE ===
  const [materiMapel, setMateriMapel] = useState<string>("IPAS");
  const [materiKelas, setMateriKelas] = useState<string>("Kelas 5 SD");
  const [materiTopik, setMateriTopik] = useState<string>("");
  const [materiMode, setMateriMode] = useState<string>("cerita");
  const [materiOutput, setMateriOutput] = useState<string>("");
  const [materiLoading, setMateriLoading] = useState<boolean>(false);
  const [currentTip, setCurrentTip] = useState<string>("Fakta seru: Otak manusia punya lebih dari 86 miliar sel saraf! 🧠");

  // === PLAY STATE ===
  const [screen, setScreen] = useState<"setup" | "play" | "result">("setup");
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [scorePoints, setScorePoints] = useState<number>(0);
  const [rightAnswersCount, setRightAnswersCount] = useState<number>(0);
  const [lastUsedProvider, setLastUsedProvider] = useState<string>("—");
  const [questionStates, setQuestionStates] = useState<any[]>([]); // array of { answered, isCorrect, selections }
  
  // Current interactive selections for active question
  const [pgSelectedOption, setPgSelectedOption] = useState<string | null>(null);
  const [pgKompleksSelections, setPgKompleksSelections] = useState<Set<string>>(new Set());
  const [bsSelections, setBsSelections] = useState<Record<number, string>>({});

  // === MODAL STATE ===
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [modalTitle, setModalTitle] = useState<string>("");
  const [modalLoadingText, setModalLoadingText] = useState<string>("");
  const [modalIsLoading, setModalIsLoading] = useState<boolean>(true);
  const [modalResponseText, setModalResponseText] = useState<string>("");

  const loadingTips = [
    "Fakta seru: Otak manusia punya lebih dari 86 miliar sel saraf! 🧠",
    "Belajar rutin 20 menit sehari lebih efektif daripada belajar semalam suntuk! ⏰",
    "Albert Einstein juga pernah kesulitan belajar waktu kecil! 💪",
    "Membaca buku = pergi ke ribuan tempat tanpa keluar rumah! 📚",
    "Tahukah kamu? Lebah bisa mengenali wajah manusia! 🐝",
  ];

  // === INITIALIZATION ===
  // Sync MathJax on render updates
  useEffect(() => {
    if ((window as any).MathJax && (window as any).MathJax.typesetPromise) {
      (window as any).MathJax.typesetPromise().catch((err: any) => console.log(err));
    }
  }, [currentIdx, screen, questions, materiOutput]);

  // === SOUND SYNTHESIS ===
  const playTone = (freq: number, type: "sine" | "triangle" | "square" | "sawtooth", duration: number) => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") {
        ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.005, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      console.warn("Audio Context Error:", e);
    }
  };

  const playSuccessSound = () => {
    playTone(523.25, "sine", 0.1);
    setTimeout(() => playTone(659.25, "sine", 0.12), 80);
    setTimeout(() => playTone(783.99, "sine", 0.25), 160);
  };

  const playFailureSound = () => {
    playTone(293.66, "triangle", 0.15);
    setTimeout(() => playTone(220.00, "triangle", 0.3), 120);
  };

  // === ACTIONS ===
  const getGeminiKeys = () => {
    return apiKeys.map(k => k.trim()).filter(k => k.length > 0);
  };

  // === SECURE CALL VIA EXPRESS BACKEND PROXY (WITH DIRECT FALLBACK) ===
  const callGeminiSecure = async (
    endpoint: "generate" | "hint" | "materi",
    systemPrompt: string,
    userPrompt: string,
    responseSchema?: any
  ) => {
    const keys = getGeminiKeys();
    if (keys.length === 0) {
      throw new Error("API Key Gemini belum diisi. Silakan isi API Key Anda di Menu Utama terlebih dahulu.");
    }

    try {
      const response = await fetch(`/api/bermain/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemPrompt,
          prompt: userPrompt,
          userApiKeys: keys,
          responseSchema: endpoint === "generate" ? responseSchema : undefined
        })
      });

      let data: any = {};
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const textError = await response.text();
        console.warn("Express proxy response was not JSON (probably 404 or static site hosting):", textError);
        // Trigger fallback to client-side direct request
        throw new Error("TRIGGER_CLIENT_FALLBACK");
      }

      if (!response.ok) {
        throw new Error(data.error || "Gagal berkomunikasi dengan AI.");
      }

      setLastUsedProvider(data.model ? `Gemini (${data.model})` : "Gemini");
      return data.text;
    } catch (proxyError: any) {
      console.warn("Express backend proxy failed, falling back to direct client-side Gemini call...", proxyError.message || proxyError);
      
      const result = await callGeminiDirectRest({
        userApiKeys: keys,
        systemInstruction: systemPrompt,
        prompt: userPrompt,
        responseMimeType: endpoint === "generate" ? "application/json" : undefined,
        responseSchema: endpoint === "generate" ? responseSchema : undefined
      });

      setLastUsedProvider(`Gemini Direct (${result.model})`);
      return result.text;
    }
  };

  const sanitizeJson = (rawText: string) => {
    if (!rawText) return "";
    let t = rawText.trim();
    t = t.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?\s*```\s*$/i, "").trim();

    const firstBrace = t.indexOf("{");
    const lastBrace = t.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      t = t.slice(firstBrace, lastBrace + 1);
    }
    return t;
  };

  // === GENERATE QUIZ ===
  const handleMulaiBermain = async () => {
    const keys = getGeminiKeys();
    if (keys.length === 0) {
      alert("Harap isi minimal satu API Key Gemini terlebih dahulu di halaman utama (Menu Utama)!");
      onBackToMainMenu();
      return;
    }

    const difficultyDescMap: Record<string, string> = {
      mudah: "tingkat mudah, fokus pada C1 dan C2 (mengingat dan memahami), soal sederhana untuk siswa SD",
      sedang: "tingkat sedang, variasi C2 hingga C4, cukup menantang tapi masih terjangkau siswa SD",
      sulit: "tingkat sulit, dominan C4-C6 (analisis, evaluasi, mencipta), soal menantang dan kompleks",
      campuran: "campuran semua tingkat (C1 sampai C6), kombinasi soal mudah, sedang, dan sulit secara acak"
    };
    const diffDesc = difficultyDescMap[diffValue] || difficultyDescMap["sedang"];

    const isEnglish = mapelValue === "Bahasa Inggris";
    const langNote = isEnglish
      ? `PENTING: Mapel ini adalah Bahasa Inggris. Soal WAJIB menggunakan Bahasa Inggris dasar (sesuai tingkat kesulitan ${diffValue} SD). Pembahasan bisa bilingual (Indonesia + Inggris).`
      : "";

    const lengthInstructions: Record<string, string> = {
      "Pendek (Sederhana dan ringkas, 10-20 kata)":
        "PENDEK: Setiap teks soal (field \"question\") WAJIB terdiri dari 10 sampai 20 kata. Hitung katanya! Jangan lebih dari 20 kata.",
      "Panjang (Bernarasi dan deskriptif, studi kasus)":
        "PANJANG: Setiap teks soal (field \"question\") WAJIB berupa paragraf narasi atau studi kasus minimal 40 kata. Ceritakan situasi/konteks secara rinci.",
      "Campuran (Kombinasi soal pendek dan panjang)":
        "CAMPURAN: Separuh soal PENDEK (10-20 kata) dan separuh lagi PANJANG bernarasi (minimal 40 kata). Variasikan secara bergantian."
    };
    const lengthRule = lengthInstructions[qLength] || lengthInstructions["Pendek (Sederhana dan ringkas, 10-20 kata)"];

    const pgCount = Math.floor(questionCount / 3);
    const pgKompleksCount = Math.floor(questionCount / 3);
    const bsCount = questionCount - pgCount - pgKompleksCount;

    const systemPrompt = `Kamu adalah pembuat soal SD (Kurikulum Merdeka). Buat soal asesmen Bloom untuk:
- Mapel: ${mapelValue} | Kelas: ${kelasSelect} | Topik: ${materiInput.trim() || "Materi Umum"}
- Bloom: ${selectedBloom.join(", ")} | Kesulitan: ${diffDesc}
${langNote}

ATURAN PANJANG SOAL — WAJIB DIPATUHI:
${lengthRule}

DISTRIBUSI JENIS SOAL (WAJIB DIPATUHI):
Kamu wajib menghasilkan tepat ${questionCount} soal dengan rincian tipe berikut:
- Tipe "pg" (Pilihan Ganda Biasa, 1 jawaban benar): HARUS sebanyak tepat ${pgCount} soal.
- Tipe "pg_kompleks" (Pilihan Ganda Kompleks, 2-3 jawaban benar): HARUS sebanyak tepat ${pgKompleksCount} soal.
- Tipe "benar_salah" (Pernyataan Benar atau Salah, berisi 3 sub-pernyataan): HARUS sebanyak tepat ${bsCount} soal.
Jangan hanya menghasilkan satu atau dua tipe saja. Buat persis sesuai pembagian di atas agar variasi soal adil dan seimbang!

JENIS SOAL & STRUKTUR PENGISIAN FIELD:
Setiap objek soal kuis di dalam array "questions" harus memiliki SEMUA field berikut tanpa terkecuali, demi kesesuaian skema JSON yang ketat:
1. "type": diisi dengan string "pg", "pg_kompleks", atau "benar_salah" (WAJIB bervariasi secara adil).
2. "bloomLevel": level taksonomi Bloom (misal: "C2", "C3", "C4").
3. "question": teks pertanyaan utama yang ramah anak SD.
4. "options": array string pilihan jawaban.
   - Untuk "pg" dan "pg_kompleks": wajib berisi tepat 4 pilihan jawaban unik.
   - Untuk "benar_salah": wajib diisi array kosong [].
5. "correctAnswer": string jawaban yang benar.
   - Untuk "pg": diisi teks pilihan yang benar (harus persis sama dengan salah satu pilihan di "options").
   - Untuk "pg_kompleks" dan "benar_salah": wajib diisi string kosong "".
6. "correctAnswers": array string jawaban benar.
   - Untuk "pg_kompleks": wajib berisi 2 atau 3 teks pilihan yang benar (masing-masing harus persis sama dengan pilihan di "options").
   - Untuk "pg" dan "benar_salah": wajib diisi array kosong [].
7. "statements": array berisi objek pernyataan Benar/Salah.
   - Untuk "benar_salah": wajib berisi tepat 3 objek, masing-masing dengan properti "text" (teks pernyataan) dan "answer" (hanya boleh bernilai string "Benar" atau "Salah").
   - Untuk "pg" dan "pg_kompleks": wajib diisi array kosong [].
8. "explanation": penjelasan/pembahasan jawaban yang ramah anak dan edukatif.

ATURAN PENTING LAINNYA:
1. correctAnswer harus PERSIS sama dengan salah satu teks pilihan di "options".
2. Setiap item dalam correctAnswers berupa array string yang nilainya harus PERSIS sama dengan salah satu pilihan di "options".
3. "answer" di dalam array "statements" hanya boleh berisi string: "Benar" atau "Salah".
4. JANGAN gunakan markdown atau pembungkus lain dalam output JSON, hanya JSON murni.
5. Semua teks harus ramah anak SD.
6. JANGAN menyertakan gambar (SVG) atau field "imageSvg" sama sekali.
7. JANGAN membuat soal yang merujuk pada gambar (seperti "Perhatikan gambar berikut ini" atau "berdasarkan diagram di atas"), karena soal tidak memiliki gambar.
8. KONSISTENSI JUMLAH SOAL: Kamu wajib menghasilkan TEPAT ${questionCount} soal kuis di dalam array "questions". Jangan kurang dari ${questionCount}, jangan lebih dari ${questionCount}. Array "questions" harus memiliki panjang persis ${questionCount}.`;

    const userPrompt = `Buat tepat ${questionCount} soal kuis interaktif sesuai rincian: ${pgCount} soal bertipe 'pg', ${pgKompleksCount} soal bertipe 'pg_kompleks', dan ${bsCount} soal bertipe 'benar_salah'. Kembalikan dalam array 'questions' sebanyak tepat ${questionCount} item.`;

    const responseSchema = {
      type: "OBJECT",
      properties: {
        questions: {
          type: "ARRAY",
          description: `Daftar kuis interaktif berjumlah tepat ${questionCount} soal`,
          items: {
            type: "OBJECT",
            properties: {
              type: { 
                type: "STRING",
                enum: ["pg", "pg_kompleks", "benar_salah"]
              },
              bloomLevel: { type: "STRING" },
              question: { type: "STRING" },
              options: {
                type: "ARRAY",
                items: { type: "STRING" }
              },
              correctAnswer: { type: "STRING" },
              correctAnswers: {
                type: "ARRAY",
                items: { type: "STRING" }
              },
              statements: {
                type: "ARRAY",
                items: {
                  type: "OBJECT",
                  properties: {
                    text: { type: "STRING" },
                    answer: { 
                      type: "STRING",
                      enum: ["Benar", "Salah"]
                    }
                  },
                  required: ["text", "answer"]
                }
              },
              explanation: { type: "STRING" }
            },
            required: [
              "type", 
              "bloomLevel", 
              "question", 
              "options", 
              "correctAnswer", 
              "correctAnswers", 
              "statements", 
              "explanation"
            ]
          }
        }
      },
      required: ["questions"]
    };

    setModalTitle("Menyiapkan Soal ✨");
    setModalLoadingText(`Sedang meramu ${questionCount} soal ${mapelValue} ${kelasSelect}...`);
    setModalIsLoading(true);
    setModalOpen(true);

    try {
      const resultText = await callGeminiSecure("generate", systemPrompt, userPrompt, responseSchema);
      const sanitized = sanitizeJson(resultText);
      const parsed = JSON.parse(sanitized);

      if (!parsed.questions || parsed.questions.length === 0) {
        throw new Error("Struktur JSON tidak valid atau soal kosong.");
      }

      const valid = parsed.questions.filter((q: any) => {
        if (!q.type || !q.bloomLevel || !q.question || !q.explanation) return false;
        if (q.type === "pg") return Array.isArray(q.options) && q.options.length >= 2 && q.correctAnswer;
        if (q.type === "pg_kompleks") return Array.isArray(q.options) && q.options.length >= 2 && Array.isArray(q.correctAnswers) && q.correctAnswers.length >= 1;
        if (q.type === "benar_salah") return Array.isArray(q.statements) && q.statements.length >= 2;
        return false;
      });

      if (valid.length === 0) {
        throw new Error("Model mengembalikan format rusak. Silakan ganti topik atau ulangi.");
      }

      setQuestions(valid);
      setCurrentIdx(0);
      setScorePoints(0);
      setRightAnswersCount(0);
      setQuestionStates(valid.map(() => ({ answered: false, isCorrect: false, selections: null })));
      
      // Clear selections
      setPgSelectedOption(null);
      setPgKompleksSelections(new Set());
      setBsSelections({});

      setModalOpen(false);
      setScreen("play");
    } catch (err: any) {
      console.error(err);
      setModalIsLoading(false);
      setModalResponseText(`Ups, ada masalah 😅\n\n${err.message || err}\n\nCobalah untuk memilih materi yang lebih pendek atau sesuaikan kunci API Anda.`);
    }
  };

  // === PLAY GAMEPLAY LOGIC ===
  const handleSelectOptionPG = (opt: string) => {
    const qState = questionStates[currentIdx];
    if (qState.answered) return;

    const qData = questions[currentIdx];
    const isCorrect = opt === qData.correctAnswer;

    const newStates = [...questionStates];
    newStates[currentIdx] = {
      answered: true,
      isCorrect,
      selections: opt
    };
    setQuestionStates(newStates);
    setPgSelectedOption(opt);

    if (isCorrect) {
      playSuccessSound();
      setRightAnswersCount(prev => prev + 1);
      setScorePoints(prev => prev + (100 / questions.length));
    } else {
      playFailureSound();
    }
  };

  const handleToggleOptionPGKompleks = (opt: string) => {
    const qState = questionStates[currentIdx];
    if (qState.answered) return;

    setPgKompleksSelections(prev => {
      const next = new Set(prev);
      if (next.has(opt)) {
        next.delete(opt);
      } else {
        next.add(opt);
      }
      return next;
    });
  };

  const handleLockPGKompleks = () => {
    const qState = questionStates[currentIdx];
    if (qState.answered) return;

    if (pgKompleksSelections.size === 0) {
      alert("Pilih minimal 1 pernyataan!");
      return;
    }

    const qData = questions[currentIdx];
    const correctSet = new Set(qData.correctAnswers || []);

    let correctPicks = 0;
    let wrongPicks = 0;
    pgKompleksSelections.forEach(v => {
      if (correctSet.has(v)) correctPicks++;
      else wrongPicks++;
    });

    const isFullyCorrect = correctPicks === correctSet.size && wrongPicks === 0;
    const partialRatio = Math.max(0, (correctPicks - wrongPicks) / correctSet.size);

    const newStates = [...questionStates];
    newStates[currentIdx] = {
      answered: true,
      isCorrect: isFullyCorrect,
      selections: Array.from(pgKompleksSelections)
    };
    setQuestionStates(newStates);

    if (isFullyCorrect) {
      playSuccessSound();
      setRightAnswersCount(prev => prev + 1);
      setScorePoints(prev => prev + (100 / questions.length));
    } else if (partialRatio > 0) {
      playTone(440, "sine", 0.15);
      setTimeout(() => playTone(523, "sine", 0.2), 120);
      setScorePoints(prev => prev + ((100 / questions.length) * partialRatio));
    } else {
      playFailureSound();
    }
  };

  const handleSelectBS = (stmtIdx: number, val: string) => {
    const qState = questionStates[currentIdx];
    if (qState.answered) return;

    setBsSelections(prev => ({
      ...prev,
      [stmtIdx]: val
    }));
  };

  const handleLockBenarSalah = () => {
    const qState = questionStates[currentIdx];
    if (qState.answered) return;

    const qData = questions[currentIdx];
    if (Object.keys(bsSelections).length < qData.statements.length) {
      alert("Isi semua pernyataan terlebih dahulu ya!");
      return;
    }

    let correctCount = 0;
    qData.statements.forEach((stmt: any, idx: number) => {
      if (bsSelections[idx] === stmt.answer) {
        correctCount++;
      }
    });

    const total = qData.statements.length;
    const isFullyCorrect = correctCount === total;
    const partialRatio = correctCount / total;

    const newStates = [...questionStates];
    newStates[currentIdx] = {
      answered: true,
      isCorrect: isFullyCorrect,
      selections: { ...bsSelections }
    };
    setQuestionStates(newStates);

    if (isFullyCorrect) {
      playSuccessSound();
      setRightAnswersCount(prev => prev + 1);
      setScorePoints(prev => prev + (100 / questions.length));
    } else if (partialRatio > 0) {
      playTone(440, "sine", 0.15);
      setTimeout(() => playTone(523, "sine", 0.2), 120);
      setScorePoints(prev => prev + ((100 / questions.length) * partialRatio));
    } else {
      playFailureSound();
    }
  };

  // === AI TUTOR HINTS ===
  const handleAskTutorAI = async () => {
    const keys = getGeminiKeys();
    if (keys.length === 0) {
      alert("Masukkan API Key Gemini dulu!");
      return;
    }

    const qData = questions[currentIdx];
    setModalTitle("Tutor AI 🤖");
    setModalLoadingText("Sedang menyiapkan petunjuk berpikir...");
    setModalIsLoading(true);
    setModalOpen(true);

    const sysPrompt = "Kamu adalah Tutor AI yang membantu siswa SD. Berikan 1-2 kalimat petunjuk logika (hint) yang membantu siswa berpikir tanpa membocorkan jawaban. Gunakan bahasa yang ramah dan menyemangati anak.";
    const userMsg = `Berikan hint untuk soal: ${qData.question}`;

    try {
      const hintText = await callGeminiSecure("hint", sysPrompt, userMsg);
      setModalIsLoading(false);
      setModalResponseText(hintText);
    } catch (err: any) {
      setModalIsLoading(false);
      setModalResponseText("Tutor AI sedang sibuk 📡. Cobalah membaca soalnya perlahan-lahan ya, kamu pasti bisa!");
    }
  };

  // === NAVIGATION ===
  const handlePrevQuestion = () => {
    if (currentIdx === 0) return;
    const targetIdx = currentIdx - 1;
    setCurrentIdx(targetIdx);

    // Restore selected values from states
    const targetState = questionStates[targetIdx];
    if (targetState && targetState.answered) {
      const qData = questions[targetIdx];
      if (qData.type === "pg") {
        setPgSelectedOption(targetState.selections);
      } else if (qData.type === "pg_kompleks") {
        setPgKompleksSelections(new Set(targetState.selections));
      } else if (qData.type === "benar_salah") {
        setBsSelections(targetState.selections || {});
      }
    } else {
      setPgSelectedOption(null);
      setPgKompleksSelections(new Set());
      setBsSelections({});
    }
  };

  const handleNextQuestion = () => {
    if (currentIdx < questions.length - 1) {
      const targetIdx = currentIdx + 1;
      setCurrentIdx(targetIdx);

      // Restore or clear
      const targetState = questionStates[targetIdx];
      if (targetState && targetState.answered) {
        const qData = questions[targetIdx];
        if (qData.type === "pg") {
          setPgSelectedOption(targetState.selections);
        } else if (qData.type === "pg_kompleks") {
          setPgKompleksSelections(new Set(targetState.selections));
        } else if (qData.type === "benar_salah") {
          setBsSelections(targetState.selections || {});
        }
      } else {
        setPgSelectedOption(null);
        setPgKompleksSelections(new Set());
        setBsSelections({});
      }
    } else {
      setScreen("result");
    }
  };

  const handleMainLagi = () => {
    setScreen("setup");
    setQuestions([]);
    setQuestionStates([]);
    setCurrentIdx(0);
    setScorePoints(0);
    setRightAnswersCount(0);
  };

  // === GENERATE LESSON (MATERI) ===
  const handleGenerateMateri = async () => {
    const keys = getGeminiKeys();
    if (keys.length === 0) {
      alert("Harap isi minimal satu API Key Gemini terlebih dahulu di halaman utama (Menu Utama)!");
      onBackToMainMenu();
      return;
    }

    if (!materiTopik.trim()) {
      alert("Isi dulu topik yang mau dipelajari ya! 📝");
      return;
    }

    setMateriOutput("");
    setMateriLoading(true);

    let tipIdx = 0;
    const interval = setInterval(() => {
      setCurrentTip(loadingTips[tipIdx % loadingTips.length]);
      tipIdx++;
    }, 3000);

    const modeDescMap: Record<string, string> = {
      cerita: "Cerita Seru (narasi mengalir seperti dongeng, menggunakan tokoh dan alur yang menarik)",
      poin: "Poin-Poin (gunakan poin bernomor, kotak info, ringkasan singkat)",
      analogi: "Analogi Lucu (bandingkan materi dengan benda/situasi sehari-hari yang lucu dan mudah dibayangkan anak SD)",
      tanya: "Tanya-Jawab (format dialog antara guru dan murid yang natural dan menyenangkan)"
    };

    const sysPrompt = `Kamu adalah Guru AI yang sangat kreatif, ramah, dan ahli menjelaskan kepada anak SD. 
Tugasmu: buat penjelasan materi pelajaran yang menyenangkan, mudah dipahami, dan berkesan.

FORMAT OUTPUT (gunakan HTML inline tags saja, tidak perlu DOCTYPE/html/body):
- Gunakan <h2> untuk judul utama (dengan emoji besar di awal)
- Gunakan <h3> untuk sub-judul
- Gunakan <div class="fun-box"> untuk fakta menarik / tahukah kamu
- Gunakan <div class="info-box"> untuk info penting / definisi
- Gunakan <div class="example-box"> untuk contoh / ilustrasi
- Gunakan <ul><li> untuk daftar poin
- Gunakan <b> untuk kata kunci penting
- JANGAN gunakan markdown (seperti **, ##, dll)
- Tutup dengan bagian "🎯 Ringkasan Singkat" dalam fun-box
- Bahasa: Indonesia yang ramah, sederhana, sesuai usia anak SD

Gaya penjelasan yang diminta: ${modeDescMap[materiMode]}`;

    const userMsg = `Buat materi belajar tentang "${materiTopik}" untuk mata pelajaran ${materiMapel}, ${materiKelas}. Gaya: ${modeDescMap[materiMode]}. Buat se-menarik mungkin dengan banyak emoji, analogi, dan contoh nyata yang dekat dengan kehidupan anak SD!`;

    try {
      const materiText = await callGeminiSecure("materi", sysPrompt, userMsg);
      clearInterval(interval);
      setMateriLoading(false);

      // Simple formatting parser
      const formatted = materiText
        .replace(/```html/gi, "").replace(/```/g, "")
        .replace(/\*\*(.*?)\*\*/g, "<b>$1</b>")
        .replace(/##\s+/g, "")
        .replace(/\n/g, "<br>");

      setMateriOutput(formatted);
    } catch (err: any) {
      clearInterval(interval);
      setMateriLoading(false);
      setMateriOutput(`<div class="fun-box" style="border-color:#ef4444;background:#fef2f2;color:#dc2626">
        ❌ <b>Gagal memuat materi.</b><br>Coba lagi atau cek API key kamu ya!<br><small>${err.message || err}</small>
      </div>`);
    }
  };

  const handleCopyMateri = () => {
    // Strip HTML tags for clean copy
    const tempElement = document.createElement("div");
    tempElement.innerHTML = materiOutput;
    const cleanText = tempElement.innerText || tempElement.textContent || "";
    navigator.clipboard.writeText(cleanText).then(() => {
      alert("Materi berhasil disalin! 📋");
    }).catch(() => {
      alert("Gagal menyalin materi.");
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 py-6 px-4 relative flex flex-col items-center">
      
      {onBackToMainMenu && (
        <button
          type="button"
          onClick={onBackToMainMenu}
          className="absolute top-4 right-4 bg-white/20 hover:bg-white/35 text-white p-2 sm:p-2.5 rounded-full border border-white/20 shadow-md cursor-pointer transition-all active:scale-95 z-50 flex items-center justify-center"
          title="Kembali ke Menu Utama"
        >
          <Home className="w-5 h-5" />
        </button>
      )}
      
      {/* Decorative Bubbly Background Elements */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute w-44 h-44 rounded-full bg-white/10 blur-xl -top-10 -left-10 animate-pulse"></div>
        <div className="absolute w-64 h-64 rounded-full bg-white/5 blur-2xl top-1/3 -right-20 animate-pulse delay-700"></div>
        <div className="absolute w-52 h-52 rounded-full bg-white/10 blur-xl bottom-10 left-10 animate-pulse delay-1000"></div>
      </div>

      {/* HEADER BAR */}
      <header className="w-full max-w-2xl text-center mb-6 relative z-10 animate-float flex flex-col items-center">

        <div className="text-5xl mb-2 select-none">🎮</div>
        <h1 className="text-3xl md:text-4xl font-black text-white drop-shadow-md tracking-tight font-display">
          BERMAIN DENGAN SOAL
        </h1>
        <p className="text-purple-100 font-bold text-xs mt-1.5 uppercase tracking-wide">
          Belajar Sambil Seru-Seruan! 🌟 SDN BINDANG 2
        </p>
      </header>

      {/* SOUND CONTROL & TAB SWITCHING */}
      <div className="w-full max-w-lg md:max-w-2xl flex flex-col sm:flex-row justify-between items-center gap-3 relative z-10 mb-4">
        
        {/* Toggle tab */}
        <div className="flex bg-white/15 backdrop-blur-md border border-white/25 rounded-2xl p-1 gap-1 w-full max-w-md">
          <button
            onClick={() => {
              if (screen === "play") {
                if (confirm("Kamu sedang bermain kuis. Pindah tab akan menghapus progres kuis ini. Lanjutkan?")) {
                  setScreen("setup");
                  setActiveTab("soal");
                }
              } else {
                setActiveTab("soal");
              }
            }}
            className={`flex-1 py-2.5 px-4 rounded-xl font-black text-xs sm:text-sm transition-all duration-300 flex items-center justify-center gap-1.5 ${
              activeTab === "soal"
                ? "bg-white text-indigo-700 shadow-lg scale-[1.02]"
                : "text-purple-100 hover:bg-white/10"
            }`}
          >
            🎮 Generator Soal
          </button>
          <button
            onClick={() => {
              if (screen === "play") {
                if (confirm("Kamu sedang bermain kuis. Pindah tab akan menghapus progres kuis ini. Lanjutkan?")) {
                  setScreen("setup");
                  setActiveTab("materi");
                }
              } else {
                setActiveTab("materi");
              }
            }}
            className={`flex-1 py-2.5 px-4 rounded-xl font-black text-xs sm:text-sm transition-all duration-300 flex items-center justify-center gap-1.5 ${
              activeTab === "materi"
                ? "bg-white text-indigo-700 shadow-lg scale-[1.02]"
                : "text-purple-100 hover:bg-white/10"
            }`}
          >
            📚 Generator Materi
          </button>
        </div>

        {/* Sound Toggle */}
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="bg-white/15 hover:bg-white/25 text-white p-2.5 rounded-full border border-white/20 transition flex items-center gap-1.5 font-bold text-xs active:scale-95 shrink-0"
        >
          {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-300 animate-pulse" /> : <VolumeX className="w-4 h-4 text-slate-300" />}
          <span>{soundEnabled ? "Suara Menyala" : "Suara Senyap"}</span>
        </button>
      </div>

      {/* MAIN CONTENT CARD CONTAINER */}
      <main className="w-full max-w-lg md:max-w-2xl bg-white rounded-[28px] shadow-2xl border-b-8 border-indigo-200 relative z-10 overflow-hidden flex flex-col">
        
        {/* ================= TAB 1: GENERATOR SOAL ================= */}
        {activeTab === "soal" && (
          <div>
            {/* SCREEN 1: SETUP FOR QUIZ */}
            {screen === "setup" && (
              <div className="animate-pop">
                {/* Banner Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-5 text-white flex justify-between items-center relative">
                  <div>
                    <h3 className="font-black text-lg">Mulai Petualangan!</h3>
                    <p className="text-purple-100 text-xs font-semibold">Pilih mapel & topik favoritmu 🚀</p>
                  </div>
                </div>

                <div className="p-5 space-y-5">

                  {/* MAPEL SELECTION */}
                  <div className="space-y-1.5">
                    <span className="text-xs font-extrabold text-indigo-700 tracking-wider uppercase block">
                      📚 Pilih Mata Pelajaran
                    </span>
                    <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                      {[
                        { val: "IPAS", emoji: "🔬", label: "IPAS" },
                        { val: "Matematika", emoji: "➗", label: "Matematika" },
                        { val: "Bahasa Indonesia", emoji: "📖", label: "B. Indonesia" },
                        { val: "Bahasa Inggris", emoji: "🇬🇧", label: "B. Inggris" },
                        { val: "Pendidikan Pancasila", emoji: "🇮🇩", label: "P. Pancasila" },
                        { val: "PAI", emoji: "🕌", label: "PAI" },
                        { val: "PJOK", emoji: "⚽", label: "PJOK" },
                        { val: "Seni Rupa", emoji: "🎨", label: "Seni Rupa" }
                      ].map((item) => (
                        <button
                          key={item.val}
                          onClick={() => setMapelValue(item.val)}
                          className={`border-2 rounded-xl p-2 text-center transition active:scale-95 flex flex-col items-center justify-center font-bold text-[10px] ${
                            mapelValue === item.val
                              ? "border-indigo-600 bg-indigo-50 text-indigo-800 shadow-md transform -translate-y-0.5"
                              : "border-slate-100 bg-slate-50 hover:bg-slate-100 text-slate-600"
                          }`}
                        >
                          <span className="text-xl mb-1">{item.emoji}</span>
                          <span className="leading-tight break-words w-full">{item.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* KELAS & TOPIK INPUT */}
                  <div className="flex gap-3">
                    <div className="w-[38%] space-y-1.5">
                      <span className="text-xs font-extrabold text-indigo-700 tracking-wider uppercase block">
                        🎒 Kelas
                      </span>
                      <select
                        value={kelasSelect}
                        onChange={(e) => setKelasSelect(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border-2 border-indigo-100 focus:outline-none focus:border-indigo-400 font-bold text-slate-700 bg-indigo-50/50 text-xs sm:text-sm"
                      >
                        <option value="Kelas 1 SD">Kelas 1</option>
                        <option value="Kelas 2 SD">Kelas 2</option>
                        <option value="Kelas 3 SD">Kelas 3</option>
                        <option value="Kelas 4 SD">Kelas 4</option>
                        <option value="Kelas 5 SD">Kelas 5</option>
                        <option value="Kelas 6 SD">Kelas 6</option>
                      </select>
                    </div>

                    <div className="flex-1 space-y-1.5">
                      <span className="text-xs font-extrabold text-indigo-700 tracking-wider uppercase block">
                        📝 Topik / Materi
                      </span>
                      <input
                        type="text"
                        value={materiInput}
                        onChange={(e) => setMateriInput(e.target.value)}
                        placeholder="Contoh: Tata Surya, Fotosintesis, dsb"
                        className="w-full px-3 py-2.5 rounded-xl border-2 border-indigo-100 focus:outline-none focus:border-indigo-400 font-bold text-slate-700 bg-indigo-50/50 text-xs sm:text-sm"
                      />
                    </div>
                  </div>

                  {/* DIFFICULTY SELECT */}
                  <div className="space-y-1.5">
                    <span className="text-xs font-extrabold text-indigo-700 tracking-wider uppercase block">
                      🌡️ Tingkat Kesulitan
                    </span>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { diff: "mudah", emoji: "😊", label: "Mudah", color: "border-green-400 bg-green-50/50 text-green-700" },
                        { diff: "sedang", emoji: "🤔", label: "Sedang", color: "border-amber-400 bg-amber-50/50 text-amber-700" },
                        { diff: "sulit", emoji: "🔥", label: "Sulit", color: "border-red-400 bg-red-50/50 text-red-700" },
                        { diff: "campuran", emoji: "🎲", label: "Campur", color: "border-indigo-400 bg-indigo-50/50 text-indigo-700" }
                      ].map((d) => {
                        const isSelected = diffValue === d.diff;
                        return (
                          <button
                            key={d.diff}
                            onClick={() => setDiffValue(d.diff)}
                            className={`border-3 rounded-xl py-2 px-1 text-center transition active:scale-95 flex flex-col items-center ${
                              isSelected
                                ? `${d.color} shadow-lg transform -translate-y-0.5 font-extrabold`
                                : "border-slate-100 hover:bg-slate-50 text-slate-600 font-bold"
                            }`}
                          >
                            <span className="text-2xl">{d.emoji}</span>
                            <span className="text-[11px] mt-1 block">{d.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* BLOOM TAXONOMY checkboxes */}
                  <div className="space-y-1.5">
                    <span className="text-xs font-extrabold text-indigo-700 tracking-wider uppercase block">
                      🎯 Fokus Taksonomi Bloom
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                      {[
                        "C1 (Mengingat)",
                        "C2 (Memahami)",
                        "C3 (Mengaplikasikan)",
                        "C4 (Menganalisis)",
                        "C5 (Mengevaluasi)",
                        "C6 (Mencipta)"
                      ].map((b) => {
                        const checked = selectedBloom.includes(b);
                        return (
                          <label
                            key={b}
                            className={`border-2 rounded-xl p-2 flex items-center gap-2 cursor-pointer transition text-[11px] font-bold ${
                              checked ? "border-indigo-600 bg-indigo-50" : "border-slate-100 bg-white"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => {
                                setSelectedBloom(prev => {
                                  if (prev.includes(b)) {
                                    return prev.filter(x => x !== b);
                                  } else {
                                    return [...prev, b];
                                  }
                                });
                              }}
                              className="accent-indigo-600 w-4 h-4 shrink-0"
                            />
                            <span className="truncate">{b}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* QUESTION LENGTH */}
                  <div className="space-y-1.5">
                    <span className="text-xs font-extrabold text-indigo-700 tracking-wider uppercase block">
                      📏 Panjang Kalimat Soal
                    </span>
                    <div className="flex flex-col gap-2">
                      {[
                        { val: "Pendek (Sederhana dan ringkas, 10-20 kata)", label: "📌 Pendek & Ringkas (10–20 kata)" },
                        { val: "Panjang (Bernarasi dan deskriptif, studi kasus)", label: "📜 Panjang (Cerita & Narasi)" },
                        { val: "Campuran (Kombinasi soal pendek dan panjang)", label: "🔀 Campuran" }
                      ].map((item) => (
                        <label
                          key={item.val}
                          className="flex items-center gap-3 bg-white border-2 border-indigo-50 hover:border-indigo-200 p-3 rounded-xl cursor-pointer transition"
                        >
                          <input
                            type="radio"
                            name="question_length"
                            value={item.val}
                            checked={qLength === item.val}
                            onChange={() => setQLength(item.val)}
                            className="accent-indigo-600 w-4 h-4 shrink-0"
                          />
                          <span className="font-bold text-slate-700 text-xs sm:text-sm">{item.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* QUESTION COUNT BUTTONS */}
                  <div className="space-y-1.5">
                    <span className="text-xs font-extrabold text-indigo-700 tracking-wider uppercase block">
                      ⏱️ Jumlah Soal
                    </span>
                    <div className="grid grid-cols-5 gap-1.5">
                      {[10, 15, 20, 25, 30].map((c) => (
                        <button
                          key={c}
                          onClick={() => setQuestionCount(c)}
                          className={`py-2 px-1 rounded-xl font-black text-xs sm:text-sm transition-all shadow-[0_3px_0_#cbd5e1] border-2 active:translate-y-[3px] active:shadow-none ${
                            questionCount === c
                              ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-indigo-700 shadow-[0_3px_0_#4338ca]"
                              : "bg-indigo-50 text-indigo-700 border-indigo-100 hover:bg-indigo-100"
                          }`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* SUBMIT BUTTON */}
                  <button
                    onClick={handleMulaiBermain}
                    className="btn-fun w-full py-4 text-white font-black text-lg sm:text-xl rounded-2xl border-4 border-purple-700 bg-gradient-to-r from-indigo-500 to-purple-600 shadow-[0_8px_0_#4338ca] hover:opacity-95 transition"
                  >
                    🚀 MULAI BERMAIN SOAL!
                  </button>
                </div>
              </div>
            )}

            {/* SCREEN 2: ACTIVE GAME PLAY */}
            {screen === "play" && questions.length > 0 && (
              <div className="animate-pop">
                {/* Banner Header Play */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 text-white">
                  <div className="flex justify-between items-center mb-2.5">
                    <div className="font-black text-xs sm:text-sm flex items-center gap-1.5">
                      <span>Soal</span>
                      <span className="bg-white text-indigo-700 px-3 py-0.5 rounded-full font-black">
                        {currentIdx + 1}
                      </span>
                      <span className="text-purple-200">/</span>
                      <span className="text-purple-100 font-bold">{questions.length}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="bg-amber-400 text-amber-950 font-black text-[11px] sm:text-xs py-1 px-3.5 rounded-full shadow-md border-b-2 border-amber-600 flex items-center gap-1">
                        Skor: <span className="font-extrabold text-amber-900">{Math.round(scorePoints)}</span> ⭐
                      </div>
                      <button
                        onClick={() => {
                          if (confirm("Yakin mau keluar dari pengerjaan kuis kognitif SD ini? Progres bermain akan hilang.")) {
                            handleMainLagi();
                          }
                        }}
                        className="bg-white/20 hover:bg-red-500 hover:text-white rounded-full p-1.5 transition text-purple-100 active:scale-95 border border-white/25"
                        title="Keluar"
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  {/* Progress tracker bar */}
                  <div className="w-full bg-indigo-900/40 rounded-full h-3 overflow-hidden border border-indigo-700/30">
                    <div
                      className="bg-gradient-to-r from-emerald-400 to-teal-400 h-full rounded-full transition-all duration-300"
                      style={{ width: `${(currentIdx / questions.length) * 100}%` }}
                    ></div>
                  </div>
                </div>

                {/* Question Info bar */}
                <div className="p-4 bg-slate-50 border-b border-slate-100 flex flex-wrap gap-1.5">
                  <span className="bg-indigo-100 text-indigo-800 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border border-indigo-200">
                    {mapelValue}
                  </span>
                  <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                    questions[currentIdx].type === "pg_kompleks"
                      ? "bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200"
                      : questions[currentIdx].type === "benar_salah"
                      ? "bg-sky-100 text-sky-800 border-sky-200"
                      : "bg-amber-100 text-amber-800 border-amber-200"
                  }`}>
                    {questions[currentIdx].type === "pg_kompleks" ? "Pilihan Ganda Kompleks" : questions[currentIdx].type === "benar_salah" ? "Benar / Salah" : "PG Biasa"}
                  </span>
                  <span className="bg-purple-100 text-purple-800 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-purple-200 ml-auto">
                    💡 {questions[currentIdx].bloomLevel || "C4"}
                  </span>
                </div>

                <div className="p-4 sm:p-5 space-y-4">
                  {/* SVG ILLUSTRATION FIELD */}
                  {questions[currentIdx].imageSvg && (
                    <div className="rounded-2xl border-2 border-indigo-100 bg-indigo-50/50 p-2 overflow-hidden flex flex-col items-center">
                      <div
                        className="w-full flex justify-center max-h-[200px]"
                        dangerouslySetInnerHTML={{ __html: questions[currentIdx].imageSvg }}
                      />
                      <span className="text-[10px] font-bold text-indigo-600 tracking-wide mt-1.5 select-none">
                        🖼️ Perhatikan gambar di atas!
                      </span>
                    </div>
                  )}

                  {/* QUESTION BOX */}
                  <div className="bg-gradient-to-br from-indigo-50/40 to-pink-50/40 border-2 border-indigo-200/80 p-4 rounded-2xl font-extrabold text-slate-800 text-xs sm:text-sm leading-relaxed overflow-x-auto shadow-inner">
                    {questions[currentIdx].question}
                  </div>

                  {/* ANSWER SCHEMAS */}
                  <div className="space-y-2">
                    {/* 1. PG BIASA */}
                    {questions[currentIdx].type === "pg" && (
                      <div className="space-y-2">
                        {questions[currentIdx].options.map((opt: string, idx: number) => {
                          const optionLabel = ["A", "B", "C", "D"][idx] || "•";
                          const isAnswered = questionStates[currentIdx].answered;
                          const isCorrectChoice = opt === questions[currentIdx].correctAnswer;
                          const isSelectedChoice = opt === pgSelectedOption;

                          let btnStyle = "border-slate-200 hover:bg-slate-50 text-slate-700";
                          let badgeStyle = "bg-slate-200 text-slate-700";

                          if (isAnswered) {
                            if (isCorrectChoice) {
                              btnStyle = "border-emerald-500 bg-emerald-50 text-emerald-800 font-bold";
                              badgeStyle = "bg-emerald-500 text-white";
                            } else if (isSelectedChoice) {
                              btnStyle = "border-rose-500 bg-rose-50 text-rose-800 font-bold";
                              badgeStyle = "bg-rose-500 text-white";
                            } else {
                              btnStyle = "border-slate-100 bg-slate-50/50 text-slate-400 opacity-60";
                              badgeStyle = "bg-slate-200 text-slate-400";
                            }
                          }

                          return (
                            <button
                              key={idx}
                              disabled={isAnswered}
                              onClick={() => handleSelectOptionPG(opt)}
                              className={`w-full text-left p-3 border-2 rounded-xl flex items-center gap-3 transition active:scale-[0.99] ${btnStyle}`}
                            >
                              <span className={`w-6 h-6 shrink-0 rounded-lg flex items-center justify-center font-extrabold text-xs ${badgeStyle}`}>
                                {optionLabel}
                              </span>
                              <span className="text-xs sm:text-sm">{opt}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* 2. PG KOMPLEKS (MULTIPLE ANSWERS) */}
                    {questions[currentIdx].type === "pg_kompleks" && (
                      <div className="space-y-2">
                        {questions[currentIdx].options.map((opt: string, idx: number) => {
                          const isAnswered = questionStates[currentIdx].answered;
                          const isSelected = pgKompleksSelections.has(opt);
                          const correctSet = new Set(questions[currentIdx].correctAnswers || []);
                          const isCorrectOption = correctSet.has(opt);

                          let containerStyle = "border-slate-200 bg-white hover:bg-slate-50 text-slate-700";
                          let checkStyle = isSelected ? "bg-fuchsia-600 border-fuchsia-600" : "border-slate-300 bg-white";

                          if (isAnswered) {
                            if (isCorrectOption) {
                              containerStyle = "border-emerald-500 bg-emerald-50 text-emerald-800 font-bold";
                              checkStyle = "bg-emerald-500 border-emerald-500 text-white";
                            } else if (isSelected) {
                              containerStyle = "border-rose-500 bg-rose-50 text-rose-800 font-bold";
                              checkStyle = "bg-rose-500 border-rose-500 text-white";
                            } else {
                              containerStyle = "border-slate-100 bg-slate-50/50 text-slate-400 opacity-60";
                              checkStyle = "border-slate-200 bg-slate-100 text-slate-300";
                            }
                          } else {
                            if (isSelected) {
                              containerStyle = "border-fuchsia-600 bg-fuchsia-50/50 text-fuchsia-950 font-semibold";
                            }
                          }

                          return (
                            <button
                              key={idx}
                              disabled={isAnswered}
                              onClick={() => handleToggleOptionPGKompleks(opt)}
                              className={`w-full text-left p-3 border-2 rounded-xl flex items-center gap-3 transition ${containerStyle}`}
                            >
                              <div className={`w-5 h-5 shrink-0 rounded-md border-2 flex items-center justify-center transition-colors ${checkStyle}`}>
                                {(isAnswered ? isCorrectOption || isSelected : isSelected) && (
                                  <Check className="w-3.5 h-3.5 stroke-[3] text-white" />
                                )}
                              </div>
                              <span className="text-xs sm:text-sm">{opt}</span>
                            </button>
                          );
                        })}

                        {!questionStates[currentIdx].answered && (
                          <button
                            onClick={handleLockPGKompleks}
                            className="btn-fun w-full py-3 text-white font-extrabold rounded-xl text-xs sm:text-sm bg-gradient-to-r from-fuchsia-600 to-purple-600 border-2 border-fuchsia-700 shadow-[0_4px_0_#701a75]"
                          >
                            🔒 Kunci Jawabanku!
                          </button>
                        )}
                      </div>
                    )}

                    {/* 3. BENAR / SALAH (STATEMENT MATCHING) */}
                    {questions[currentIdx].type === "benar_salah" && (
                      <div className="space-y-3">
                        <div className="overflow-x-auto rounded-xl border-2 border-sky-100">
                          <table className="w-full text-left border-collapse bg-white">
                            <thead className="bg-sky-50 text-sky-900 font-black text-xs">
                              <tr>
                                <th className="p-2.5">Pernyataan</th>
                                <th className="p-2.5 text-center w-16">Benar ✅</th>
                                <th className="p-2.5 text-center w-16">Salah ❌</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-xs sm:text-sm font-semibold">
                              {questions[currentIdx].statements.map((stmt: any, idx: number) => {
                                const isAnswered = questionStates[currentIdx].answered;
                                const userAns = bsSelections[idx];
                                const isCorrectPernyataan = userAns === stmt.answer;

                                let rowBg = "";
                                if (isAnswered) {
                                  rowBg = isCorrectPernyataan ? "bg-emerald-50/60" : "bg-rose-50/60";
                                }

                                return (
                                  <tr key={idx} className={`transition-colors ${rowBg}`}>
                                    <td className="p-2.5 text-slate-700 leading-normal">{stmt.text}</td>
                                    <td className="p-2.5 text-center">
                                      <input
                                        type="radio"
                                        name={`stmt_${currentIdx}_${idx}`}
                                        disabled={isAnswered}
                                        checked={userAns === "Benar"}
                                        onChange={() => handleSelectBS(idx, "Benar")}
                                        className="w-4.5 h-4.5 accent-indigo-600 cursor-pointer"
                                      />
                                    </td>
                                    <td className="p-2.5 text-center">
                                      <input
                                        type="radio"
                                        name={`stmt_${currentIdx}_${idx}`}
                                        disabled={isAnswered}
                                        checked={userAns === "Salah"}
                                        onChange={() => handleSelectBS(idx, "Salah")}
                                        className="w-4.5 h-4.5 accent-indigo-600 cursor-pointer"
                                      />
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>

                        {!questionStates[currentIdx].answered && (
                          <button
                            onClick={handleLockBenarSalah}
                            className="btn-fun w-full py-3 text-white font-extrabold rounded-xl text-xs sm:text-sm bg-gradient-to-r from-sky-600 to-indigo-600 border-2 border-sky-700 shadow-[0_4px_0_#0369a1]"
                          >
                            🔒 Kunci Jawabanku!
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* FEEDBACK & PEMBAHASAN PANEL */}
                  {questionStates[currentIdx].answered && (
                    <div className={`rounded-xl p-4 border-2 transition animate-pop ${
                      questionStates[currentIdx].isCorrect
                        ? "border-emerald-400 bg-emerald-50/50"
                        : "border-rose-400 bg-rose-50/50"
                    }`}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">
                          {questionStates[currentIdx].isCorrect ? "🎉" : "💡"}
                        </span>
                        <h4 className={`text-sm sm:text-base font-black ${
                          questionStates[currentIdx].isCorrect ? "text-emerald-800" : "text-rose-800"
                        }`}>
                          {questionStates[currentIdx].isCorrect ? "Luar Biasa! Benar!" : "Hampir Benar! Yuk pelajari!"}
                        </h4>
                      </div>
                      <div className="space-y-1">
                        <div className="font-extrabold text-slate-800 text-[10px] uppercase tracking-wider">
                          📖 PEMBAHASAN:
                        </div>
                        <div className="bg-white/85 p-3 rounded-lg border border-slate-200 text-xs sm:text-sm text-slate-700 leading-relaxed font-semibold overflow-x-auto">
                          {questions[currentIdx].explanation}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* BOTTOM PLAY NAVIGATION */}
                  <div className="flex gap-1.5 pt-2">
                    <button
                      disabled={currentIdx === 0}
                      onClick={handlePrevQuestion}
                      className={`btn-fun py-1.5 px-2.5 rounded-lg border-2 border-slate-300 font-black text-[9px] sm:text-[11px] ${
                        currentIdx === 0
                          ? "opacity-40 cursor-not-allowed bg-slate-100 text-slate-400"
                          : "bg-slate-50 hover:bg-slate-100 text-slate-700 shadow-sm"
                      }`}
                    >
                      ⬅️ Sebelumnya
                    </button>

                    <button
                      onClick={handleAskTutorAI}
                      className="btn-fun flex-1 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold rounded-lg border-2 border-indigo-200 text-[9px] sm:text-[11px] flex items-center justify-center gap-1 shadow-sm"
                    >
                      🤖 Petunjuk AI
                    </button>

                    <button
                      disabled={!questionStates[currentIdx].answered}
                      onClick={handleNextQuestion}
                      className={`btn-fun py-1.5 px-2.5 sm:px-3.5 rounded-lg border-2 border-indigo-700 text-white font-extrabold text-[9px] sm:text-[11px] shadow-sm flex items-center gap-1 ${
                        !questionStates[currentIdx].answered
                          ? "opacity-50 cursor-not-allowed bg-slate-300 border-slate-400 shadow-none text-slate-500"
                          : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-95"
                      }`}
                    >
                      <span>
                        {currentIdx === questions.length - 1 ? "Lihat Hasil 🏁" : "Berikutnya ➡️"}
                      </span>
                    </button>
                  </div>

                  {/* ACTIVE NAVIGATION DOTS GRID - AT TOP ON MOBILE / DESKTOP ALIGNED */}
                  <div className="border-t border-slate-100 pt-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase text-indigo-800 tracking-wider flex items-center gap-1">
                        🧭 PETA NAVIGATOR SOAL:
                      </span>
                      <span className="bg-slate-100 text-slate-500 font-black text-[9px] py-0.5 px-2 rounded-full">
                        {questions.length} Soal
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {questions.map((_, idx) => {
                        const st = questionStates[idx];
                        const isCurrent = idx === currentIdx;

                        let pillClass = "border-slate-200 bg-white text-slate-600 hover:bg-slate-50";
                        if (isCurrent) {
                          pillClass = "ring-2 ring-indigo-600 ring-offset-1 scale-105 font-black border-indigo-500 bg-indigo-50 text-indigo-800";
                        } else if (st && st.answered) {
                          pillClass = st.isCorrect
                            ? "bg-emerald-500 border-emerald-600 text-white font-bold"
                            : "bg-rose-500 border-rose-600 text-white font-bold";
                        }

                        return (
                          <button
                            key={idx}
                            onClick={() => {
                              // Restore or jump
                              setCurrentIdx(idx);
                              const targetState = questionStates[idx];
                              if (targetState && targetState.answered) {
                                const qData = questions[idx];
                                if (qData.type === "pg") {
                                  setPgSelectedOption(targetState.selections);
                                } else if (qData.type === "pg_kompleks") {
                                  setPgKompleksSelections(new Set(targetState.selections));
                                } else if (qData.type === "benar_salah") {
                                  setBsSelections(targetState.selections || {});
                                }
                              } else {
                                setPgSelectedOption(null);
                                setPgKompleksSelections(new Set());
                                setBsSelections({});
                              }
                            }}
                            className={`w-6 h-6 rounded-md border text-[10px] flex items-center justify-center font-bold transition active:scale-90 ${pillClass}`}
                          >
                            {idx + 1}
                          </button>
                        );
                      })}
                    </div>

                    {/* Indicators */}
                    <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[10px] text-slate-400 font-bold">
                      <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 bg-emerald-500 border border-emerald-600 rounded"></span>
                        <span>Benar</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 bg-rose-500 border border-rose-600 rounded"></span>
                        <span>Salah</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 bg-white border border-slate-200 rounded"></span>
                        <span>Belum Dijawab</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SCREEN 3: END OF THE GAME REPORT */}
            {screen === "result" && (
              <div className="animate-pop p-6 flex flex-col items-center text-center space-y-5">
                <div className="text-8xl animate-bounce-in select-none">
                  {scorePoints >= 90 ? "🏆" : scorePoints >= 70 ? "🥇" : scorePoints >= 50 ? "🥈" : "💪"}
                </div>

                <div className="space-y-1.5">
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-800">
                    Misi Selesai! 🎊
                  </h2>
                  <p className="text-purple-700 font-black text-sm max-w-xs mx-auto">
                    {scorePoints >= 90
                      ? "SEMPURNA! Kamu luar biasa jenius! 🎉🏆"
                      : scorePoints >= 70
                      ? "HEBAT! Hasil belajar yang spektakuler! ✨"
                      : "Bagus! Terus tingkatkan kemampuan belajarmu ya! 👍"}
                  </p>
                </div>

                <div className="w-full rounded-2xl p-5 border-3 border-indigo-200 bg-indigo-50/50 space-y-1.5">
                  <span className="text-xs font-black text-indigo-900 block">SKOR KAMU:</span>
                  <span className="font-black text-indigo-700 leading-none text-5xl sm:text-6xl block">
                    {Math.round(scorePoints)}
                  </span>
                  <span className="text-[11px] text-indigo-800 font-extrabold block">
                    Menjawab benar {rightAnswersCount} dari {questions.length} soal
                  </span>
                </div>

                {/* API PROVIDER CARD */}
                <div className="text-[10px] text-slate-500 font-bold bg-slate-50 border border-slate-200 rounded-xl px-4 py-2">
                  Teknologi Lab: {lastUsedProvider}
                </div>

                <button
                  onClick={handleMainLagi}
                  className="btn-fun px-8 py-3.5 text-white font-black rounded-2xl text-base sm:text-lg border-4 border-purple-700 bg-gradient-to-r from-indigo-500 to-purple-600 shadow-[0_6px_0_#4338ca]"
                >
                  🔄 Main Lagi!
                </button>
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 2: GENERATOR MATERI ================= */}
        {activeTab === "materi" && (
          <div className="animate-pop">
            
            {/* Banner Header Materi */}
            <div className="bg-gradient-to-r from-purple-600 to-pink-500 p-5 text-white">
              <h3 className="font-black text-lg">Pelajari Materinya Dulu! 📖</h3>
              <p className="text-purple-100 text-xs font-semibold">
                AI siap menjelaskan dengan seru & mudah dimengerti 🌟
              </p>
            </div>

            <div className="p-5 space-y-5">
              
              {/* API keys notice */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 text-center font-bold">
                ⚙️ Pengaturan Kunci API dapat diakses di tab "Generator Soal"
              </div>

              {/* MATERI MAPEL */}
              <div className="space-y-1.5">
                <span className="text-xs font-extrabold text-purple-700 tracking-wider uppercase block">
                  📚 Pilih Mata Pelajaran
                </span>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                  {[
                    { val: "IPAS", emoji: "🔬", label: "IPAS" },
                    { val: "Matematika", emoji: "➗", label: "Matematika" },
                    { val: "Bahasa Indonesia", emoji: "📖", label: "B. Indonesia" },
                    { val: "Bahasa Inggris", emoji: "🇬🇧", label: "B. Inggris" },
                    { val: "Pendidikan Pancasila", emoji: "🇮🇩", label: "P. Pancasila" },
                    { val: "PAI", emoji: "🕌", label: "PAI" },
                    { val: "PJOK", emoji: "⚽", label: "PJOK" },
                    { val: "Seni Rupa", emoji: "🎨", label: "Seni Rupa" }
                  ].map((item) => (
                    <button
                      key={item.val}
                      onClick={() => setMateriMapel(item.val)}
                      className={`border-2 rounded-xl p-2 text-center transition active:scale-95 flex flex-col items-center justify-center font-bold text-[10px] ${
                        materiMapel === item.val
                          ? "border-purple-600 bg-purple-50 text-purple-800 shadow-md transform -translate-y-0.5"
                          : "border-slate-100 bg-slate-50 hover:bg-slate-100 text-slate-600"
                      }`}
                    >
                      <span className="text-xl mb-1">{item.emoji}</span>
                      <span className="leading-tight break-words w-full">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* MATERI KELAS & TOPIK INPUT */}
              <div className="flex gap-3">
                <div className="w-[38%] space-y-1.5">
                  <span className="text-xs font-extrabold text-purple-700 tracking-wider uppercase block">
                    🎒 Kelas
                  </span>
                  <select
                    value={materiKelas}
                    onChange={(e) => setMateriKelas(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border-2 border-purple-100 focus:outline-none focus:border-purple-400 font-bold text-slate-700 bg-purple-50/50 text-xs sm:text-sm"
                  >
                    <option value="Kelas 1 SD">Kelas 1</option>
                    <option value="Kelas 2 SD">Kelas 2</option>
                    <option value="Kelas 3 SD">Kelas 3</option>
                    <option value="Kelas 4 SD">Kelas 4</option>
                    <option value="Kelas 5 SD">Kelas 5</option>
                    <option value="Kelas 6 SD">Kelas 6</option>
                  </select>
                </div>

                <div className="flex-1 space-y-1.5">
                  <span className="text-xs font-extrabold text-purple-700 tracking-wider uppercase block">
                    📝 Topik / Materi
                  </span>
                  <input
                    type="text"
                    value={materiTopik}
                    onChange={(e) => setMateriTopik(e.target.value)}
                    placeholder="Contoh: Tata Surya, Fotosintesis, Pecahan, dsb"
                    className="w-full px-3 py-2.5 rounded-xl border-2 border-purple-100 focus:outline-none focus:border-purple-400 font-bold text-slate-700 bg-purple-50/50 text-xs sm:text-sm"
                  />
                </div>
              </div>

              {/* TOPIK CEPAT (FAST CHIPS) */}
              <div className="space-y-1.5">
                <span className="text-xs font-extrabold text-purple-700 tracking-wider uppercase block">
                  ⚡ Topik Pintar Cepat
                </span>
                <div className="flex flex-wrap gap-2">
                  {(materiMapel === "IPAS"
                    ? ["🪐 Tata Surya", "🌿 Fotosintesis", "💧 Siklus Air", "🧲 Magnet", "🦁 Rantai Makanan", "🌋 Gunung Berapi", "💊 Organ Tubuh"]
                    : materiMapel === "Matematika"
                    ? ["½ Pecahan", "✖️ Perkalian", "➕ Penjumlahan", "📐 Bangun Datar", "📦 Bangun Ruang", "📊 Grafik", "🔢 Bilangan Bulat"]
                    : materiMapel === "Bahasa Indonesia"
                    ? ["📜 Pantun", "📝 Paragraf", "📖 Cerita Rakyat", "✉️ Surat", "🗣️ Pidato", "🔤 EYD", "💬 Dialog"]
                    : materiMapel === "Bahasa Inggris"
                    ? ["👋 Greeting", "🏠 My House", "🐾 Animals", "🎨 Colors", "🍎 Food", "🕐 Time", "👨‍👩‍👧 Family"]
                    : materiMapel === "Pendidikan Pancasila"
                    ? ["🦅 Pancasila", "🗳️ Pemilihan", "🤝 Gotong Royong", "⚖️ Hak Kewajiban", "🏛️ Norma", "🌏 Keragaman"]
                    : materiMapel === "PAI"
                    ? ["🕌 Sholat", "📖 Al-Quran", "🤲 Doa Harian", "😊 Akhlak Mulia", "🕋 Rukun Islam", "🌙 Ramadan"]
                    : materiMapel === "PJOK"
                    ? ["⚽ Sepak Bola", "🏃 Atletik", "🏊 Renang", "🤸 Senam", "🏀 Basket", "🎯 Hidup Sehat"]
                    : ["🖌️ Melukis", "✏️ Menggambar", "🎭 Batik", "🗿 Patung", "🎨 Warna", "🏺 Kerajinan"]
                  ).map((chip) => {
                    const cleanChipText = chip.replace(/^[^\s]+\s/, "");
                    const isSelected = materiTopik === cleanChipText;
                    return (
                      <button
                        key={chip}
                        onClick={() => setMateriTopik(cleanChipText)}
                        className={`text-[11px] font-bold py-1.5 px-3.5 rounded-xl border transition active:scale-95 ${
                          isSelected
                            ? "bg-gradient-to-r from-purple-600 to-pink-500 text-white border-purple-600 shadow-md transform -translate-y-0.5"
                            : "bg-purple-50 text-purple-700 border-purple-100 hover:bg-purple-100"
                        }`}
                      >
                        {chip}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* EXPLANATION GAYA BELAJAR */}
              <div className="space-y-1.5">
                <span className="text-xs font-extrabold text-purple-700 tracking-wider uppercase block">
                  🎨 Gaya Penjelasan Guru AI
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { mode: "cerita", emoji: "📖", label: "Cerita Seru" },
                    { mode: "poin", emoji: "📋", label: "Poin-Poin" },
                    { mode: "analogi", emoji: "💡", label: "Analogi Lucu" },
                    { mode: "tanya", emoji: "🙋", label: "Tanya-Jawab" }
                  ].map((m) => {
                    const isSelected = materiMode === m.mode;
                    return (
                      <button
                        key={m.mode}
                        onClick={() => setMateriMode(m.mode)}
                        className={`border-3 rounded-xl py-2.5 px-1 text-center transition active:scale-95 flex flex-col items-center ${
                          isSelected
                            ? "border-purple-600 bg-purple-50 text-purple-800 shadow-lg transform -translate-y-0.5 font-extrabold"
                            : "border-slate-100 bg-white hover:bg-slate-50 text-slate-500 font-bold"
                        }`}
                      >
                        <span className="text-2xl mb-1">{m.emoji}</span>
                        <span className="text-xs">{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* GENERATE BUTTON */}
              <button
                onClick={handleGenerateMateri}
                disabled={materiLoading}
                className="btn-fun w-full py-4 text-white font-black text-lg sm:text-xl rounded-2xl border-4 border-pink-700 bg-gradient-to-r from-purple-600 to-pink-500 shadow-[0_8px_0_#9d174d] hover:opacity-95 transition"
              >
                ✨ BUAT MATERI SEKARANG!
              </button>

              {/* LOADING LESSON AREA */}
              {materiLoading && (
                <div className="bg-slate-50 border border-slate-150 rounded-2xl p-6 flex flex-col items-center space-y-3.5 text-center">
                  <div className="rounded-full h-12 w-12 border-4 border-purple-200 border-t-purple-600 animate-spin"></div>
                  <h4 className="text-purple-800 font-black text-sm sm:text-base">AI sedang menyiapkan materi...</h4>
                  <div className="flex gap-2 text-lg text-purple-400 select-none animate-pulse">
                    <span>✨</span><span>🎓</span><span>✨</span>
                  </div>
                  <div className="text-xs text-slate-500 font-medium leading-relaxed bg-white border border-slate-200 rounded-xl px-4 py-2.5 max-w-xs shadow-sm">
                    {currentTip}
                  </div>
                </div>
              )}

              {/* OUTPUT BOX AREA */}
              {!materiLoading && materiOutput && (
                <div className="space-y-3 animate-pop">
                  <div className="flex items-center">
                    <span className="font-black text-purple-800 text-sm sm:text-base flex items-center gap-1">
                      <span>📚</span> Materi Belajarmu:
                    </span>
                    <button
                      onClick={handleCopyMateri}
                      className="ml-auto flex items-center gap-1 text-[11px] font-black bg-purple-100 hover:bg-purple-200 text-purple-700 py-1.5 px-3.5 rounded-xl border border-purple-200 shadow-sm"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Salin</span>
                    </button>
                  </div>

                  <div
                    className="materi-output bg-gradient-to-br from-slate-50 to-indigo-50/50 border-2 border-indigo-100 rounded-2xl p-5 text-xs sm:text-sm leading-relaxed text-slate-800 font-medium overflow-x-auto shadow-inner"
                    dangerouslySetInnerHTML={{ __html: materiOutput }}
                  />

                  <button
                    onClick={handleGenerateMateri}
                    className="btn-fun w-full py-3 bg-purple-50 hover:bg-purple-100 border-2 border-purple-200 text-purple-700 font-black text-xs sm:text-sm rounded-xl transition shadow-sm"
                  >
                    🔄 Buat Ulang Materi
                  </button>
                </div>
              )}

            </div>
          </div>
        )}

      </main>

      {/* FOOTER SYSTEM */}
      <footer className="text-center text-purple-100/80 font-extrabold text-xs my-6 relative z-10 select-none">
        <p>Copyright © 2026 Hairur Rahman</p>
      </footer>

      {/* SYSTEM AI MODAL OVERLAY (TUTOR / ERRORS) */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 relative animate-bounce-in border-4 border-indigo-600 shadow-2xl">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-3.5 right-4 text-slate-400 hover:text-slate-600 text-2xl font-black leading-none"
            >
              &times;
            </button>

            <div className="flex items-center gap-2.5 mb-4 border-b border-slate-50 pb-3">
              <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-xl border border-indigo-200">
                {modalTitle.includes("Tutor") ? "🤖" : "💡"}
              </div>
              <h3 className="text-lg font-black text-indigo-900">
                {modalTitle}
              </h3>
            </div>

            {modalIsLoading ? (
              <div className="flex flex-col items-center py-6 space-y-4">
                <div className="rounded-full h-10 w-10 border-4 border-indigo-100 border-t-indigo-600 animate-spin"></div>
                <p className="text-indigo-800 font-extrabold text-xs sm:text-sm text-center animate-pulse">
                  {modalLoadingText}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 max-h-60 overflow-y-auto text-slate-700 font-bold text-xs sm:text-sm leading-relaxed">
                  {modalResponseText.split("\n").map((line, i) => (
                    <p key={i} className="mb-2 last:mb-0">
                      {line}
                    </p>
                  ))}
                </div>
                
                <button
                  onClick={() => setModalOpen(false)}
                  className="btn-fun w-full py-3 text-white font-extrabold rounded-xl text-xs sm:text-sm border-2 border-indigo-700 bg-gradient-to-r from-indigo-600 to-purple-600 shadow-[0_4px_0_#4338ca]"
                >
                  Aku Mengerti! 👍
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
