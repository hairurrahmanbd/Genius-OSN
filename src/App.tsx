import React, { useState, useEffect } from "react";
import SetupPage from "./components/SetupPage";
import LoadingPage from "./components/LoadingPage";
import QuizPage from "./components/QuizPage";
import ResultPage from "./components/ResultPage";
import BermainDenganSoal from "./components/BermainDenganSoal";
import { Question, QuizConfig, QuizStage, UserAnswer } from "./types";
import { AlertTriangle, RefreshCw, Undo2, Award, Sparkles, BrainCircuit, Gamepad2, GraduationCap, Settings, Key, ShieldCheck } from "lucide-react";

export default function App() {
  const [stage, setStage] = useState<QuizStage>("landing");
  const [sessionConfig, setSessionConfig] = useState<QuizConfig | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [savedUserApiKeys, setSavedUserApiKeys] = useState<string[]>([]);
  const [showExitConfirm, setShowExitConfirm] = useState<boolean>(false);

  // Unified Gemini API Keys state loaded from potential previous locations
  const [key1, setKey1] = useState<string>(() => localStorage.getItem("gemini_api_key_1") || localStorage.getItem("genius_osn_key_1") || localStorage.getItem("bermain_gemini_key_1") || "");
  const [key2, setKey2] = useState<string>(() => localStorage.getItem("gemini_api_key_2") || localStorage.getItem("genius_osn_key_2") || localStorage.getItem("bermain_gemini_key_2") || "");
  const [key3, setKey3] = useState<string>(() => localStorage.getItem("gemini_api_key_3") || localStorage.getItem("genius_osn_key_3") || localStorage.getItem("bermain_gemini_key_3") || "");
  const [showLandingKeyConfig, setShowLandingKeyConfig] = useState<boolean>(false);

  // Sync state modifications to all possible local storage slots for compatibility
  useEffect(() => {
    localStorage.setItem("gemini_api_key_1", key1);
    localStorage.setItem("genius_osn_key_1", key1);
    localStorage.setItem("bermain_gemini_key_1", key1);
  }, [key1]);

  useEffect(() => {
    localStorage.setItem("gemini_api_key_2", key2);
    localStorage.setItem("genius_osn_key_2", key2);
    localStorage.setItem("bermain_gemini_key_2", key2);
  }, [key2]);

  useEffect(() => {
    localStorage.setItem("gemini_api_key_3", key3);
    localStorage.setItem("genius_osn_key_3", key3);
    localStorage.setItem("bermain_gemini_key_3", key3);
  }, [key3]);

  const handleStartQuiz = async (config: QuizConfig, apiKeys: string[]) => {
    setSessionConfig(config);
    setSavedUserApiKeys(apiKeys);
    setStage("loading");
    setLoadingError(null);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: config.subject,
          topics: config.topics,
          count: config.count,
          difficulty: config.difficulty,
          approach: config.approach,
          userApiKeys: apiKeys
        })
      });

      let data: any = {};
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const textError = await response.text();
        console.error("Non-JSON response from server:", textError);
        throw new Error(`Sinyal ke server laboratorium terganggu (HTTP ${response.status}). Hubungi bimbingan teknis SDN Bindang 2.`);
      }

      if (!response.ok) {
        throw new Error(data.error || "Gagal menghubungi laboratorium sains Gemini.");
      }

      if (!data.questions || !Array.isArray(data.questions) || data.questions.length === 0) {
        throw new Error("Respon formulasi soal dari AI kosong. Silakan coba lagi!");
      }

      setQuestions(data.questions);
      setStage("quiz");
    } catch (err: any) {
      console.error(err);
      setLoadingError(err.message || "Terjadi kendala jaringan saat meramu soal OSN.");
    }
  };

  const handleExitQuiz = () => {
    setShowExitConfirm(true);
  };

  const confirmExitQuiz = () => {
    setShowExitConfirm(false);
    setStage("setup");
    setSessionConfig(null);
    setQuestions([]);
    setUserAnswers([]);
  };

  const handleFinishQuiz = (finalAnswers: UserAnswer[]) => {
    setUserAnswers(finalAnswers);
    setStage("result");
  };

  const handleRestart = () => {
    setStage("setup");
    setSessionConfig(null);
    setQuestions([]);
    setUserAnswers([]);
    setLoadingError(null);
  };

  return (
    <div className="min-h-screen pb-12 w-full flex flex-col justify-start relative select-text">
      
      {/* Dynamic Main Stage View routing */}
      {stage === "landing" && (
        <div className="max-w-5xl mx-auto px-4 py-12 space-y-12 animate-fade-in relative z-10 w-full flex flex-col items-center">
          
          {/* Animated decorative bubble background for landing */}
          <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-30">
            <div className="absolute top-10 left-10 w-28 h-28 rounded-full bg-blue-100 animate-bubble-slow-1 filter blur-sm"></div>
            <div className="absolute top-1/2 right-10 w-36 h-36 rounded-full bg-purple-100 animate-bubble-slow-2 filter blur-sm"></div>
            <div className="absolute bottom-10 left-1/3 w-20 h-20 rounded-full bg-emerald-100 animate-bubble-slow-3 filter blur-sm"></div>
          </div>

          {/* Central Portal Header */}
          <div className="text-center space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-150 py-1.5 px-5 rounded-full shadow-sm text-indigo-700 font-bold text-xs">
              <GraduationCap className="w-4 h-4 text-indigo-600" />
              <span>Portal Pendidikan SDN Bindang 2</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-black text-indigo-950 leading-tight">
              Ayo Mulai Petualangan <span className="text-indigo-600">Belajarmu!</span>
            </h1>
            <p className="text-sm sm:text-base text-slate-600 font-medium">
              Pilih portal pembelajaran interaktif di bawah ini untuk mengasah logika sains olimpiade atau bermain dengan materi sekolah yang seru!
            </p>
          </div>

          {/* Unified API Key Management Panel */}
          <div className="w-full max-w-4xl bg-white/95 backdrop-blur-xs rounded-2xl border border-indigo-100 shadow-md overflow-hidden transition-all duration-300 relative z-10">
            <button 
              type="button"
              onClick={() => setShowLandingKeyConfig(!showLandingKeyConfig)}
              className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-slate-50 to-indigo-50/50 hover:from-slate-100 transition duration-200"
            >
              <div className="flex items-center gap-2">
                <span className="p-1 bg-indigo-100 text-indigo-700 rounded-lg">
                  <Settings className="w-4 h-4 animate-spin-slow" />
                </span>
                <span className="text-xs sm:text-sm text-indigo-950 font-black">
                  Pengaturan API Key
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${key1 ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                  {key1 ? "Aktif" : "Belum Diatur"}
                </span>
                <span className="text-indigo-600 font-bold text-xs">{showLandingKeyConfig ? "▲" : "▼"}</span>
              </div>
            </button>

            {showLandingKeyConfig && (
              <div className="p-4 border-t border-indigo-50 space-y-4 bg-slate-50/30">
                {/* 3 Columns Grid for API Keys - Compact & responsive */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  
                  {/* Column 1 */}
                  <div className="bg-white p-3 rounded-xl border border-slate-150 shadow-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-800 flex items-center gap-1">
                        <Key className="w-3.5 h-3.5 text-indigo-500" /> Key Utama (Key 1)
                      </span>
                      <span className={`w-2 h-2 rounded-full ${key1 ? "bg-emerald-500 animate-pulse" : "bg-slate-300"}`}></span>
                    </div>
                    <input 
                      type="password"
                      value={key1}
                      onChange={(e) => setKey1(e.target.value.trim())}
                      placeholder="AIzaSy... (Utama)"
                      className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                    />
                  </div>

                  {/* Column 2 */}
                  <div className="bg-white p-3 rounded-xl border border-slate-150 shadow-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-800 flex items-center gap-1">
                        <Key className="w-3.5 h-3.5 text-amber-500" /> Cadangan 1 (Key 2)
                      </span>
                      <span className={`w-2 h-2 rounded-full ${key2 ? "bg-amber-500" : "bg-slate-300"}`}></span>
                    </div>
                    <input 
                      type="password"
                      value={key2}
                      onChange={(e) => setKey2(e.target.value.trim())}
                      placeholder="AIzaSy... (Cadangan 1)"
                      className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                    />
                  </div>

                  {/* Column 3 */}
                  <div className="bg-white p-3 rounded-xl border border-slate-150 shadow-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-800 flex items-center gap-1">
                        <Key className="w-3.5 h-3.5 text-purple-500" /> Cadangan 2 (Key 3)
                      </span>
                      <span className={`w-2 h-2 rounded-full ${key3 ? "bg-purple-500" : "bg-slate-300"}`}></span>
                    </div>
                    <input 
                      type="password"
                      value={key3}
                      onChange={(e) => setKey3(e.target.value.trim())}
                      placeholder="AIzaSy... (Cadangan 2)"
                      className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                    />
                  </div>

                </div>

                {/* Reset & Status Panel */}
                {(key1 || key2 || key3) && (
                  <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                    <p className="text-[10px] text-slate-400 font-bold">
                      Tersimpan otomatis di browser
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm("Hapus semua Kunci API Gemini yang tersimpan?")) {
                          setKey1("");
                          setKey2("");
                          setKey3("");
                        }
                      }}
                      className="text-[10px] font-black text-rose-600 hover:text-rose-700 transition cursor-pointer bg-rose-50 px-2 py-1 rounded-lg border border-rose-100"
                    >
                      🗑️ Hapus Semua
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Two Navigation Gate Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl pt-4">

            {/* Card 1: Bermain dengan Soal */}
            <div className="bg-white/95 backdrop-blur-xs rounded-[32px] border border-slate-100 p-6 sm:p-8 flex flex-col justify-between hover:shadow-2xl hover:border-purple-100 transition-all duration-300 transform hover:-translate-y-1 group">
              <div className="space-y-5">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl flex items-center justify-center text-white shadow-lg shadow-purple-200">
                  <Gamepad2 className="w-8 h-8 animate-wiggle" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="bg-purple-100 text-purple-800 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full">
                      Anak SD Kelas 1-6
                    </span>
                    <span className="bg-pink-100 text-pink-800 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full">
                      Tutor AI
                    </span>
                  </div>
                  <h2 className="text-2xl font-display font-black text-slate-900 group-hover:text-purple-700 transition-colors">
                    Bermain dengan Soal
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                    Wahana kuis gembira dan asisten belajar interaktif untuk seluruh mata pelajaran SD. Disertai musik ceria, visual menarik, dan pembuat materi instan.
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-50 space-y-2 text-xs text-slate-500 font-bold">
                  <p className="flex items-center gap-2">🎮 <span>Quiz Bervariasi (Pilihan Ganda, Kompleks, Benar/Salah)</span></p>
                  <p className="flex items-center gap-2">📚 <span>Generator Ringkasan Materi Instan dengan Penjelasan Lucu</span></p>
                  <p className="flex items-center gap-2">💡 <span>Dibantu Petunjuk Cerdas Tutor AI dan Sound Effects</span></p>
                </div>
              </div>

              <button
                onClick={() => setStage("bermain")}
                className="w-full mt-6 py-4 bg-gradient-to-r from-purple-600 to-pink-500 text-white font-extrabold text-sm sm:text-base rounded-2xl shadow-lg shadow-purple-100 hover:opacity-95 transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95"
              >
                <span>Main Sekarang!</span>
                <Sparkles className="w-4 h-4 animate-pulse" />
              </button>
            </div>
            
            {/* Card 2: Genius OSN */}
            <div className="bg-white/95 backdrop-blur-xs rounded-[32px] border border-slate-100 p-6 sm:p-8 flex flex-col justify-between hover:shadow-2xl hover:border-indigo-100 transition-all duration-300 transform hover:-translate-y-1 group">
              <div className="space-y-5">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-3xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                  <Award className="w-8 h-8" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="bg-indigo-100 text-indigo-800 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full">
                      Tingkat Nasional
                    </span>
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full">
                      HOTS
                    </span>
                  </div>
                  <h2 className="text-2xl font-display font-black text-slate-900 group-hover:text-indigo-700 transition-colors">
                    Genius OSN
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                    Program simulasi olimpiade kognitif tingkat nasional kelas 6 SD. Dirancang khusus untuk melatih ketajaran nalar, inkuiri, dan pemecahan masalah.
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-50 space-y-2 text-xs text-slate-500 font-bold">
                  <p className="flex items-center gap-2">🧬 <span>Olimpiade IPA (Fisika, Biologi, Kimia Dasar)</span></p>
                  <p className="flex items-center gap-2">📐 <span>Olimpiade Matematika (Geometri, Pola, Kombinatorika)</span></p>
                  <p className="flex items-center gap-2">🌍 <span>Olimpiade IPS (Geografi, Sejarah, Sosiologi, Ekonomi)</span></p>
                </div>
              </div>

              <button
                onClick={() => setStage("setup")}
                className="w-full mt-6 py-4 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-extrabold text-sm sm:text-base rounded-2xl shadow-lg shadow-indigo-100 hover:opacity-95 transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95 animate-pulse"
              >
                <span>Masuk Genius OSN</span>
                <Sparkles className="w-4 h-4 animate-pulse" />
              </button>
            </div>

          </div>

          {/* School branding footer on landing */}
          <footer className="text-center text-slate-400 font-extrabold text-xs pt-8 border-t border-slate-100 w-full select-none">
            Copyright © 2026 Hairur Rahman
          </footer>
        </div>
      )}

      {stage === "setup" && (
        <SetupPage 
          onStartQuiz={handleStartQuiz} 
          onBackToMainMenu={() => setStage("landing")}
          apiKeys={[key1, key2, key3]}
        />
      )}

      {stage === "bermain" && (
        <BermainDenganSoal 
          onBackToMainMenu={() => setStage("landing")} 
          apiKeys={[key1, key2, key3]}
        />
      )}

      {stage === "loading" && !loadingError && (
        <LoadingPage />
      )}

      {/* Handling loading error state */}
      {stage === "loading" && loadingError && (
        <div className="max-w-xl mx-auto px-6 py-16 text-center space-y-8 animate-fade-in my-10 bg-white border border-rose-100 shadow-2xl rounded-3xl relative z-10">
          <div className="mx-auto w-16 h-16 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center text-4xl shadow-sm">
            🚨
          </div>

          <div className="space-y-3">
            <h2 className="text-2xl font-display font-black text-rose-950">
              Ujian Formulasi Gagal
            </h2>
            <p className="text-sm font-semibold text-rose-700 bg-rose-50/50 p-4 rounded-2xl border border-rose-100 leading-relaxed">
              {loadingError}
            </p>
          </div>

          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Pastikan API Key Gemini terhubung dengan benar, atau coba kurangi jumlah kombinasi topik silabus yang dipilih.
          </p>

          <div className="pt-2 flex gap-3 justify-center">
            {sessionConfig && (
              <button
                onClick={() => handleStartQuiz(sessionConfig, savedUserApiKeys)}
                className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-3 px-6 rounded-2xl transition cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Coba Lagi</span>
              </button>
            )}
            <button
              onClick={handleRestart}
              className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-3 px-6 rounded-2xl transition cursor-pointer"
            >
              <Undo2 className="w-4 h-4" />
              <span>Kembali</span>
            </button>
          </div>
        </div>
      )}

      {stage === "quiz" && questions.length > 0 && (
        <QuizPage 
          questions={questions}
          difficulty={sessionConfig?.difficulty || "Sedang"}
          subject={sessionConfig?.subject || "IPA"}
          onExit={handleExitQuiz}
          onFinish={handleFinishQuiz}
          customApiKeys={savedUserApiKeys}
        />
      )}

      {stage === "result" && (
        <ResultPage 
          questions={questions}
          answers={userAnswers}
          onRestart={handleRestart}
        />
      )}

      {/* Custom Confirmation Modal for Exiting */}
      {showExitConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-[9999] animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl p-6 max-w-md w-full space-y-6 text-center">
            <div className="mx-auto w-16 h-16 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center text-4xl shadow-sm">
              ⚠️
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-display font-black text-slate-900">
                Keluar dari Kuis?
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed font-medium">
                Apakah Anda yakin ingin keluar dari pengerjaan kuis kognitif OSN ini? Semua progres latihan Anda akan hilang.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={confirmExitQuiz}
                className="flex-1 py-3 px-4 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-2xl text-xs transition cursor-pointer"
              >
                Ya, Keluar
              </button>
              <button
                type="button"
                onClick={() => setShowExitConfirm(false)}
                className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-xs transition cursor-pointer"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
