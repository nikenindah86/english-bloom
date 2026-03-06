// TKA Bahasa Inggris SMA/Sederajat Framework
// Source: https://github.com/miztergood/kerangka-asesmen-TKA-SD-SMP/blob/main/bahasa-inggris-sma
// DO NOT MODIFY - this data comes from the official framework

export const TKA_FRAMEWORK = {
  name: "TKA Bahasa Inggris SMA/Sederajat",
  definisi:
    "TKA Bahasa Inggris mengukur keterampilan membaca beragam jenis teks berbahasa Inggris dalam berbagai situasi komunikasi sehari-hari, vokasional, dan akademik.",
  jenis_teks: [
    "descriptive",
    "recount",
    "narrative",
    "procedure",
    "analytical exposition",
  ] as const,
  konteks_komunikasi: [
    "sehari-hari",
    "tempat kerja (vokasional)",
    "akademik",
  ],
  tingkat_kemahiran: {
    B1: {
      label: "B1 (Intermediate)",
      karakteristik: [
        "panjang sekitar 250–350 kata",
        "menggunakan kosakata berfrekuensi tinggi (hingga 3000 kata)",
        "menggunakan struktur kalimat sederhana serta kompleks",
        "menggunakan konteks sehari-hari, vokasional, dan akademik dasar yang berkaitan dengan minat, pengalaman, dan kebutuhan informasi umum dengan tingkat pemahaman yang baik",
      ],
    },
    A2: {
      label: "A2 (Elementary)",
      karakteristik: [
        "panjang sekitar 200–300 kata",
        "menggunakan kosakata berfrekuensi tinggi (hingga 2000 kata)",
        "menggunakan struktur kalimat sederhana dan beberapa bentuk majemuk dasar",
        "menggambarkan konteks kehidupan sehari-hari dan vokasional yang berkaitan dengan hal-hal konkret dan dikenal dengan tingkat pemahaman yang memadai",
      ],
    },
  },
  kompetensi: [
    {
      no: 1,
      name: "Pemahaman Tekstual",
      description:
        "mampu memahami informasi yang eksplisit, mengelompokkan, menyusun ulang, dan menyajikan kembali informasi eksplisit dari teks",
      subkompetensi: [
        "Menemukan/mengidentifikasi informasi penting yang disebutkan secara eksplisit dalam teks.",
        "Mengklasifikasi orang, benda, tempat, atau peristiwa dalam teks berdasarkan kategori tertentu.",
        "Menyusun poin-poin utama dari teks dalam bentuk kerangka atau daftar.",
        "Meringkas isi teks secara ringkas dengan mengutip bagian penting.",
        "Mensintesis informasi dari sumber lain untuk memperoleh pemahaman yang lebih komprehensif.",
      ],
    },
    {
      no: 2,
      name: "Pemahaman Inferensial",
      description:
        "mampu menarik kesimpulan berdasarkan informasi tersirat dalam teks, pengalaman pribadi, serta intuisi untuk memahami isi teks",
      subkompetensi: [
        "Menyimpulkan detail pendukung dengan menentukan fakta tambahan yang membuat teks lebih informatif, menarik, atau persuasif.",
        "Menyimpulkan topik, ide pokok/gagasan utama, makna, target pembaca, tujuan penulisan teks, atau pesan moral yang tidak secara eksplisit dinyatakan.",
        "Menyimpulkan urutan kejadian atau memperkirakan kelanjutan isi teks.",
        "Menyimpulkan perbandingan antara tokoh, waktu, tempat, benda, atau gagasan dalam teks.",
        "Menyimpulkan hubungan sebab-akibat antar gagasan atau tindakan dalam teks.",
        "Menyimpulkan karakter tokoh berdasarkan petunjuk eksplisit dalam teks.",
        "Memprediksi akhir cerita setelah membaca bagian awal.",
      ],
    },
    {
      no: 3,
      name: "Evaluasi dan Apresiasi",
      description:
        "mampu membuat penilaian terhadap ide, menanggapi teks secara emosional dan estetis dengan mempertimbangkan dampaknya terhadap perasaan, imajinasi, serta penggunaan bahasa oleh penulis",
      subkompetensi: [
        "Menilai realitas atau fantasi suatu peristiwa dalam teks berdasarkan pengalaman atau pengetahuan pribadi.",
        "Menilai fakta atau opini yang diberikan penulis untuk mendukung pendapatnya atau memengaruhi pembaca.",
        "Menilai kecukupan dan validitas informasi dalam teks (dengan membandingkan dengan sumber lain).",
        "Menilai kesesuaian bagian teks dalam menggambarkan karakter utama atau aspek lain dari bacaan.",
        "Menanggapi isi teks dengan mengungkapkan perasaan atau kesan seperti ketertarikan, kebosanan, kegembiraan, ketakutan, kebencian, atau kesenangan.",
      ],
    },
  ],
  bentuk_soal: [
    { value: "pg", label: "Pilihan Ganda (PG)", description: "Multiple choice with single correct answer" },
    { value: "pgk_kategori", label: "PGK Kategori", description: "Categorization - each statement maps to a category" },
    { value: "pgk_mcma", label: "PGK MCMA", description: "Multiple choice with multiple correct answers" },
  ] as const,
} as const;

export type JenisTeks = typeof TKA_FRAMEWORK.jenis_teks[number];
export type TingkatKemahiran = "B1" | "A2";
export type BentukSoal = typeof TKA_FRAMEWORK.bentuk_soal[number]["value"];

export type TkaBasketItem = {
  id: string;
  jenis_teks: JenisTeks;
  bentuk_soal: BentukSoal;
  num_options: 4 | 5;
  num_questions: number;
  kompetensi: string;
  subkompetensi: string[];
  include_passage: boolean;
};

export type TkaOutlineItem = {
  no: number;
  kompetensi: string;
  subkompetensi: string;
  bentuk_soal: string;
  num_options: number;
  deskripsi_soal: string;
};
