import React, { useState, useEffect } from "react";
import { 
  IPA_TOPICS, 
  IPS_TOPICS, 
  MATEMATIKA_TOPICS, 
  DIFFICULTIES, 
  APPROACHES,
  SubjectType
} from "../data";
import { QuizConfig } from "../types";
import { 
  Sparkles, 
  Settings, 
  Key, 
  Check, 
  X, 
  Award, 
  Atom, 
  GraduationCap, 
  CheckSquare, 
  Square,
  HelpCircle,
  ShieldCheck,
  AlertCircle,
  Sliders,
  Globe,
  Plus,
  Home
} from "lucide-react";

interface SetupPageProps {
  onStartQuiz: (config: QuizConfig, apiKeys: string[]) => void;
  onBackToMainMenu?: () => void;
  apiKeys: string[];
}

export default function SetupPage({ onStartQuiz, onBackToMainMenu, apiKeys }: SetupPageProps) {
  // Active subject tab: IPA, IPS, Matematika
  const [activeSubject, setActiveSubject] = useState<SubjectType>("IPA");

  // Config state
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [difficulty, setDifficulty] = useState<string>("Sedang");
  const [approach, setApproach] = useState<string>("Campuran Semua Pendekatan");

  // Filter category state (defaults to the first category of IPA)
  const [activeCategory, setActiveCategory] = useState<string>("Biologi & Ekologi");

  // Reset selected topics and active category when switching subjects
  useEffect(() => {
    setSelectedTopics([]);
    const cats = getCategoriesForSubject(activeSubject);
    if (cats.length > 0) {
      setActiveCategory(cats[0]);
    }
  }, [activeSubject]);

  // Retrieve correct topic list
  const getTopicsBySubject = (subj: SubjectType) => {
    switch (subj) {
      case "IPA": return IPA_TOPICS;
      case "IPS": return IPS_TOPICS;
      case "Matematika": return MATEMATIKA_TOPICS;
    }
  };

  const currentTopics = getTopicsBySubject(activeSubject);

  // Retrieve unique categories for filter tabs (excluding "Semua")
  const getCategoriesForSubject = (subj: SubjectType) => {
    const list = getTopicsBySubject(subj);
    const cats = Array.from(new Set(list.map(t => t.category)));
    return cats;
  };

  const subjectCategories = getCategoriesForSubject(activeSubject);

  // Filtered topics list (No "Semua" option anymore, always filters by activeCategory)
  const filteredTopics = currentTopics.filter(t => t.category === activeCategory);

  // Handle individual topic selection
  const toggleTopic = (topicName: string) => {
    setSelectedTopics(prev => 
      prev.includes(topicName) 
        ? prev.filter(t => t !== topicName) 
        : [...prev, topicName]
    );
  };

  // Select all topics in the current active category
  const selectAll = () => {
    const activeTopicNames = filteredTopics.map(t => t.name);
    setSelectedTopics(prev => {
      const filteredPrev = prev.filter(name => !activeTopicNames.includes(name));
      return [...filteredPrev, ...activeTopicNames];
    });
  };

  // Clear all topics in the current active category
  const clearAll = () => {
    const activeTopicNames = filteredTopics.map(t => t.name);
    setSelectedTopics(prev => prev.filter(name => !activeTopicNames.includes(name)));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedTopics.length === 0) return;
    
    const activeKeys = apiKeys.filter(k => k.trim() !== "");
    if (activeKeys.length === 0) {
      alert("Harap isi minimal satu API Key Gemini terlebih dahulu di halaman utama (Menu Utama)!");
      if (onBackToMainMenu) onBackToMainMenu();
      return;
    }
    
    // Pass the config and the array of 3 API keys
    onStartQuiz({
      subject: activeSubject,
      topics: selectedTopics,
      count: questionCount,
      difficulty,
      approach
    }, activeKeys);
  };

  // Icon mapping for subjects
  const getSubjectIcon = (subj: SubjectType) => {
    switch (subj) {
      case "IPA": return "🧬";
      case "IPS": return "🌍";
      case "Matematika": return "📐";
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 relative">
      {onBackToMainMenu && (
        <button
          type="button"
          onClick={onBackToMainMenu}
          className="absolute top-4 right-4 bg-white/95 hover:bg-slate-50 text-indigo-700 p-2 sm:p-2.5 rounded-full border border-indigo-100 shadow-md cursor-pointer transition-all active:scale-95 z-50 flex items-center justify-center"
          title="Kembali ke Menu Utama"
        >
          <Home className="w-5 h-5" />
        </button>
      )}

      {/* Background Floaters */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 opacity-40">
        <div className="absolute top-20 left-10 w-24 h-24 rounded-full bg-blue-200 animate-bubble-slow-1 filter blur-sm"></div>
        <div className="absolute top-80 right-20 w-32 h-32 rounded-full bg-emerald-200 animate-bubble-slow-2 filter blur-sm"></div>
        <div className="absolute bottom-40 left-1/4 w-16 h-16 rounded-full bg-yellow-200 animate-bubble-slow-3 filter blur-sm"></div>
        <div className="absolute bottom-10 right-10 w-28 h-28 rounded-full bg-purple-200 animate-bubble-slow-4 filter blur-sm"></div>
      </div>

      <div className="relative z-10 space-y-6 animate-fade-in">
        
        {/* Header Branding */}
        <div className="text-center space-y-2 pt-2">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 p-1.5 rounded-full shadow-md">
            <div className="bg-white p-2 rounded-full">
              <Award className="w-6 h-6 text-amber-500 animate-pulse" />
            </div>
          </div>
          
          <h1 className="text-2xl sm:text-3xl font-display font-extrabold tracking-tight text-indigo-900 drop-shadow-sm">
            Genius <span className="text-emerald-500">OSN</span>
          </h1>
          <p className="text-xs sm:text-sm font-medium text-slate-500 max-w-md mx-auto leading-relaxed">
            Asah Penalaran Soal Olimpiade Sains Nasional (OSN)
          </p>

          <div className="flex flex-wrap justify-center items-center gap-y-1 gap-x-3 text-[10px] sm:text-xs font-semibold text-indigo-700 bg-white shadow-sm border border-indigo-100 py-1.5 px-4 rounded-full max-w-fit mx-auto mt-2">
            <span className="flex items-center gap-1">
              <GraduationCap className="w-3.5 h-3.5 text-emerald-500" /> SDN Bindang 2 - Pamekasan
            </span>
            <span className="text-slate-300">|</span>
            <span>Silabus Resmi BPTI Kemendikdasmen</span>
          </div>
        </div>

        {/* Horizontal Subject Selection Tabs Menu */}
        <div className="bg-white/95 backdrop-blur-xs rounded-2xl border border-slate-100 shadow-md p-1.5 grid grid-cols-3 gap-2 max-w-md mx-auto">
          {(["IPA", "IPS", "Matematika"] as SubjectType[]).map((subj) => {
            const isActive = activeSubject === subj;
            let themeClass = "";
            if (isActive) {
              if (subj === "IPA") themeClass = "bg-gradient-to-r from-blue-500 to-emerald-500 text-white shadow-md";
              if (subj === "IPS") themeClass = "bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-md";
              if (subj === "Matematika") themeClass = "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md";
            } else {
              themeClass = "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-100/50";
            }

            return (
              <button
                key={subj}
                type="button"
                onClick={() => setActiveSubject(subj)}
                className={`py-2 px-2 rounded-xl font-display font-black text-xs sm:text-sm transition duration-300 flex items-center justify-center ${themeClass}`}
              >
                <span>{subj}</span>
              </button>
            );
          })}
        </div>

        {/* Main Selection Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Card untuk Topik Silabus */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-xl p-4 sm:p-6 space-y-5">
            <div className="flex flex-col gap-1.5">
              <h3 className="text-sm sm:text-base font-display font-black text-indigo-950">
                1. Pilih Topik Silabus {activeSubject}
              </h3>
              <p className="text-[11px] text-slate-500">
                Pilih kombinasi materi untuk diramu menjadi kuis berkualitas tinggi.
              </p>
            </div>

            {/* Category tabs and Category Quick Actions */}
            <div className="space-y-3.5 border-b border-slate-100 pb-4">
              <div className="flex flex-wrap gap-1.5">
                {subjectCategories.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setActiveCategory(cat)}
                    className={`text-[11px] sm:text-xs font-semibold py-1.5 px-3 rounded-full transition ${
                      activeCategory === cat 
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Quick Actions (Pilih semua & kosongkan per category) - Bottom Left */}
              <div className="flex flex-wrap items-center gap-2 pt-0.5">
                <button
                  type="button"
                  onClick={selectAll}
                  className="text-[10px] sm:text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-xl transition"
                >
                  ☑️ Pilih Semua Kategori Ini
                </button>
                <button
                  type="button"
                  onClick={clearAll}
                  className="text-[10px] sm:text-xs font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl transition"
                >
                  ✖️ Kosongkan Kategori Ini
                </button>
              </div>
            </div>

            {/* Grid Topik - Compact on HP */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
              {filteredTopics.map((topic) => {
                const isSelected = selectedTopics.includes(topic.name);
                return (
                  <button
                    key={topic.name}
                    type="button"
                    onClick={() => toggleTopic(topic.name)}
                    className={`flex items-start text-left p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl border transition duration-200 ${
                      isSelected 
                        ? "bg-emerald-50/80 border-emerald-400 shadow-md-emerald text-indigo-950 font-bold" 
                        : "bg-slate-50/50 border-slate-100 hover:bg-slate-50 hover:border-slate-300 text-slate-700"
                    }`}
                  >
                    <div className="mr-2 sm:mr-3 mt-0.5 text-lg sm:text-xl select-none">{topic.emoji}</div>
                    <div className="flex-1 space-y-0.5 min-w-0">
                      <span className="text-xs sm:text-sm font-bold leading-tight block">
                        {topic.name}
                      </span>
                      <span className="text-[9px] sm:text-[10px] uppercase tracking-wider font-extrabold text-slate-400 block">
                        {topic.category}
                      </span>
                    </div>
                    <div className="ml-2 select-none shrink-0 mt-0.5">
                      {isSelected ? (
                        <div className="bg-emerald-500 text-white rounded-full p-0.5">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      ) : (
                        <div className="w-4 h-4 border-2 border-slate-300 rounded-md"></div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Selected Counter Badge */}
            <div className="flex justify-between items-center bg-slate-50 border border-slate-100 p-3 sm:p-4 rounded-2xl text-xs sm:text-sm font-bold text-slate-700">
              <span className="flex items-center gap-1">
                <CheckSquare className="w-4 h-4 text-blue-500" /> Topik Terpilih di Kategori Ini:
              </span>
              <span className="bg-indigo-600 text-white text-[10px] sm:text-xs px-2.5 py-1 rounded-full font-serif font-extrabold shadow-sm">
                {selectedTopics.filter(name => filteredTopics.some(t => t.name === name)).length} / {filteredTopics.length} Topik
              </span>
            </div>
          </div>

          {/* Pengaturan Tambahan: Baris Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* 1. Jumlah Soal */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-md p-4 space-y-3">
              <h4 className="text-xs sm:text-sm font-display font-black text-indigo-950">
                2. Jumlah Soal
              </h4>
              <div className="grid grid-cols-3 gap-1.5">
                {[5, 10, 15].map(cnt => (
                  <button
                    key={cnt}
                    type="button"
                    onClick={() => setQuestionCount(cnt)}
                    className={`py-1.5 px-1 rounded-xl text-center font-extrabold transition ${
                      questionCount === cnt 
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-100" 
                        : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-100"
                    }`}
                  >
                    <span className="text-sm sm:text-base block">{cnt}</span>
                    <span className="text-[9px] uppercase font-bold tracking-wider opacity-90">Butir</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Tingkat Kesulitan */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-md p-4 space-y-3">
              <h4 className="text-xs sm:text-sm font-display font-black text-indigo-950">
                3. Tingkat Kesulitan
              </h4>
              <div className="space-y-1">
                {DIFFICULTIES.map(diff => (
                  <button
                    key={diff.value}
                    type="button"
                    onClick={() => setDifficulty(diff.value)}
                    className={`w-full py-1.5 px-2.5 rounded-lg text-left text-[11px] font-extrabold flex items-center justify-between transition ${
                      difficulty === diff.value 
                        ? "bg-indigo-600 text-white shadow-sm" 
                        : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-100"
                    }`}
                  >
                    <span>{diff.label}</span>
                    {difficulty === diff.value && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Pendekatan Soal */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-md p-4 space-y-3">
              <h4 className="text-xs sm:text-sm font-display font-black text-indigo-950">
                4. Pendekatan Soal
              </h4>
              <div className="space-y-1">
                {APPROACHES.map(app => (
                  <button
                    key={app.value}
                    type="button"
                    onClick={() => setApproach(app.value)}
                    className={`w-full py-1.5 px-2.5 rounded-lg text-left text-[10px] sm:text-[11px] font-extrabold flex items-center justify-between transition ${
                      approach === app.value 
                        ? "bg-indigo-600 text-white shadow-sm" 
                        : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-100"
                    }`}
                  >
                    <span className="truncate">{app.label}</span>
                    {approach === app.value && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Validation Alert */}
          {selectedTopics.length === 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2 text-amber-800 text-[11px] sm:text-xs">
              <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-extrabold block text-xs">Pilih Topik Terlebih Dahulu!</span>
                Anda harus memilih setidaknya 1 topik sains/sosial/matematika dari silabus resmi di atas agar Gemini AI dapat meramu butir kuis dengan sempurna.
              </div>
            </div>
          )}

          {/* Large Action Button */}
          <button
            type="submit"
            disabled={selectedTopics.length === 0}
            className={`w-full py-2.5 rounded-xl font-display font-black text-sm sm:text-base tracking-wide transition-all shadow-md flex items-center justify-center gap-2 ${
              selectedTopics.length > 0
                ? "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 hover:-translate-y-0.5 active:translate-y-0 text-white cursor-pointer"
                : "bg-slate-200 text-slate-400 cursor-not-allowed"
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Buat Soal Sekarang</span>
          </button>

        </form>

        {/* Footer Credit & SDN Bindang 2 */}
        <div className="text-center text-slate-400 space-y-1 py-2">
          <p className="text-[10px] sm:text-xs">
            Dibuat di bawah bimbingan guru sains dan materi olimpiade berpengalaman SDN Bindang 2 - Pamekasan untuk persiapan OSN tahun 2026.
          </p>
          <p className="text-[10px] tracking-wide font-extrabold">
            Copyright © 2026 Hairur Rahman
          </p>
        </div>
      </div>
    </div>
  );
}
