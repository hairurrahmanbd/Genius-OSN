export type SubjectType = "IPA" | "IPS" | "Matematika";

export interface TopicItem {
  name: string;
  category: string;
  emoji: string;
}

export const IPA_TOPICS: TopicItem[] = [
  // Biologi & Ekologi
  { name: "Keterampilan & Metode Ilmiah", category: "Biologi & Ekologi", emoji: "🧪" },
  { name: "Klasifikasi Makhluk Hidup", category: "Biologi & Ekologi", emoji: "🐾" },
  { name: "Keanekaragaman Hayati", category: "Biologi & Ekologi", emoji: "🌿" },
  { name: "Fotosintesis & Respirasi", category: "Biologi & Ekologi", emoji: "🍃" },
  { name: "Sistem Organ Manusia & Hewan", category: "Biologi & Ekologi", emoji: "🫁" },
  { name: "Perkembangbiakan Makhluk Hidup", category: "Biologi & Ekologi", emoji: "🐣" },
  { name: "Adaptasi & Seleksi Alam", category: "Biologi & Ekologi", emoji: "🦎" },
  { name: "Rantai Makanan & Ekosistem", category: "Biologi & Ekologi", emoji: "🕷️" },
  { name: "Pelestarian Sumber Daya Alam", category: "Biologi & Ekologi", emoji: "🌳" },
  { name: "Isu Kesehatan & Lingkungan", category: "Biologi & Ekologi", emoji: "😷" },
  { name: "Teknologi Ramah Lingkungan", category: "Biologi & Ekologi", emoji: "🔋" },

  // Fisika, Gaya, & Energi
  { name: "Mekanika (Gaya & Gerak)", category: "Fisika, Gaya, & Energi", emoji: "🏎️" },
  { name: "Tekanan & Hukum Pascal", category: "Fisika, Gaya, & Energi", emoji: "🎈" },
  { name: "Wujud Benda & Perubahan", category: "Fisika, Gaya, & Energi", emoji: "🧊" },
  { name: "Listrik Statis & Dinamis", category: "Fisika, Gaya, & Energi", emoji: "⚡" },
  { name: "Rangkaian Listrik", category: "Fisika, Gaya, & Energi", emoji: "💡" },
  { name: "Magnet & Elektromagnetik", category: "Fisika, Gaya, & Energi", emoji: "🧲" },
  { name: "Gelombang Bunyi", category: "Fisika, Gaya, & Energi", emoji: "🔊" },
  { name: "Cahaya & Optik (Cermin & Lensa)", category: "Fisika, Gaya, & Energi", emoji: "👓" },
  { name: "Suhu & Kalor", category: "Fisika, Gaya, & Energi", emoji: "🌡️" },
  { name: "Perpindahan Kalor", category: "Fisika, Gaya, & Energi", emoji: "🔥" },
  { name: "Bentuk Energi & Konversi", category: "Fisika, Gaya, & Energi", emoji: "🔄" },
  { name: "Energi Terbarukan", category: "Fisika, Gaya, & Energi", emoji: "☀️" },

  // Bumi, Tata Surya, & Kimia
  { name: "Bumi & Atmosfer", category: "Bumi, Tata Surya, & Kimia", emoji: "🌍" },
  { name: "Tata Surya & Antariksa", category: "Bumi, Tata Surya, & Kimia", emoji: "🪐" },
  { name: "Rotasi & Revolusi, Gerhana", category: "Bumi, Tata Surya, & Kimia", emoji: "🌑" },
  { name: "Atom & Muatan Listrik", category: "Bumi, Tata Surya, & Kimia", emoji: "⚛️" }
];

export const IPS_TOPICS: TopicItem[] = [
  // GEOGRAFI & LINGKUNGAN
  { name: "Peta & Letak Geografis Indonesia", category: "Geografi & Lingkungan", emoji: "🗺️" },
  { name: "Keanekaragaman Hayati & Sumber Daya Alam", category: "Geografi & Lingkungan", emoji: "🌴" },
  { name: "Kenampakan Alam & Gejala Alam", category: "Geografi & Lingkungan", emoji: "🌋" },
  { name: "Bentang Alam & Profesi Masyarakat", category: "Geografi & Lingkungan", emoji: "👨‍🌾" },
  { name: "Perubahan Wilayah & Tata Ruang", category: "Geografi & Lingkungan", emoji: "🏙️" },
  { name: "Karakteristik Negara-Negara ASEAN", category: "Geografi & Lingkungan", emoji: "🌏" },

  // SOSIOLOGI & BUDAYA
  { name: "Lembaga Sosial & Norma Masyarakat", category: "Sosiologi & Budaya", emoji: "🏛️" },
  { name: "Interaksi Sosial", category: "Sosiologi & Budaya", emoji: "🤝" },
  { name: "Keragaman Suku, Budaya & Agama Indonesia", category: "Sosiologi & Budaya", emoji: "🇮🇩" },
  { name: "Globalisasi & Modernisasi", category: "Sosiologi & Budaya", emoji: "📱" },
  { name: "Perubahan Sosial Budaya", category: "Sosiologi & Budaya", emoji: "🎭" },
  { name: "Keterampilan & Metode Ilmiah IPS", category: "Sosiologi & Budaya", emoji: "📚" },

  // EKONOMI
  { name: "Masalah Ekonomi & Nilai Guna Barang", category: "Ekonomi", emoji: "📦" },
  { name: "Uang & Kegiatan Ekonomi", category: "Ekonomi", emoji: "🪙" },
  { name: "Ekspor, Impor & Perdagangan Internasional", category: "Ekonomi", emoji: "🚢" },
  { name: "Ekonomi Maritim & Agraris Indonesia", category: "Ekonomi", emoji: "🌊" },
  { name: "Posisi & Peran Indonesia di ASEAN", category: "Ekonomi", emoji: "🤝" },
  { name: "Pembangunan Ekonomi Berkelanjutan", category: "Ekonomi", emoji: "📈" },

  // SEJARAH INDONESIA
  { name: "Budaya Awal Masyarakat Indonesia (Prasejarah)", category: "Sejarah Indonesia", emoji: "🗿" },
  { name: "Kerajaan Hindu-Buddha di Indonesia", category: "Sejarah Indonesia", emoji: "🛕" },
  { name: "Pengaruh Islam dalam Sejarah Indonesia", category: "Sejarah Indonesia", emoji: "🕌" },
  { name: "Kolonialisme & Imperialisme di Indonesia", category: "Sejarah Indonesia", emoji: "🏰" },
  { name: "Perlawanan Rakyat terhadap Penjajah", category: "Sejarah Indonesia", emoji: "⚔️" },
  { name: "Perjuangan Menuju Kemerdekaan Indonesia", category: "Sejarah Indonesia", emoji: "✊" },
  { name: "Proklamasi & Mempertahankan NKRI", category: "Sejarah Indonesia", emoji: "🇮🇩" },
  { name: "Tokoh Lokal & Nasional dalam Sejarah", category: "Sejarah Indonesia", emoji: "👤" },
  { name: "Peristiwa Penting Pasca Kemerdekaan", category: "Sejarah Indonesia", emoji: "📰" }
];

export const MATEMATIKA_TOPICS: TopicItem[] = [
  // BILANGAN
  { name: "Bilangan Cacah (operasi dasar, garis bilangan)", category: "Bilangan", emoji: "🔢" },
  { name: "Bilangan Bulat (positif, negatif, garis bilangan)", category: "Bilangan", emoji: "➕" },
  { name: "Bilangan Rasional & Pecahan (biasa, desimal, persen)", category: "Bilangan", emoji: "🍕" },
  { name: "Bilangan Prima & Faktorisasi", category: "Bilangan", emoji: "✨" },
  { name: "KPK (Kelipatan Persekutuan Terkecil)", category: "Bilangan", emoji: "✖️" },
  { name: "FPB (Faktor Persekutuan Terbesar)", category: "Bilangan", emoji: "➗" },
  { name: "Pola Bilangan & Barisan", category: "Bilangan", emoji: "📈" },

  // ARITMATIKA
  { name: "Operasi Hitung Campuran", category: "Aritmatika", emoji: "🧮" },
  { name: "Persamaan Linear Satu Variabel", category: "Aritmatika", emoji: "✏️" },
  { name: "Persamaan Linear Dua Variabel", category: "Aritmatika", emoji: "📝" },
  { name: "Pertidaksamaan Linear", category: "Aritmatika", emoji: "⚠️" },
  { name: "Perbandingan & Skala", category: "Aritmatika", emoji: "📏" },
  { name: "Persentase, Untung & Rugi", category: "Aritmatika", emoji: "📈" },
  { name: "Kecepatan, Jarak & Waktu", category: "Aritmatika", emoji: "🏃" },
  { name: "Debit Air", category: "Aritmatika", emoji: "💧" },

  // GEOMETRI
  { name: "Bangun Datar: Sifat, Luas & Keliling (segiempat, segitiga)", category: "Geometri", emoji: "📐" },
  { name: "Lingkaran (luas, keliling, busur, juring)", category: "Geometri", emoji: "⭕" },
  { name: "Sudut (jenis sudut, mengukur, menghitung)", category: "Geometri", emoji: "↗️" },
  { name: "Simetri Lipat & Simetri Putar", category: "Geometri", emoji: "🦋" },
  { name: "Geometri Ruang: Volume & Luas Permukaan", category: "Geometri", emoji: "📦" },
  { name: "Jaring-Jaring Bangun Ruang", category: "Geometri", emoji: "🗺️" },
  { name: "Transformasi (Translasi, Rotasi, Refleksi, Dilatasi)", category: "Geometri", emoji: "🌀" },
  { name: "Koordinat Kartesius", category: "Geometri", emoji: "📍" },

  // STATISTIKA & PENGUKURAN
  { name: "Satuan Waktu & Konversi", category: "Statistika & Pengukuran", emoji: "⏱️" },
  { name: "Satuan Panjang, Berat & Volume (konversi)", category: "Statistika & Pengukuran", emoji: "⚖️" },
  { name: "Mean (Rata-rata), Median & Modus", category: "Statistika & Pengukuran", emoji: "📊" },
  { name: "Diagram Batang, Garis & Lingkaran", category: "Statistika & Pengukuran", emoji: "📉" },
  { name: "Membaca & Menganalisis Data", category: "Statistika & Pengukuran", emoji: "🔎" },
  { name: "Pengukuran Luas & Keliling Gabungan", category: "Statistika & Pengukuran", emoji: "🧩" },

  // KOMBINATORIK
  { name: "Prinsip Pencacahan (Counting Problems)", category: "Kombinatorik", emoji: "🎲" },
  { name: "Aturan Perkalian & Penjumlahan", category: "Kombinatorik", emoji: "➕" },
  { name: "Permutasi Sederhana", category: "Kombinatorik", emoji: "🔄" },
  { name: "Kombinasi Sederhana", category: "Kombinatorik", emoji: "🤝" },
  { name: "Peluang Dasar", category: "Kombinatorik", emoji: "🎯" },
  { name: "Pola dengan Kombinasi", category: "Kombinatorik", emoji: "🧩" },
  { name: "Masalah Matematika Rekreasi", category: "Kombinatorik", emoji: "🎪" }
];

export const MOTIVATIONAL_QUOTES = [
  { text: "Tahukah kamu? Fotosintesis menghasilkan oksigen yang kita hirup setiap hari! 🌱", author: "Fakta Sains" },
  { text: "Mencoba dan salah adalah bagian dari metode ilmiah atau penyelesaian problem matematika. Jangan takut mencoba! 🧬", author: "Saran Guru" },
  { text: "Suku dan budaya Indonesia yang melimpah adalah kekayaan bangsa yang wajib kita lestarikan bersama! 🇮🇩", author: "Fakta IPS" },
  { text: "Hukum Pascal membuat dongkrak hidrolik mampu mengangkat mobil yang sangat berat hanya dengan tenaga kecil! 🎈", author: "Fakta Fisika" },
  { text: "Matematika adalah bahasa alam semesta. Dari jaring laba-laba hingga orbit planet, semuanya mengikuti pola matematika! 📐", author: "Fakta Matematika" },
  { text: "Ayo SDN Bindang 2, buktikan bahwa kita bisa menjadi juara OSN berikutnya! 🏆", author: "SDN Bindang 2 - Pamekasan" },
  { text: "Negara-negara ASEAN bekerja sama erat untuk menjaga stabilitas perdamaian dan kemajuan ekonomi di Asia Tenggara. 🌏", author: "Fakta ASEAN" },
  { text: "Yuk, asah terus kemampuan logismu bersama Tutor AI yang super sabar ini! 🤖", author: "Fitur Genius OSN" }
];

export const DIFFICULTIES = [
  { value: "Mudah", label: "😊 Mudah", bg: "bg-green-100 text-green-700 border-green-300" },
  { value: "Sedang", label: "🤔 Sedang", bg: "bg-blue-100 text-blue-700 border-blue-300" },
  { value: "Sulit", label: "🔥 Sulit", bg: "bg-orange-100 text-orange-700 border-orange-300" },
  { value: "Olimpiade", label: "🏆 Olimpiade", bg: "bg-purple-100 text-purple-700 border-purple-300" },
  { value: "Campur", label: "🎲 Campur", bg: "bg-gray-100 text-gray-700 border-gray-300" }
];

export const APPROACHES = [
  { value: "Konsep & Pemahaman", label: "💡 Konsep & Pemahaman" },
  { value: "Aplikasi Kehidupan Nyata", label: "🌍 Aplikasi Kehidupan Nyata" },
  { value: "Analisis & Eksperimen", label: "🧫 Analisis & Eksperimen" },
  { value: "Inkuiri & Investigasi", label: "🔍 Inkuiri & Investigasi" },
  { value: "Campuran Semua Pendekatan", label: "🎨 Campuran Semua Pendekatan" }
];
