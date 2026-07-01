import React, { useState } from "react";
import { Question, UserAnswer } from "../types";
import { 
  Trophy, 
  RotateCcw, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle2, 
  XCircle, 
  GraduationCap, 
  Flame, 
  Lightbulb, 
  BookOpen,
  X
} from "lucide-react";

interface ResultPageProps {
  questions: Question[];
  answers: UserAnswer[];
  onRestart: () => void;
}

export default function ResultPage({ questions, answers, onRestart }: ResultPageProps) {
  const [showReviewList, setShowReviewList] = useState<boolean>(true);
  const [expandedIndices, setExpandedIndices] = useState<{ [key: number]: boolean }>({ 0: true });

  const totalQuestions = questions.length;
  const correctCount = answers.filter(a => a.checked && a.isCorrect).length;
  const wrongCount = totalQuestions - correctCount;
  const scorePercent = Math.round((correctCount / totalQuestions) * 100);

  // Determine feedback message, stars & emoji based on score percent
  let feedbackEmoji = "🏆";
  let feedbackMessage = "Luar Biasa! Kamu adalah Calon Juara OSN IPA Tingkat Nasional!";
  let bgGradient = "from-emerald-500 to-teal-500";
  let stars = 3;

  if (scorePercent === 100) {
    feedbackEmoji = "👑";
    feedbackMessage = "Sempurna! Nilai 100! Kamu layak mendapatkan Medali Emas IPA Nasional!";
    bgGradient = "from-yellow-400 via-orange-500 to-amber-600";
    stars = 3;
  } else if (scorePercent >= 80) {
    feedbackEmoji = "⭐";
    feedbackMessage = "Sangat Membanggakan! Sedikit lagi menuju kesempurnaan. Terus asah kemampuanmu!";
    bgGradient = "from-blue-500 via-indigo-500 to-emerald-500";
    stars = 3;
  } else if (scorePercent >= 60) {
    feedbackEmoji = "👍";
    feedbackMessage = "Hebat! Pemahaman konsep dasarmu sudah kuat, mari asah variasi materi eksperimen!";
    bgGradient = "from-indigo-400 to-purple-600";
    stars = 2;
  } else {
    feedbackEmoji = "💪";
    feedbackMessage = "Jangan patah semangat! Setiap ilmuwan hebat selalu belajar dari kegagalan.";
    bgGradient = "from-rose-500 to-indigo-600";
    stars = 1;
  }

  const toggleExpand = (idx: number) => {
    setExpandedIndices(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in space-y-8">
      
      {/* Visual Floating Confetti Placeholder */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 opacity-40">
        <div className="absolute top-10 right-10 w-24 h-24 rounded-full bg-yellow-200 animate-bubble-slow-1 filter blur-sm"></div>
        <div className="absolute bottom-20 left-10 w-28 h-28 rounded-full bg-teal-100 animate-bubble-slow-2 filter blur-sm"></div>
      </div>

      {/* Main Score Banner */}
      <div className={`relative z-10 rounded-3xl bg-gradient-to-r ${bgGradient} text-white p-8 md:p-10 shadow-2xl space-y-6 text-center transform hover:scale-[1.01] transition-all duration-350`}>
        <div className="absolute top-4 right-4 bg-white/10 px-4 py-1.5 rounded-full text-xs font-serif font-black flex items-center gap-1">
          <GraduationCap className="w-4 h-4 text-yellow-300" /> SDN BINDANG 2
        </div>

        <div className="font-display font-extrabold text-7xl select-none animate-bounce">
          {feedbackEmoji}
        </div>

        <div className="space-y-2">
          {/* Rating stars display */}
          <div className="flex justify-center gap-1.5 text-2xl text-yellow-300 select-none">
            {Array.from({ length: stars }).map((_, i) => (
              <span key={i} className="animate-pulse">★</span>
            ))}
            {Array.from({ length: 3 - stars }).map((_, i) => (
              <span key={i} className="opacity-30">★</span>
            ))}
          </div>

          <h2 className="text-3xl md:text-4xl font-display font-extrabold tracking-tight">
            Skor Anda: <span className="font-serif bg-white/20 px-4 py-1 rounded-2xl">{scorePercent}%</span>
          </h2>
          <p className="text-sm md:text-base font-semibold max-w-lg mx-auto opacity-95">
            {feedbackMessage}
          </p>
        </div>

        {/* Breakdown Stats Grid */}
        <div className="grid grid-cols-3 gap-3 max-w-md mx-auto pt-4 border-t border-white/20">
          <div className="bg-white/10 p-3 rounded-2xl">
            <span className="block text-xs uppercase font-extrabold tracking-wide opacity-80">Total Soal</span>
            <span className="text-xl font-black">{totalQuestions}</span>
          </div>
          <div className="bg-emerald-500/20 p-3 rounded-2xl border border-emerald-400/20">
            <span className="block text-xs uppercase font-extrabold tracking-wide text-emerald-100">Jawaban Benar</span>
            <span className="text-xl font-black text-emerald-200">{correctCount}</span>
          </div>
          <div className="bg-rose-500/20 p-3 rounded-2xl border border-rose-400/20">
            <span className="block text-xs uppercase font-extrabold tracking-wide text-rose-100">Salah</span>
            <span className="text-xl font-black text-rose-200">{wrongCount}</span>
          </div>
        </div>

        {/* Buttons Action */}
        <div className="pt-4 flex flex-col sm:flex-row justify-center gap-3">
          <button
            onClick={onRestart}
            className="w-full sm:w-auto bg-white text-indigo-950 font-display font-black text-sm tracking-wide px-8 py-3.5 rounded-2xl hover:bg-slate-50 transition shadow-lg shrink-0 flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-indigo-700" />
            Latihan Baru
          </button>
          
          <button
            onClick={() => setShowReviewList(prev => !prev)}
            className="w-full sm:w-auto bg-indigo-900 bg-opacity-40 text-white border border-white/20 font-bold text-xs tracking-wide px-6 py-3.5 rounded-2xl hover:bg-indigo-900 hover:bg-opacity-65 transition shrink-0 flex items-center justify-center gap-2 cursor-pointer"
          >
            <BookOpen className="w-4 h-4" />
            {showReviewList ? "Sembunyikan Pembahasan" : "Lihat Pembahasan Soal"}
          </button>
        </div>

      </div>

      {/* Review Box of Questions */}
      {showReviewList && (
        <div className="space-y-5 relative z-10 animate-fade-in">
          
          <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="font-display font-extrabold text-indigo-950 flex items-center gap-2 text-md">
              <span className="bg-indigo-100 text-indigo-600 p-1 rounded-lg">📋</span>
              Evaluasi & Pembahasan Soal
            </h3>
            <span className="text-xs uppercase font-extrabold text-indigo-500">
              Analisis Detail
            </span>
          </div>

          <div className="space-y-4">
            {questions.map((qn, idx) => {
              const ans = answers[idx];
              const isCorrect = ans?.isCorrect;
              const isExpanded = !!expandedIndices[idx];

              return (
                <div 
                  key={idx} 
                  className={`bg-white rounded-3xl border transition shadow-sm overflow-hidden ${
                    isCorrect 
                      ? "border-emerald-100 hover:border-emerald-300" 
                      : "border-rose-100 hover:border-rose-300"
                  }`}
                >
                  
                  {/* Collapsible header */}
                  <button
                    onClick={() => toggleExpand(idx)}
                    className="w-full text-left p-5 flex items-start justify-between gap-4 transition hover:bg-slate-50"
                  >
                    <div className="flex gap-3 items-start">
                      <div className={`mt-0.5 shrink-0 w-8 h-8 rounded-xl font-display font-extrabold text-sm flex items-center justify-center ${
                        isCorrect 
                          ? "bg-emerald-100 text-emerald-800" 
                          : "bg-rose-100 text-rose-800"
                      }`}>
                        {idx + 1}
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] tracking-wide uppercase font-black text-indigo-500">
                          {qn.topic}
                        </span>
                        <p className="text-sm font-bold text-slate-800 leading-relaxed pr-2">
                          {qn.question}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isCorrect ? (
                        <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-black text-emerald-700 bg-emerald-50 py-1 px-2.5 rounded-lg border border-emerald-100">
                          Benar
                        </span>
                      ) : (
                        <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-black text-rose-700 bg-rose-50 py-1 px-2.5 rounded-lg border border-rose-100">
                          Pelajari Lagi
                        </span>
                      )}
                      
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                  </button>

                  {/* Expanded block content */}
                  {isExpanded && (
                    <div className="border-t border-slate-50 bg-slate-50/50 p-5 space-y-4 text-xs md:text-sm animate-fade-in">
                      
                      {/* Opsi Jawaban Map */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {qn.options.map((opt, optIdx) => {
                          const optionLetter = String.fromCharCode(65 + optIdx);
                          const isCorrectOption = optIdx === qn.correctIndex;
                          const isUserSelected = ans?.selectedOption === optIdx;

                          let badgeStyle = "p-3 rounded-xl border flex items-center justify-between text-xs font-semibold ";
                          if (isCorrectOption) {
                            badgeStyle += "bg-emerald-50 border-emerald-400 text-emerald-950 font-bold";
                          } else if (isUserSelected) {
                            badgeStyle += "bg-rose-50 border-rose-400 text-rose-900";
                          } else {
                            badgeStyle += "bg-white border-slate-150 text-slate-500 opacity-80";
                          }

                          return (
                            <div key={optIdx} className={badgeStyle}>
                              <div className="flex gap-2">
                                <span className={`w-5 h-5 rounded-md font-display font-extrabold flex items-center justify-center border ${
                                  isCorrectOption ? "bg-emerald-500 text-white" : isUserSelected ? "bg-rose-500 text-white" : "bg-slate-100 text-slate-400"
                                }`}>
                                  {optionLetter}
                                </span>
                                <span className="pt-0.5">{opt}</span>
                              </div>
                              <div className="shrink-0 pl-1.5">
                                {isCorrectOption && <span className="text-[9px] uppercase font-bold text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded">Kunci</span>}
                                {isUserSelected && !isCorrectOption && <span className="text-[9px] uppercase font-bold text-rose-600 bg-rose-100 px-1.5 py-0.5 rounded">Dipilih</span>}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Penjelasan */}
                      <div className="space-y-1.5 bg-white p-4 rounded-2xl border border-slate-100 hover:border-indigo-100 transition shadow-xs">
                        <span className="text-xs uppercase font-extrabold text-indigo-600 tracking-wide flex items-center gap-1">
                          <BookOpen className="w-3.5 h-3.5" /> Pembahasan Konseptual
                        </span>
                        <p className="text-slate-600 leading-relaxed text-xs font-medium whitespace-pre-wrap">
                          {qn.explanation}
                        </p>
                      </div>

                      {/* Shortcut Tricks */}
                      <div className="bg-amber-50/50 border border-amber-200 rounded-2xl p-4 space-y-1.5">
                        <span className="text-xs uppercase font-extrabold text-yellow-700 tracking-wide flex items-center gap-1">
                          <Flame className="w-3.5 h-3.5" /> Trik Cepat OSN IPA
                        </span>
                        <p className="text-amber-900 leading-relaxed text-xs font-semibold">
                          {qn.trick}
                        </p>
                      </div>

                    </div>
                  )}

                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* SDN Bindang 2 Footer Motivation */}
      <div className="text-center text-slate-400 py-6 text-xs max-w-md mx-auto space-y-2">
        <p>
          "Sains bukan sekadar kumpulan rumus, melainkan petualangan menyingkap rahasia semesta." 🪐
        </p>
        <p className="font-bold uppercase tracking-widest text-[9px] text-indigo-400">
          SDN Bindang 2 Pamekasan • 2026
        </p>
      </div>

    </div>
  );
}
