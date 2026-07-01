import React, { useState, useEffect } from "react";
import { MOTIVATIONAL_QUOTES } from "../data";
import { Atom, Award } from "lucide-react";

export default function LoadingPage() {
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  // Interval for changing quote
  useEffect(() => {
    const quoteInterval = setInterval(() => {
      setCurrentQuoteIndex(prev => (prev + 1) % MOTIVATIONAL_QUOTES.length);
    }, 4500);

    return () => clearInterval(quoteInterval);
  }, []);

  // Soft progress indicator mock runner during API waiting time
  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 98) return 98; // keep holding below 100 till API responds
        const jump = Math.floor(Math.random() * 8) + 2;
        return Math.min(prev + jump, 98);
      });
    }, 300);

    return () => clearInterval(progressInterval);
  }, []);

  const activeQuote = MOTIVATIONAL_QUOTES[currentQuoteIndex];

  return (
    <div className="max-w-xl mx-auto px-6 py-20 text-center space-y-12 animate-fade-in relative">
      {/* Visual Floating Shapes */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-10 left-10 w-8 h-8 rounded-full bg-blue-100 animate-bounce"></div>
        <div className="absolute bottom-10 right-10 w-12 h-12 rounded-full bg-emerald-100 animate-pulse"></div>
      </div>

      {/* Main loading gear */}
      <div className="space-y-6 relative z-10">
        <div className="relative inline-flex items-center justify-center">
          {/* Animated rings */}
          <div className="absolute w-28 h-28 rounded-full border-4 border-dashed border-indigo-200 animate-spin" style={{ animationDuration: "12s" }}></div>
          <div className="absolute w-24 h-24 rounded-full border-4 border-indigo-100"></div>
          
          <div className="bg-gradient-to-tr from-indigo-500 to-emerald-500 p-5 rounded-full shadow-lg relative">
            <Atom className="w-12 h-12 text-white animate-spin" style={{ animationDuration: "3s" }} />
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-3xl font-display font-black text-indigo-950">
            Menghasilkan Soal Genius OSN
          </h2>
          <p className="text-sm font-semibold text-emerald-600 animate-pulse">
            Gemini AI sedang meramu soal HOTS berkualitas tinggi...
          </p>
        </div>
      </div>

      {/* Modern custom child progress bar */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl space-y-3 relative z-10">
        <div className="flex justify-between items-center text-xs font-bold text-slate-500">
          <span>Menyiapkan Materi Silabus...</span>
          <span>{progress}%</span>
        </div>
        <div className="w-full bg-slate-100 h-4 rounded-full overflow-hidden p-0.5 border border-slate-200">
          <div 
            className="bg-gradient-to-r from-emerald-400 via-teal-500 to-blue-500 h-full rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <p className="text-[10px] text-slate-400 font-medium">
          Menganalisis distraktor logis dan menyusun Trik Olimpiade.
        </p>
      </div>

      {/* Rotating Educational Science trivia / Quotes */}
      <div className="relative z-10 min-h-[140px] flex items-center justify-center px-4">
        <div 
          key={currentQuoteIndex} 
          className="bg-indigo-50/50 border border-indigo-100 rounded-3xl p-6 shadow-sm space-y-4 animate-fade-in text-indigo-950 text-left max-w-lg w-full transition duration-500"
        >
          <div className="flex gap-3 items-start">
            <span className="text-2xl mt-0.5 select-none text-yellow-500">💡</span>
            <div className="space-y-1">
              <span className="text-[10px] tracking-wide uppercase font-extrabold text-indigo-500">
                {activeQuote.author}
              </span>
              <p className="text-sm font-medium leading-relaxed italic text-slate-700">
                "{activeQuote.text}"
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* SDN Bindang 2 floating tag */}
      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center justify-center gap-1">
        <Award className="w-3.5 h-3.5 text-emerald-500" /> SDN Bindang 2 Pamekasan • Menuju Juara OSN
      </div>
    </div>
  );
}
