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
  Plus
} from "lucide-react";

interface SetupPageProps {
  onStartQuiz: (config: QuizConfig, apiKeys: string[]) => void;
}

export default function SetupPage({ onStartQuiz }: SetupPageProps) {
  // Active subject tab: IPA, IPS, Matematika
  const [activeSubject, setActiveSubject] = useState<SubjectType>("IPA");

  // Config state
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [difficulty, setDifficulty] = useState<string>("Sedang");
  const [approach, setApproach] = useState<string>("Campuran Semua Pendekatan");

  // API Key state: 3 Columns of Gemini keys per subject
  const [key1, setKey1] = useState<string>(() => localStorage.getItem("genius_osn_key_1") || "");
  const [key2, setKey2] = useState<string>(() => localStorage.getItem("genius_osn_key_2") || "");
  const [key3, setKey3] = useState<string>(() => localStorage.getItem("genius_osn_key_3") || "");
  
  const [showKeyConfig, setShowKeyConfig] = useState<boolean>(false);

  // Filter category state (defaults to the first category of IPA)
  const [activeCategory, setActiveCategory] = useState<string>("Biologi & Ekologi");

  // Sync API Keys with local storage
  useEffect(() => {
    localStorage.setItem("genius_osn_key_1", key1);
  }, [key1]);

  useEffect(() => {
    localStorage.setItem("genius_osn_key_2", key2);
  }, [key2]);

  useEffect(() => {
    localStorage.setItem("genius_osn_key_3", key3);
  }, [key3]);

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
    
    // Pass the config and the array of 3 API keys
    onStartQuiz({
      subject: activeSubject,
      topics: selectedTopics,
      count: questionCount,
      difficulty,
      approach
    }, [key1, key2, key3].filter(k => k.trim() !== ""));
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
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Background Floaters */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 opacity-40">
        <div className="absolute top-20 left-10 w-24 h-24 rounded-full bg-blue-200 animate-bubble-slow-1 filter blur-sm"></div>
        <div className="absolute top-80 right-20 w-32 h-32 rounded-full bg-emerald-200 animate-bubble-slow-2 filter blur-sm"></div>
        <div className="absolute bottom-40 left-1/4 w-16 h-16 rounded-full bg-yellow-200 animate-bubble-slow-3 filter blur-sm"></div>
        <div className="absolute bottom-10 right-10 w-28 h-28 rounded-full bg-purple-200 animate-bubble-slow-4 filter blur-sm"></div>
      </div>

      <div className="relative z-10 space-y-8 animate-fade-in">
        {/* Header Branding */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 via-emerald-500 to-yellow-500 p-1.5 rounded-full shadow-lg animate-bounce duration-1000">
            <div className="bg-white p-3 rounded-full">
              <Atom className="w-10 h-10 text-indigo-600 animate-spin" style={{ animationDuration: '8s' }} />
            </div>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-display font-extrabold tracking-tight text-indigo-900 drop-shadow-sm">
            Genius <span className="text-emerald-500">OSN</span>
          </h1>
          <p className="text-lg md:text-xl font-medium text-slate-600 max-w-xl mx-auto leading-relaxed">
            Asah Penalaran Soal Olimpiade Sains Nasional (OSN)
          </p>

          <div className="flex flex-wrap justify-center items-center gap-y-2 gap-x-4 text-xs font-semibold text-indigo-700 bg-white shadow-sm border border-indigo-100 py-2 px-5 rounded-full max-w-fit mx-auto mt-4">
            <span className="flex items-center gap-1">
              <GraduationCap className="w-4 h-4 text-emerald-500" /> SDN Bindang 2 - Pamekasan
            </span>
            <span className="text-slate-300">|</span>
            <span>Silabus Resmi BPTI Kemendikdasmen</span>
          </div>
        </div>

        {/* Horizontal Subject Selection Tabs Menu */}
        <div className="bg-white/95 backdrop-blur-xs rounded-3xl border border-slate-100 shadow-xl p-3 grid grid-cols-3 gap-2">
          {(["IPA", "IPS", "Matematika"] as SubjectType[]).map((subj) => {
            const isActive = activeSubject === subj;
            let themeClass = "";
            if (isActive) {
              if (subj === "IPA") themeClass = "bg-gradient-to-r from-blue-500 to-emerald-500 text-white shadow-lg";
              if (subj === "IPS") themeClass = "bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg";
              if (subj === "Matematika") themeClass = "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg";
            } else {
              themeClass = "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-100/50";
            }

            return (
              <button
                key={subj}
                type="button"
                onClick={() => setActiveSubject(subj)}
                className={`py-4 px-2 rounded-2xl font-display font-black text-sm md:text-base transition duration-300 flex flex-col md:flex-row items-center justify-center gap-2 ${themeClass}`}
              >
                <span className="text-2xl md:text-3xl">{getSubjectIcon(subj)}</span>
                <div className="text-center md:text-left">
                  <span className="block text-xs md:text-sm font-extrabold tracking-tight">Kategori</span>
                  <span className="block font-black text-sm md:text-lg leading-none">{subj}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* API Key Configuration Dropdown with 3 columns */}
        <div className="bg-white rounded-3xl border border-indigo-100 shadow-md overflow-hidden transition-all duration-300">
          <button 
            type="button"
            onClick={() => setShowKeyConfig(!showKeyConfig)}
            className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-indigo-50/50 text-indigo-950 hover:from-slate-100 transition duration-200 text-sm font-bold"
          >
            <div className="flex items-center gap-2.5">
              <span className="p-1.5 bg-indigo-100 text-indigo-700 rounded-lg">
                <Settings className="w-4 h-4 animate-spin-slow" />
              </span>
              <div className="text-left">
                <span className="block text-sm text-indigo-900 font-extrabold">Set API Key</span>
              </div>
            </div>
          </button>

          {showKeyConfig && (
            <div className="p-6 border-t border-indigo-50 space-y-4 bg-slate-50/50">
              <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-4 space-y-2.5">
                <h4 className="text-xs uppercase font-extrabold text-indigo-800 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  Bagaimana Membuat API Key di Gemini?
                </h4>
                <ol className="text-xs text-slate-600 space-y-1.5 list-decimal pl-4 leading-relaxed">
                  <li>Kunjungi situs resmi <strong><a href="https://aistudio.google.com/" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">Google AI Studio</a></strong>.</li>
                  <li>Masuk (Login) menggunakan akun Google Anda.</li>
                  <li>Klik tombol <strong>"Get API Key"</strong> di menu samping kiri atau atas.</li>
                  <li>Pilih <strong>"Create API Key"</strong>, lalu pilih opsi pembuatan kunci baru.</li>
                  <li><strong>Salin (Copy)</strong> kode API Key yang muncul, lalu tempelkan pada salah satu kolom kunci di bawah ini.</li>
                </ol>
              </div>

              {/* 3 Columns Grid for API Keys */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* Column 1 */}
                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs space-y-2 relative">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-slate-700">🔑 Kolom Key 1 (Utama)</span>
                    <span className={`w-2.5 h-2.5 rounded-full ${key1 ? "bg-emerald-500 animate-ping" : "bg-slate-300"}`} title={key1 ? "Siap digunakan" : "Belum diisi"}></span>
                  </div>
                  <input 
                    type="password"
                    value={key1}
                    onChange={(e) => setKey1(e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <p className="text-[10px] text-slate-400">Prioritas pertama pengerjaan soal.</p>
                </div>

                {/* Column 2 */}
                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-slate-700">🔑 Kolom Key 2 (Cadangan 1)</span>
                    <span className={`w-2.5 h-2.5 rounded-full ${key2 ? "bg-amber-500" : "bg-slate-300"}`} title={key2 ? "Siap digunakan" : "Belum diisi"}></span>
                  </div>
                  <input 
                    type="password"
                    value={key2}
                    onChange={(e) => setKey2(e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <p className="text-[10px] text-slate-400">Dipakai otomatis jika Key 1 limit.</p>
                </div>

                {/* Column 3 */}
                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-slate-700">🔑 Kolom Key 3 (Cadangan 2)</span>
                    <span className={`w-2.5 h-2.5 rounded-full ${key3 ? "bg-indigo-500" : "bg-slate-300"}`} title={key3 ? "Siap digunakan" : "Belum diisi"}></span>
                  </div>
                  <input 
                    type="password"
                    value={key3}
                    onChange={(e) => setKey3(e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <p className="text-[10px] text-slate-400">Dipakai otomatis jika Key 2 limit.</p>
                </div>

              </div>

              {/* Reset All Button */}
              {(key1 || key2 || key3) && (
                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setKey1("");
                      setKey2("");
                      setKey3("");
                    }}
                    className="text-[11px] font-bold text-rose-600 hover:text-rose-700 transition"
                  >
                    🗑️ Hapus Semua Key Tersimpan
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Main Selection Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Card untuk Topik Silabus */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-xl p-4 sm:p-6 space-y-5">
            <div className="flex flex-col gap-2">
              <h3 className="text-lg sm:text-xl font-display font-extrabold text-indigo-950 flex items-center gap-2">
                <span className="bg-emerald-100 text-emerald-600 p-1.5 rounded-lg text-base sm:text-lg">
                  {getSubjectIcon(activeSubject)}
                </span>
                1. Pilih Topik Silabus {activeSubject}
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-500">
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* 1. Jumlah Soal */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-xl p-6 space-y-4">
              <h4 className="text-lg font-display font-bold text-indigo-950 flex items-center gap-1.5">
                <span className="bg-blue-100 text-blue-600 px-2 py-0.5 rounded-lg text-sm">📋</span>
                2. Jumlah Soal
              </h4>
              <div className="grid grid-cols-3 gap-2">
                {[5, 10, 15].map(cnt => (
                  <button
                    key={cnt}
                    type="button"
                    onClick={() => setQuestionCount(cnt)}
                    className={`py-3 px-1 rounded-2xl text-center font-extrabold transition ${
                      questionCount === cnt 
                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200" 
                        : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-100"
                    }`}
                  >
                    <span className="text-xl block">{cnt}</span>
                    <span className="text-[10px] uppercase font-bold tracking-wider opacity-90">Butir</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Tingkat Kesulitan */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-xl p-6 space-y-4">
              <h4 className="text-lg font-display font-bold text-indigo-950 flex items-center gap-1.5">
                <span className="bg-yellow-100 text-yellow-600 px-2 py-0.5 rounded-lg text-sm">🔥</span>
                3. Tingkat Kesulitan
              </h4>
              <div className="space-y-1.5">
                {DIFFICULTIES.map(diff => (
                  <button
                    key={diff.value}
                    type="button"
                    onClick={() => setDifficulty(diff.value)}
                    className={`w-full py-2 px-3 rounded-xl text-left text-xs font-extrabold flex items-center justify-between transition ${
                      difficulty === diff.value 
                        ? "bg-indigo-600 text-white shadow-md" 
                        : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-100"
                    }`}
                  >
                    <span>{diff.label}</span>
                    {difficulty === diff.value && <div className="w-2 h-2 bg-white rounded-full"></div>}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Pendekatan Soal */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-xl p-6 space-y-4">
              <h4 className="text-lg font-display font-bold text-indigo-950 flex items-center gap-1.5">
                <span className="bg-purple-100 text-purple-600 px-2 py-0.5 rounded-lg text-sm">💡</span>
                4. Pendekatan Soal
              </h4>
              <div className="space-y-1.5">
                {APPROACHES.map(app => (
                  <button
                    key={app.value}
                    type="button"
                    onClick={() => setApproach(app.value)}
                    className={`w-full py-2 px-3 rounded-xl text-left text-[11px] font-extrabold flex items-center justify-between transition ${
                      approach === app.value 
                        ? "bg-indigo-600 text-white shadow-md" 
                        : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-100"
                    }`}
                  >
                    <span className="truncate">{app.label}</span>
                    {approach === app.value && <div className="w-2 h-2 bg-white rounded-full"></div>}
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Validation Alert */}
          {selectedTopics.length === 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 text-amber-800 text-sm animate-pulse">
              <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-extrabold block">Pilih Topik Terlebih Dahulu!</span>
                Anda harus memilih setidaknya 1 topik sains/sosial/matematika dari silabus resmi di atas agar Gemini AI dapat meramu butir kuis dengan sempurna.
              </div>
            </div>
          )}

          {/* Large Action Button */}
          <button
            type="submit"
            disabled={selectedTopics.length === 0}
            className={`w-full py-4 rounded-3xl font-display font-black text-xl tracking-wider transition-all shadow-xl flex items-center justify-center gap-3 ${
              selectedTopics.length > 0
                ? "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 hover:-translate-y-1 active:translate-y-0 text-white cursor-pointer"
                : "bg-slate-200 text-slate-400 cursor-not-allowed"
            }`}
          >
            <Sparkles className="w-6 h-6 animate-pulse" />
            <span>✨ Buat Soal Sekarang!</span>
          </button>

        </form>

        {/* Footer Credit & SDN Bindang 2 */}
        <div className="text-center text-slate-400 space-y-2 py-4">
          <p className="text-xs">
            Dibuat di bawah bimbingan guru sains dan materi olimpiade berpengalaman SDN Bindang 2 - Pamekasan untuk persiapan OSN tahun 2026.
          </p>
          <p className="text-[10px] tracking-widest uppercase font-extrabold">
            GENIUS OSN &copy; 2026 • SDN BINDANG 2
          </p>
        </div>
      </div>
    </div>
  );
}
