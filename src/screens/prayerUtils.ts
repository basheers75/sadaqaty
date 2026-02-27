// ─── Shared Prayer Utilities ─────────────────────────────────────────────────

export const CALC_METHODS: Record<string, { name: string; fajr: number; isha: number | string }> = {
  MWL:     { name: "Muslim World League",    fajr: 18,   isha: 17 },
  ISNA:    { name: "ISNA (North America)",   fajr: 15,   isha: 15 },
  Egypt:   { name: "Egyptian Authority",     fajr: 19.5, isha: 17.5 },
  Makkah:  { name: "Umm al-Qura (Makkah)",   fajr: 18.5, isha: "90min" },
  Karachi: { name: "University of Karachi",  fajr: 18,   isha: 18 },
};

function toRad(d: number) { return d * Math.PI / 180; }
function toDeg(r: number) { return r * 180 / Math.PI; }
function fixAngle(a: number) { return a - 360 * Math.floor(a / 360); }
function fixHour(a: number) { return a - 24 * Math.floor(a / 24); }

function julianDate(y: number, m: number, d: number) {
  if (m <= 2) { y -= 1; m += 12; }
  const A = Math.floor(y / 100);
  const B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + B - 1524.5;
}

function sunPosition(jd: number) {
  const D = jd - 2451545.0;
  const g = fixAngle(357.529 + 0.98560028 * D);
  const q = fixAngle(280.459 + 0.98564736 * D);
  const L = fixAngle(q + 1.915 * Math.sin(toRad(g)) + 0.020 * Math.sin(toRad(2 * g)));
  const e = 23.439 - 0.00000036 * D;
  const RA = toDeg(Math.atan2(Math.cos(toRad(e)) * Math.sin(toRad(L)), Math.cos(toRad(L)))) / 15;
  const dec = toDeg(Math.asin(Math.sin(toRad(e)) * Math.sin(toRad(L))));
  const EqT = q / 15 - fixHour(RA);
  return { dec, EqT };
}

export function computeTimes(date: Date, lat: number, lng: number, methodKey = "MWL", asrFactor = 1) {
  const method = CALC_METHODS[methodKey] ?? CALC_METHODS.MWL;
  const jd = julianDate(date.getFullYear(), date.getMonth() + 1, date.getDate());
  const { dec, EqT } = sunPosition(jd);
  const tz = -date.getTimezoneOffset() / 60;
  const noon = 12 - lng / 15 - EqT + tz;

  const ha = (angle: number, dir: number) => {
    const val = -Math.sin(toRad(angle)) - Math.sin(toRad(dec)) * Math.sin(toRad(lat));
    const cos = Math.cos(toRad(dec)) * Math.cos(toRad(lat));
    if (Math.abs(val / cos) > 1) return NaN;
    return dir * toDeg(Math.acos(val / cos)) / 15;
  };

  const asrAngle = toDeg(Math.atan(1 / (asrFactor + Math.tan(toRad(Math.abs(lat - dec))))));

  const fmt = (h: number) => {
    if (isNaN(h)) return "--:--";
    h = fixHour(h);
    const hh = Math.floor(h), mm = Math.floor((h - hh) * 60);
    return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
  };

  const adj = 3 / 60; // +3 min correction offset

  return {
    fajr:    fmt(noon + ha(method.fajr, -1) + adj),
    sunrise: fmt(noon + ha(0.833, -1) + adj),
    dhuhr:   fmt(noon + 1 / 60 + adj),
    asr:     fmt(noon + ha(-asrAngle, 1) + adj),
    maghrib: fmt(noon + ha(0.833, 1) + 2 / 60 + adj),
    isha:    typeof method.isha === "string"
               ? fmt(noon + ha(0.833, 1) + 90 / 60 + adj)
               : fmt(noon + ha(method.isha as number, 1) + adj),
  };
}

export function toHijri(date: Date) {
  // Round JD to nearest integer (matches Python int(JD+0.5))
  const jd = Math.floor(julianDate(date.getFullYear(), date.getMonth() + 1, date.getDate()) + 0.5);
  let l = jd - 1948440 + 10632;
  const n = Math.floor((l - 1) / 10631);
  l = l - 10631 * n + 354;
  const j = Math.floor((10985 - l) / 5316) * Math.floor((50 * l) / 17719) + Math.floor(l / 5670) * Math.floor((43 * l) / 15238);
  l = l - Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) - Math.floor(j / 16) * Math.floor((15238 * j) / 43) + 29;
  const month = Math.floor((24 * l) / 709);
  const day = l - Math.floor((709 * month) / 24);
  const year = 30 * n + j - 30;
  const months = ["Muharram","Safar","Rabi' al-Awwal","Rabi' al-Thani","Jumada al-Ula","Jumada al-Akhira","Rajab","Sha'ban","Ramadan","Shawwal","Dhu al-Qi'dah","Dhu al-Hijjah"];
  const monthsAr = ["مُحَرَّم","صَفَر","رَبيع الأوَّل","رَبيع الثاني","جُمادى الأولى","جُمادى الآخرة","رَجَب","شَعبان","رَمَضان","شَوَّال","ذو القَعدة","ذو الحِجَّة"];
  return { day, month: months[month - 1], monthAr: monthsAr[month - 1], year };
}

export function timeToMin(t: string) {
  if (!t || t === "--:--") return -1;
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

export function formatCountdown(nowMin: number, targetMin: number) {
  let diff = targetMin - nowMin;
  if (diff < 0) diff += 1440;
  const h = Math.floor(diff / 60), m = diff % 60;
  return h > 0 ? `${h}h ${String(m).padStart(2, "0")}m` : `${m}m`;
}

export const PRAYER_LIST = [
  { key: "fajr",    ar: "الفجر",  en: "Fajr"    },
  { key: "sunrise", ar: "الشروق", en: "Sunrise"  },
  { key: "dhuhr",   ar: "الظهر",  en: "Dhuhr"   },
  { key: "asr",     ar: "العصر",  en: "Asr"     },
  { key: "maghrib", ar: "المغرب", en: "Maghrib"  },
  { key: "isha",    ar: "العشاء", en: "Isha"    },
];

export const PRAYER_LIST_5 = PRAYER_LIST.filter(p => p.key !== "sunrise");

export async function geocodeCity(city: string): Promise<{ lat: number; lng: number; name: string } | null> {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&limit=1`);
    const data = await res.json();
    if (!data.length) return null;
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon), name: data[0].display_name.split(",").slice(0, 2).join(", ") };
  } catch { return null; }
}

export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
    const data = await res.json();
    const city = data.address?.city || data.address?.town || data.address?.village || "";
    const country = data.address?.country || "";
    return [city, country].filter(Boolean).join(", ");
  } catch { return ""; }
}

// ─── Location Store (localStorage) ───────────────────────────────────────────
export interface LocationPrefs {
  lat: number;
  lng: number;
  locationName: string;
  method: string;
  asrFactor: number;
}

const STORE_KEY = "sadaqa_location_prefs";

export function loadPrefs(): LocationPrefs | null {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function savePrefs(prefs: LocationPrefs) {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(prefs)); } catch {}
}

export function clearPrefs() {
  try { localStorage.removeItem(STORE_KEY); } catch {}
}

// ─── Quran reading progress ───────────────────────────────────────────────────
export function getLastPage(): { page: number; surahName: string } | null {
  try {
    const raw = localStorage.getItem("sadaqa_last_position");
    if (!raw) return null;
    const pos = JSON.parse(raw);
    return pos ? { page: pos.page || 1, surahName: pos.surahName || "" } : null;
  } catch { return null; }
}
