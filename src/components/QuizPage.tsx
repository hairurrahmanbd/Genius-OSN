import React, { useState, useEffect, useRef } from "react";
import { Question, UserAnswer, ChatMessage } from "../types";
import { callGeminiDirectRest } from "../lib/geminiDirect";
import { 
  Bot, 
  Send, 
  HelpCircle, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle, 
  XCircle, 
  LogOut, 
  Sparkles, 
  ArrowRight,
  RefreshCw,
  Trophy,
  Award,
  Loader
} from "lucide-react";

interface QuizPageProps {
  questions: Question[];
  difficulty: string;
  subject: string;
  onExit: () => void;
  onFinish: (answers: UserAnswer[]) => void;
  customApiKeys: string[];
}

export default function QuizPage({ questions, difficulty, subject, onExit, onFinish, customApiKeys }: QuizPageProps) {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  
  // Track user answers
  const [answers, setAnswers] = useState<UserAnswer[]>(() => {
    return questions.map((_, idx) => ({
      questionIndex: idx,
      selectedOption: null,
      isCorrect: null,
      checked: false
    }));
  });

  // State for slide-up Tutor AI Panel
  const [showTutor, setShowTutor] = useState<boolean>(false);
  const [tutorChats, setTutorChats] = useState<{ [qIndex: number]: ChatMessage[] }>({});
  const [inputMsg, setInputMsg] = useState<string>("");
  const [tutorLoading, setTutorLoading] = useState<boolean>(false);

  const activeQuestion = questions[currentIndex];
  const activeAnswer = answers[currentIndex];
  
  // Scroll chat to bottom helper
  const chatEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [tutorChats, currentIndex, showTutor]);

  // When changing questions, we keep chat history but reset the active chat state to be viewable
  const currentChatHistory = tutorChats[currentIndex] || [
    {
      id: "welcome",
      role: "model",
      text: `Halo Peneliti Cilik! 🌟 Aku adalah Tutor AI OSN ${subject}. Aku siap membimbingmu memahami logika di balik soal ini secara mandiri. Coba ceritakan apa yang membuatmu bingung tentang materi "${activeQuestion.topic}" ini?`
    }
  ];

  const handleSelectOption = (optionIdx: number) => {
    if (activeAnswer.checked) return; // cannot change if checked
    setAnswers(prev => {
      const updated = [...prev];
      updated[currentIndex] = {
        ...updated[currentIndex],
        selectedOption: optionIdx
      };
      return updated;
    });
  };

  const handleCheckAnswer = () => {
    if (activeAnswer.selectedOption === null || activeAnswer.checked) return;
    
    const isCorrect = activeAnswer.selectedOption === activeQuestion.correctIndex;
    setAnswers(prev => {
      const updated = [...prev];
      updated[currentIndex] = {
        ...updated[currentIndex],
        isCorrect,
        checked: true
      };
      return updated;
    });
  };

  // Sent chat to Tutor AI
  const handleSendChat = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputMsg.trim() || tutorLoading) return;

    const userMsg: ChatMessage = {
      id: Math.random().toString(),
      role: "user",
      text: inputMsg
    };

    const updatedHistoryForQ = [...currentChatHistory, userMsg];
    
    setTutorChats(prev => ({
      ...prev,
      [currentIndex]: updatedHistoryForQ
    }));
    setInputMsg("");
    setTutorLoading(true);

    try {
      // 1. Try Express Proxy first
      const response = await fetch("/api/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject,
          question: activeQuestion.question,
          options: activeQuestion.options,
          correctIndex: activeQuestion.correctIndex,
          explanation: activeQuestion.explanation,
          userSelectedAnswer: activeAnswer.selectedOption,
          chatHistory: updatedHistoryForQ.slice(1, -1), // skip welcome & current user msg for API but API gets history
          message: userMsg.text,
          userApiKeys: customApiKeys
        })
      });

      let data: any = {};
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const textError = await response.text();
        console.warn("Express tutor proxy response was not JSON, falling back to direct client call...", textError);
        throw new Error("TRIGGER_CLIENT_FALLBACK");
      }

      if (!response.ok) {
        throw new Error(data.error || "Gagal mendapatkan petunjuk");
      }

      const tutorResponse: ChatMessage = {
        id: Math.random().toString(),
        role: "model",
        text: data.reply
      };

      setTutorChats(prev => ({
        ...prev,
        [currentIndex]: [...updatedHistoryForQ, tutorResponse]
      }));

    } catch (err: any) {
      console.warn("Express proxy for Tutor failed, running client direct call fallback...", err);
      try {
        const contextPrompt = `Kamu adalah Tutor AI OSN ${subject} SD yang bersahabat, sabar, dan menggunakan metode Socratic (tanya jawab pemandu). 
Tugasmu adalah membimbing siswa SD Kelas 6 agar paham konsep mandiri tanpa pernah menyebut jawaban kunci ("A", "B", "C", "D" atau isinya) secara langsung!

SOAL YANG SEDANG DIBAHAS:
- Soal: "${activeQuestion.question}"
- Pilihan Jawaban:
  ${activeQuestion.options.map((opt: string, idx: number) => `Index ${idx}: ${opt}`).join("\n  ")}
- Index Jawaban Benar: ${activeQuestion.correctIndex} (Jawaban yang benar adalah "${activeQuestion.options[activeQuestion.correctIndex]}")
- Penjelasan Ilmiah: "${activeQuestion.explanation}"
- Siswa memilih saat kuis: ${activeAnswer.selectedOption !== null ? `Jawaban ke-${activeAnswer.selectedOption} ("${activeQuestion.options[activeAnswer.selectedOption]}")` : "Belum memilih"}

ATURAN KETAT UNTUK TUTOR:
1. JANGAN PERNAH menyodorkan pilihan yang benar kepada siswa (misal: "Jadi jawabannya B", "Pilih C ya").
2. Jika mereka bertanya langsung jawabannya apa, jawablah dengan bercanda, teka-teki, analogi, atau carikan petunjuk logisnya terlebih dahulu agar siswa yang menebaknya sendiri.
3. Gunakan analogi kehidupan sehari-hari anak-anak (seperti main bola, mengamati semut, membagi makanan, menabung uang, mengamati bintang).
4. Anggap siswa adalah peserta olimpiade cerdas dari SDN Bindang 2 Pamekasan. Semangati mereka dengan kata-kata hangat!
5. Jawab dengan paragraf yang singkat, ramah, gunakan emojis (😊, 🪐, 🧫, 🔍, 📈, 📐) agar tidak membosankan anak-anak.`;

        // Direct call to Gemini REST API
        const result = await callGeminiDirectRest({
          userApiKeys: customApiKeys,
          systemInstruction: contextPrompt,
          prompt: userMsg.text,
          temperature: 0.8,
          // Convert history to direct REST format, skipping the first welcoming instruction card
          chatHistory: updatedHistoryForQ.slice(1, -1).map(h => ({
            role: h.role,
            text: h.text
          }))
        });

        const tutorResponse: ChatMessage = {
          id: Math.random().toString(),
          role: "model",
          text: result.text
        };

        setTutorChats(prev => ({
          ...prev,
          [currentIndex]: [...updatedHistoryForQ, tutorResponse]
        }));
      } catch (fallbackErr: any) {
        console.error("Tutor direct fallback also failed:", fallbackErr);
        const errorMsg: ChatMessage = {
          id: Math.random().toString(),
          role: "model",
          text: ` Waduh maaf, bimbingan Tutor AI sedang mengalami kendala teknis sebentar! 🛰️ (${fallbackErr.message}). Tapi kamu tetap bisa lanjut mengerjakan kuis ya!`
        };
        setTutorChats(prev => ({
          ...prev,
          [currentIndex]: [...updatedHistoryForQ, errorMsg]
        }));
      }
    } finally {
      setTutorLoading(false);
    }
  };

  const goToNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const goToPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const isAllAnswered = answers.every(ans => ans.checked);

  // Counter format: answered questions
  const totalChecked = answers.filter(a => a.checked).length;
  const progressPercent = Math.round((totalChecked / questions.length) * 100);

  // Color mapping index badges in Grid
  const getGridBadgeClass = (idx: number) => {
    const isCurrent = currentIndex === idx;
    const ans = answers[idx];

    let base = "w-10 h-10 rounded-xl font-display font-bold flex items-center justify-center text-sm border-2 transition-all ";
    
    if (isCurrent) {
      base += "ring-4 ring-indigo-200 border-indigo-600 scale-105 ";
    }

    if (!ans.checked) {
      if (ans.selectedOption !== null) {
        base += "bg-yellow-50 text-yellow-700 border-yellow-400";
      } else {
        base += "bg-white text-slate-400 border-slate-200 hover:border-indigo-300";
      }
    } else {
      if (ans.isCorrect) {
        base += "bg-emerald-500 text-white border-emerald-600 shadow-sm shadow-emerald-100";
      } else {
        base += "bg-rose-500 text-white border-rose-600 shadow-sm shadow-rose-100";
      }
    }

    return base;
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 relative">
      
      {/* Top Banner & Header */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-xl p-5 flex flex-wrap items-center justify-between gap-4 mb-6">
        
        <div className="flex items-center gap-3">
          <div className="bg-indigo-50 text-indigo-700 p-2.5 rounded-2xl">
            <Trophy className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="font-display font-extrabold text-indigo-950 text-lg leading-tight md:text-xl">
              Genius OSN {subject}
            </h1>
            <p className="text-xs text-slate-500 font-semibold">
              SDN Bindang 2 Pamekasan
            </p>
          </div>
        </div>

        {/* Progress Bar Center */}
        <div className="flex-1 max-w-xs md:max-w-md hidden sm:block space-y-1.5 px-4 h-fit">
          <div className="flex justify-between items-center text-xs font-bold text-slate-600">
            <span>Kemajuan Belajar</span>
            <span>{totalChecked} / {questions.length} Selesai ({progressPercent}%)</span>
          </div>
          <div className="w-full bg-slate-100 h-3.5 rounded-full overflow-hidden p-0.5 border border-slate-200">
            <div 
              className="bg-gradient-to-r from-emerald-400 via-teal-500 to-indigo-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </div>

        {/* Action Buttons Right */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-extrabold bg-indigo-50 text-indigo-700 py-2 px-3.5 rounded-xl border border-indigo-100">
            {difficulty === "Campur" ? "🎲 Kuis Campur" : `🎯 Level ${difficulty}`}
          </span>
          <button
            onClick={onExit}
            className="flex items-center gap-1.5 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 py-2 px-3.5 rounded-xl border border-rose-100 transition"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Keluar</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Side: Soal Card & Interactive Answers (Main Column) */}
        <div className="lg:col-span-8 space-y-6">

          {/* Navigator Grid map */}
          <div className="lg:hidden bg-white rounded-3xl border border-slate-100 shadow-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-50 pb-3">
              <h3 className="font-display font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                <span>🧭</span> Peta Navigator Soal
              </h3>
              <span className="text-[10px] bg-slate-100 text-slate-500 py-1 px-2 rounded-lg font-bold">
                {questions.length} Soal
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {questions.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={getGridBadgeClass(idx)}
                >
                  {idx + 1}
                </button>
              ))}
            </div>

            {/* Color reference indicators */}
            <div className="pt-2 flex flex-wrap gap-x-4 gap-y-1.5 text-[10px] text-slate-500 font-bold border-t border-slate-50">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 bg-emerald-500 border border-emerald-600 rounded animate-pulse"></span>
                <span>Benar</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 bg-rose-500 border border-rose-600 rounded"></span>
                <span>Belum Tepat</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 bg-yellow-50 border border-yellow-400 rounded"></span>
                <span>Pilihan Dipilih</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 bg-white border border-slate-200 rounded"></span>
                <span>Belum Dijawab</span>
              </div>
            </div>
          </div>
          
          {/* Soal Card */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-xl p-6 md:p-8 space-y-6 relative overflow-hidden">
            
            {/* Topic Tag & Navigator Indicator */}
            <div className="flex flex-wrap items-center justify-between gap-y-2 gap-x-4 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <span className="bg-emerald-100 text-emerald-800 text-xs font-black uppercase px-3 py-1 rounded-full tracking-wide">
                  {activeQuestion.topic}
                </span>
                <span className="text-xs bg-indigo-50 text-indigo-700 font-extrabold px-2.5 py-1 rounded-full">
                  Soal {currentIndex + 1} dari {questions.length}
                </span>
              </div>
              
              {/* Tutor Trigger */}
              <button
                onClick={() => setShowTutor(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 font-bold text-xs bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white rounded-xl shadow-md cursor-pointer transition active:scale-95"
              >
                <Bot className="w-4 h-4 text-emerald-400" />
                <span>Tanya Tutor AI</span>
              </button>
            </div>

            {/* Question Text */}
            <div className="space-y-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pertanyaan OSN</span>
              <div className="p-4 sm:p-5 bg-indigo-50/50 border border-indigo-100 rounded-2xl">
                <p id={`qn-${currentIndex}`} className="text-sm sm:text-base font-bold font-sans text-indigo-950 leading-relaxed">
                  {activeQuestion.question}
                </p>
              </div>
            </div>

            {/* Selection Options Grid */}
            <div className="space-y-3 pt-2">
              {activeQuestion.options.map((opt, optIdx) => {
                const label = String.fromCharCode(65 + optIdx); // A, B, C, D
                const isSelected = activeAnswer.selectedOption === optIdx;
                const isChecked = activeAnswer.checked;
                const isCorrectOption = optIdx === activeQuestion.correctIndex;
                
                // Styling choice button
                let optStyle = "w-full text-left p-4 rounded-2xl border-2 font-semibold transition-all duration-200 flex items-center justify-between ";
                
                if (isChecked) {
                  if (isCorrectOption) {
                    optStyle += "bg-emerald-50 border-emerald-500 text-emerald-950 shadow-sm";
                  } else if (isSelected) {
                    optStyle += "bg-rose-50 border-rose-500 text-rose-950 shadow-sm";
                  } else {
                    optStyle += "bg-slate-50 border-slate-100 text-slate-400 opacity-60";
                  }
                } else {
                  if (isSelected) {
                    optStyle += "bg-indigo-50 border-indigo-600 text-indigo-950 font-bold scale-[1.01] shadow-md shadow-indigo-50";
                  } else {
                    optStyle += "bg-slate-50/50 border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-700";
                  }
                }

                return (
                  <button
                    key={optIdx}
                    id={`opt-${currentIndex}-${optIdx}`}
                    onClick={() => handleSelectOption(optIdx)}
                    disabled={isChecked}
                    className={optStyle}
                  >
                    <div className="flex items-start gap-3">
                      <span className={`w-8 h-8 rounded-xl font-display font-bold text-sm flex items-center justify-center shrink-0 border-2 ${
                        isChecked 
                          ? isCorrectOption 
                            ? "bg-emerald-500 text-white border-emerald-600" 
                            : isSelected ? "bg-rose-500 text-white border-rose-600" : "bg-slate-100 text-slate-400 border-slate-300"
                          : isSelected 
                            ? "bg-indigo-600 text-white border-indigo-700" 
                            : "bg-white text-slate-600 border-slate-200"
                      }`}>
                        {label}
                      </span>
                      <span className="text-sm md:text-base leading-relaxed pt-0.5">{opt}</span>
                    </div>

                    <div className="shrink-0 pl-2">
                      {isChecked && isCorrectOption && (
                        <CheckCircle className="w-6 h-6 text-emerald-600 fill-emerald-50" />
                      )}
                      {isChecked && isSelected && !isCorrectOption && (
                        <XCircle className="w-6 h-6 text-rose-600 fill-rose-50" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Action Bar inside question card */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-100">
              
              {/* Cek Jawaban Button */}
              <div>
                {!activeAnswer.checked ? (
                  <button
                    onClick={handleCheckAnswer}
                    disabled={activeAnswer.selectedOption === null}
                    className={`py-3 px-6 rounded-2xl font-bold text-sm transition shadow-md flex items-center gap-2 ${
                      activeAnswer.selectedOption !== null
                        ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:opacity-95 cursor-pointer"
                        : "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                    }`}
                  >
                    <span>Cek Jawaban</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    {activeAnswer.isCorrect ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-black text-emerald-700 bg-emerald-100 px-3 py-1.5 rounded-xl border border-emerald-200">
                        🎉 Hebat, Jawaban Benar!
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs font-black text-rose-700 bg-rose-100 px-3 py-1.5 rounded-xl border border-rose-200">
                        😅 Belum Tepat, Pelajari Lagi!
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Navigation buttons */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={goToPrev}
                  disabled={currentIndex === 0}
                  className="p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 disabled:opacity-40 transition"
                  title="Sebelumnya"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                
                {currentIndex < questions.length - 1 ? (
                  <button
                    onClick={goToNext}
                    className="p-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl border border-indigo-100 font-bold text-xs flex items-center gap-1"
                  >
                    <span>Lanjut</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => onFinish(answers)}
                    className="py-3 px-5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:opacity-95 text-white font-extrabold text-sm rounded-xl flex items-center gap-1"
                  >
                    <span>Kirim Hasil</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Explanation & Tricks Box (Revealed only if checked) */}
            {activeAnswer.checked && (
              <div className="mt-6 border-t-2 border-dashed border-indigo-100 pt-6 space-y-4 animate-fade-in bg-indigo-50/30 p-5 rounded-2xl">
                
                {/* Pembahasan Ilmiah */}
                <div className="space-y-2">
                  <span className="text-xs uppercase font-extrabold text-indigo-600 tracking-wider flex items-center gap-1">
                    📖 Pembahasan Sains
                  </span>
                  <p className="text-sm text-slate-700 leading-relaxed bg-white p-3.5 rounded-xl border border-indigo-50 shadow-xs">
                    {activeQuestion.explanation}
                  </p>
                </div>

                {/* Trik Olimpiade */}
                <div className="space-y-2">
                  <span className="text-xs uppercase font-extrabold text-yellow-600 tracking-wider flex items-center gap-1">
                    ⚡ Trik Cepat OSN
                  </span>
                  <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-900 leading-relaxed font-semibold">
                    {activeQuestion.trick}
                  </div>
                </div>

              </div>
            )}

          </div>

        </div>

        {/* Right Side: Question Navigator Map (Grid) & Banner Progress */}
        <div className="lg:col-span-4 space-y-6">

          {/* Navigator Grid map - Desktop Only */}
          <div className="hidden lg:block bg-white rounded-3xl border border-slate-100 shadow-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-50 pb-3">
              <h3 className="font-display font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                <span>🧭</span> Peta Navigator Soal
              </h3>
              <span className="text-[10px] bg-slate-100 text-slate-500 py-1 px-2 rounded-lg font-bold">
                {questions.length} Soal
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {questions.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={getGridBadgeClass(idx)}
                >
                  {idx + 1}
                </button>
              ))}
            </div>

            {/* Color reference indicators */}
            <div className="pt-2 flex flex-wrap gap-x-4 gap-y-1.5 text-[10px] text-slate-500 font-bold border-t border-slate-50">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 bg-emerald-500 border border-emerald-600 rounded animate-pulse"></span>
                <span>Benar</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 bg-rose-500 border border-rose-600 rounded"></span>
                <span>Belum Tepat</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 bg-yellow-50 border border-yellow-400 rounded"></span>
                <span>Pilihan Dipilih</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 bg-white border border-slate-200 rounded"></span>
                <span>Belum Dijawab</span>
              </div>
            </div>
          </div>

          {/* Quick Informative Banner */}
          <div className="bg-gradient-to-r from-emerald-500 to-indigo-600 rounded-3xl p-6 text-white space-y-3 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full blur-xl"></div>
            <Award className="w-8 h-8 text-yellow-300 animate-pulse" />
            <div className="space-y-1">
              <h4 className="font-display font-bold text-sm">Misi SDN Bindang 2</h4>
              <p className="text-xs text-emerald-50/90 leading-relaxed">
                Soal ini dirancang melatih nalar kognitif tinggi Anda. Selesaikan semua nomor dan raihlah medali emas tingkat nasional!
              </p>
            </div>
          </div>

        </div>

      </div>

      {/* Slide-Up Tutor AI Chat Panel */}
      {showTutor && (
        <div className="fixed inset-0 z-50 overflow-hidden flex items-end justify-center bg-indigo-950/40 backdrop-blur-xs">
          
          <div className="bg-white rounded-t-3xl border-t border-indigo-100 shadow-2xl max-w-2xl w-full h-[80vh] md:h-[70vh] flex flex-col overflow-hidden animate-slide-up">
            
            {/* Tutor Header */}
            <div className="bg-indigo-900 px-5 py-4 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="bg-emerald-500 p-2 rounded-xl">
                  <Bot className="w-5 h-5 text-indigo-950 animate-bounce" />
                </div>
                <div>
                  <h3 className="font-display font-extrabold text-sm flex items-center gap-1.5">
                    Tutor AI Socratic
                    <span className="bg-indigo-700 text-[9px] uppercase px-2 py-0.5 rounded-full font-sans tracking-wider">
                      Online
                    </span>
                  </h3>
                  <p className="text-[10px] text-emerald-300 font-bold">
                    Materi: {activeQuestion.topic} (Soal {currentIndex + 1})
                  </p>
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setShowTutor(false)}
                className="text-white bg-indigo-850 hover:bg-indigo-800 p-2 rounded-xl transition font-sans text-xs font-bold"
              >
                Sembunyikan
              </button>
            </div>

            {/* Hint Notice */}
            <div className="bg-indigo-50 border-b border-indigo-100 py-2 px-4 text-[10px] lg:text-xs font-semibold text-indigo-950 flex items-center gap-1.5 shrink-0 select-none">
              <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
              <span>Socratic Method: Tutor dilarang memberi jawaban mentah, melainkan memancing logika berpikir sains Anda!</span>
            </div>

            {/* Chat Messages Log */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
              {currentChatHistory.map((chat) => (
                <div
                  key={chat.id}
                  className={`flex ${chat.role === "user" ? "justify-end animate-fade-in" : "justify-start"}`}
                >
                  <div className={`max-w-[85%] flex gap-2.5 items-start ${chat.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                    
                    {/* Avatar icon */}
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs select-none shrink-0 ${
                      chat.role === "user" 
                        ? "bg-indigo-100 text-indigo-700" 
                        : "bg-emerald-500 text-white"
                    }`}>
                      {chat.role === "user" ? "S" : "🤖"}
                    </div>

                    <div className={`p-3.5 rounded-2xl shadow-xs text-xs md:text-sm leading-relaxed ${
                      chat.role === "user"
                        ? "bg-indigo-600 text-white rounded-tr-none"
                        : "bg-white text-indigo-950 border border-slate-100 rounded-tl-none whitespace-pre-wrap"
                    }`}>
                      {chat.text}
                    </div>

                  </div>
                </div>
              ))}

              {/* Loader bot is thinking */}
              {tutorLoading && (
                <div className="flex justify-start">
                  <div className="flex gap-2.5 items-center">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center">
                      <span className="animate-spin text-xs">⏳</span>
                    </div>
                    <div className="bg-white text-slate-400 text-xs px-4 py-2.5 rounded-2xl border border-slate-100 shadow-xs italic flex items-center gap-1">
                      <Loader className="w-3.5 h-3.5 animate-spin" />
                      <span>Sedang merenungkan analogi...</span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Chat Form Area */}
            <form onSubmit={handleSendChat} className="p-3 border-t border-slate-100 bg-white shrink-0">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputMsg}
                  onChange={(e) => setInputMsg(e.target.value)}
                  placeholder="Gunakan logikamu: 'Mengapa magnet menarik besi?'..."
                  className="flex-1 text-xs md:text-sm border border-slate-200 rounded-xl px-4 py-3 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
                <button
                  type="submit"
                  disabled={!inputMsg.trim() || tutorLoading}
                  className={`p-3 rounded-xl transition flex items-center justify-center ${
                    inputMsg.trim() && !tutorLoading
                      ? "bg-indigo-600 text-white hover:bg-indigo-700 cursor-pointer"
                      : "bg-slate-100 text-slate-400 cursor-not-allowed"
                  }`}
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>

          </div>

        </div>
      )}

    </div>
  );
}
