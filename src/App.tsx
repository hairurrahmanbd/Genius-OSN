import React, { useState } from "react";
import SetupPage from "./components/SetupPage";
import LoadingPage from "./components/LoadingPage";
import QuizPage from "./components/QuizPage";
import ResultPage from "./components/ResultPage";
import { Question, QuizConfig, QuizStage, UserAnswer } from "./types";
import { AlertTriangle, RefreshCw, Undo2, Award } from "lucide-react";

export default function App() {
  const [stage, setStage] = useState<QuizStage>("setup");
  const [sessionConfig, setSessionConfig] = useState<QuizConfig | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [savedUserApiKeys, setSavedUserApiKeys] = useState<string[]>([]);
  const [showExitConfirm, setShowExitConfirm] = useState<boolean>(false);

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
      {stage === "setup" && (
        <SetupPage onStartQuiz={handleStartQuiz} />
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
