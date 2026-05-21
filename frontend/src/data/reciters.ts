// ─── Reciter catalog using EveryAyah.com CDN ────────────────────────────────
// URL pattern: https://everyayah.com/data/{reciterId}/{surah:03d}{ayah:03d}.mp3
// Bismillah audio (used at the start of each surah except 1 and 9): 001000.mp3

export interface Reciter {
  id: string;
  ar: string;
  en: string;
  bitrate: string;
  // Optional full-surah base URL (mp3quran.net) for surah mode
  fullSurahBase?: string;
}

export const RECITERS: Reciter[] = [
  {
    id: "Alafasy_128kbps",
    ar: "مشاري راشد العفاسي",
    en: "Mishary Rashid Al-Afasy",
    bitrate: "128",
    fullSurahBase: "https://server8.mp3quran.net/afs",
  },
  {
    id: "Husary_128kbps",
    ar: "محمود خليل الحصري",
    en: "Mahmoud Khalil Al-Husary",
    bitrate: "128",
    fullSurahBase: "https://server13.mp3quran.net/husr",
  },
  {
    id: "Minshawy_Murattal_128kbps",
    ar: "محمد صديق المنشاوي",
    en: "Mohamed Siddiq El-Minshawi",
    bitrate: "128",
    fullSurahBase: "https://server10.mp3quran.net/minsh",
  },
  {
    id: "Abdul_Basit_Murattal_192kbps",
    ar: "عبد الباسط عبد الصمد",
    en: "Abdul Basit Abdul Samad",
    bitrate: "192",
    fullSurahBase: "https://server7.mp3quran.net/basit",
  },
  {
    id: "Abdurrahmaan_As-Sudais_192kbps",
    ar: "عبد الرحمن السديس",
    en: "Abdurrahman As-Sudais",
    bitrate: "192",
    fullSurahBase: "https://server11.mp3quran.net/sds",
  },
];

const pad3 = (n: number) => n.toString().padStart(3, "0");

export function ayahAudioUrl(reciterId: string, surah: number, ayah: number) {
  return `https://everyayah.com/data/${reciterId}/${pad3(surah)}${pad3(ayah)}.mp3`;
}

export function bismillahUrl(reciterId: string) {
  return `https://everyayah.com/data/${reciterId}/001001.mp3`;
}

export function fullSurahUrl(reciter: Reciter, surah: number) {
  return reciter.fullSurahBase ? `${reciter.fullSurahBase}/${pad3(surah)}.mp3` : null;
}

const PREF_KEY = "audio_quran_reciter";
export function getSavedReciter(): string {
  try { return localStorage.getItem(PREF_KEY) || RECITERS[0].id; }
  catch { return RECITERS[0].id; }
}
export function saveReciter(id: string) {
  try { localStorage.setItem(PREF_KEY, id); } catch {}
}
