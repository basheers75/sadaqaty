import { useState, useEffect, useRef, memo } from "react";
import { computeTimes, toHijri, timeToMin, PRAYER_LIST_5, PRAYER_LIST, loadPrefs } from "./prayerUtils";
import { getLang, T } from "./langStore";

// ── Single UI font — used for EVERYTHING except Quran verses ─────────────────
const UI  = "'DM Sans', 'Segoe UI', Arial, sans-serif";
const QUR = "'Scheherazade New', serif"; // Quran/Uthmani font — ONLY for Ayah text

// ── Numeral helpers ───────────────────────────────────────────────────────────
const HINDI = "٠١٢٣٤٥٦٧٨٩";
function toHindi(s: string) { return s.replace(/\d/g, d => HINDI[+d]); }
function toArNums(s: string | number) { return String(s).replace(/\d/g, d => HINDI[+d]); }

// Arabic citation map for Ayah sources
const AR_CITATION: Record<string, string> = {
  "Ash-Sharh 6":    "الشرح ٦",
  "At-Talaq 3":     "الطلاق ٣",
  "Al-Baqarah 152": "البقرة ١٥٢",
  "Al-Baqarah 153": "البقرة ١٥٣",
  "Ta-Ha 114":      "طه ١١٤",
  "Al Imran 173":   "آل عمران ١٧٣",
  "Al-Baqarah 201": "البقرة ٢٠١",
};

// ── Countdown — always LTR, Hindi digits in AR mode ──────────────────────────
const PrayerCountdown = memo(({ targetMin, isAr, fontSize = "1.9rem", color = "#f5f0e8" }: {
  targetMin: number; isAr: boolean; fontSize?: string; color?: string;
}) => {
  const [str, setStr] = useState("00:00:00");
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);

  const calc = () => {
    const n = new Date();
    const nowSec = n.getHours() * 3600 + n.getMinutes() * 60 + n.getSeconds();
    let diff = targetMin * 60 - nowSec;
    if (diff < 0) diff += 86400;
    const h = String(Math.floor(diff / 3600)).padStart(2, "0");
    const m = String(Math.floor((diff % 3600) / 60)).padStart(2, "0");
    const s = String(diff % 60).padStart(2, "0");
    const raw = `${h}:${m}:${s}`;
    return isAr ? toHindi(raw) : raw;
  };

  useEffect(() => {
    setStr(calc());
    ref.current = setInterval(() => setStr(calc()), 1000);
    return () => { if (ref.current) clearInterval(ref.current); };
  }, [targetMin, isAr]);

  return (
    <div style={{
      direction: "ltr", fontFamily: "'Courier New', Courier, monospace",
      fontSize, color, fontWeight: 700, lineHeight: 1,
      letterSpacing: "0.02em", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap",
    }}>{str}</div>
  );
});

// ── Progress bar ──────────────────────────────────────────────────────────────
function ProgressBar({ prevMin, nextMin, nowMin }: { prevMin: number; nextMin: number; nowMin: number }) {
  const total = nextMin > prevMin ? nextMin - prevMin : nextMin + 1440 - prevMin;
  const elapsed = nowMin >= prevMin ? nowMin - prevMin : nowMin + 1440 - prevMin;
  const pct = Math.min(100, Math.max(0, (elapsed / total) * 100));
  return (
    <div style={{ height: 5, background: "rgba(255,255,255,0.15)", borderRadius: 3, margin: "12px 0 0" }}>
      <div style={{ height: "100%", width: `${pct}%`, background: "#d4a843", borderRadius: 3 }} />
    </div>
  );
}

// ── Notification helpers ──────────────────────────────────────────────────────
async function requestNotifPermission(): Promise<boolean> {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const result = await Notification.requestPermission();
  return result === "granted";
}

const scheduledTimers: ReturnType<typeof setTimeout>[] = [];

function scheduleNotifications(times: Record<string, string>, lang: string) {
  scheduledTimers.forEach(id => clearTimeout(id));
  scheduledTimers.length = 0;
  const isAr = lang === "ar";
  const prayers = [
    { key: "fajr",    arName: "الفجر",  enName: "Fajr"    },
    { key: "dhuhr",   arName: "الظهر",  enName: "Dhuhr"   },
    { key: "asr",     arName: "العصر",  enName: "Asr"     },
    { key: "maghrib", arName: "المغرب", enName: "Maghrib" },
    { key: "isha",    arName: "العشاء", enName: "Isha"    },
  ];
  const nowMs = Date.now();
  prayers.forEach(p => {
    const timeStr = times[p.key];
    if (!timeStr) return;
    const parts = timeStr.trim().split(":");
    if (parts.length < 2) return;
    const ph = parseInt(parts[0], 10), pm = parseInt(parts[1], 10);
    if (isNaN(ph) || isNaN(pm)) return;
    const prayerDate = new Date();
    prayerDate.setHours(ph, pm, 0, 0);
    let diffMs = prayerDate.getTime() - nowMs;
    if (diffMs < 0) diffMs += 86400000;
    if (diffMs > 86400000) return;
    const id = setTimeout(() => {
      if (Notification.permission === "granted") {
        new Notification(isAr ? `حان وقت ${p.arName}` : `Time for ${p.enName}`, {
          body: isAr ? "حان وقت الصلاة" : "Prayer time has arrived",
          icon: "/favicon.ico", tag: p.key, requireInteraction: true,
        });
      }
    }, diffMs);
    scheduledTimers.push(id);
  });
}

// ── Smart Azkar card ──────────────────────────────────────────────────────────
function getAzkarCard(nowMin: number, times: Record<string, string> | null, isAr: boolean) {
  const h = Math.floor(nowMin / 60);
  if (times) {
    const prayersWithAzkar = [
      { key: "fajr",    icon: "🌅", ar: "أذكار بعد الفجر",   en: "After Fajr Adhkar",    desc: isAr ? "أذكار صلاة الفجر المباركة"    : "Adhkar following Fajr prayer"    },
      { key: "dhuhr",   icon: "🕌", ar: "أذكار بعد الظهر",   en: "After Dhuhr Adhkar",   desc: isAr ? "أذكار صلاة الظهر المباركة"    : "Adhkar following Dhuhr prayer"   },
      { key: "asr",     icon: "🌤️",ar: "أذكار بعد العصر",   en: "After Asr Adhkar",     desc: isAr ? "أذكار صلاة العصر المباركة"    : "Adhkar following Asr prayer"     },
      { key: "maghrib", icon: "🌆", ar: "أذكار بعد المغرب",  en: "After Maghrib Adhkar", desc: isAr ? "أذكار صلاة المغرب المباركة"   : "Adhkar following Maghrib prayer"  },
      { key: "isha",    icon: "🌙", ar: "أذكار بعد العشاء",  en: "After Isha Adhkar",    desc: isAr ? "أذكار صلاة العشاء المباركة"   : "Adhkar following Isha prayer"    },
    ];
    for (const p of [...prayersWithAzkar].reverse()) {
      const pMin = timeToMin(times[p.key]);
      if (pMin < 0) continue;
      const diff = nowMin >= pMin ? nowMin - pMin : nowMin + 1440 - pMin;
      if (diff <= 90) return { icon: p.icon, ar: p.ar, en: p.en, desc: p.desc };
    }
  }
  if (h >= 4  && h < 8)  return { icon: "🌅", ar: "أذكار الصباح",  en: "Morning Adhkar",  desc: isAr ? "ابدأ يومك بذكر الله"             : "Start your day with remembrance"  };
  if (h >= 8  && h < 12) return { icon: "☀️", ar: "أذكار الضحى",   en: "Duha Adhkar",     desc: isAr ? "أذكار صلاة الضحى المباركة"       : "The blessed Duha prayer adhkar"   };
  if (h >= 15 && h < 19) return { icon: "🌇", ar: "أذكار المساء",  en: "Evening Adhkar",  desc: isAr ? "أذكار المساء المباركة"           : "Blessed evening remembrance"     };
  if (h >= 21 || h < 4)  return { icon: "🌙", ar: "أذكار النوم",   en: "Sleep Adhkar",    desc: isAr ? "أذكار ما قبل النوم"             : "Adhkar before sleep"             };
  return                         { icon: "📿", ar: "الأذكار",       en: "Daily Adhkar",    desc: isAr ? "أذكار وأدعية يومية"             : "Daily remembrance & supplications" };
}

// ── Static data ───────────────────────────────────────────────────────────────
const INSPIRATIONS = [
  { ar: "إِنَّ مَعَ الْعُسْرِ يُسْرًا",                                        source: "Ash-Sharh 6",    en: "Indeed, with hardship comes ease." },
  { ar: "وَمَن يَتَوَكَّلْ عَلَى اللَّهِ فَهُوَ حَسْبُهُ",                    source: "At-Talaq 3",     en: "Whoever relies upon Allah — He is sufficient for him." },
  { ar: "فَاذْكُرُونِي أَذْكُرْكُمْ",                                           source: "Al-Baqarah 152", en: "Remember Me, and I will remember you." },
  { ar: "إِنَّ اللَّهَ مَعَ الصَّابِرِينَ",                                     source: "Al-Baqarah 153", en: "Indeed, Allah is with the patient." },
  { ar: "وَقُل رَّبِّ زِدْنِي عِلْمًا",                                         source: "Ta-Ha 114",      en: "Say: My Lord, increase me in knowledge." },
  { ar: "حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ",                                source: "Al Imran 173",   en: "Allah is sufficient for us, and He is the best Guardian." },
  { ar: "رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً",  source: "Al-Baqarah 201", en: "Our Lord, give us good in this world and good in the Hereafter." },
];

const MONTHS_EN   = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const WEEKDAYS_EN = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const WEEKDAYS_AR = ["الأحد","الاثنين","الثلاثاء","الأربعاء","الخميس","الجمعة","السبت"];
const HIJRI_AR    = ["مُحَرَّم","صَفَر","رَبيع الأوَّل","رَبيع الثاني","جُمادى الأولى","جُمادى الآخرة","رَجَب","شَعبان","رَمَضان","شَوَّال","ذو القَعدة","ذو الحِجَّة"];
const CARD_H = 96;

export default function HomeScreen({ onNavigate }: { onNavigate: (s: string) => void }) {
  const [now, setNow]           = useState(new Date());
  const [times, setTimes]       = useState<Record<string, string> | null>(null);
  const [locationName, setLoc]  = useState("");
  const [noLocation, setNoLoc]  = useState(false);
  const [lastRead, setLastRead] = useState<{ page: number; surahName: string; surahNameAr: string } | null>(null);
  const [notifStatus, setNotifStatus] = useState<"unknown"|"granted"|"denied"|"unsupported">("unknown");
  const [expanded, setExpanded] = useState(false);
  const [bells, setBells] = useState<Record<string, [boolean,boolean,boolean]>>({
    fajr:    [true,  true,  true ],
    sunrise: [false, false, false],
    dhuhr:   [true,  true,  true ],
    asr:     [true,  true,  true ],
    maghrib: [true,  true,  true ],
    isha:    [true,  true,  true ],
  });
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const lang = getLang() || "en";
  const t    = T[lang];
  const isAr = lang === "ar";

  const inspiration = INSPIRATIONS[now.getDate() % INSPIRATIONS.length];

  useEffect(() => {
    timerRef.current = setInterval(() => setNow(new Date()), 60000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  useEffect(() => {
    const prefs = loadPrefs();
    if (prefs) {
      setTimes(computeTimes(new Date(), prefs.lat, prefs.lng, prefs.method, prefs.asrFactor, prefs.offsets ?? {}));
      setLoc(prefs.locationName);
    } else setNoLoc(true);
    try {
      const raw = localStorage.getItem("quran_last_position");
      if (raw) {
        const pos = JSON.parse(raw);
        if (pos?.page) setLastRead({ page: pos.page, surahName: pos.surahName || "", surahNameAr: pos.surahNameAr || "" });
      }
    } catch {}
    if (!("Notification" in window)) setNotifStatus("unsupported");
    else setNotifStatus(Notification.permission === "granted" ? "granted" : Notification.permission === "denied" ? "denied" : "unknown");
  }, []);

  useEffect(() => {
    if (times && notifStatus === "granted") scheduleNotifications(times, lang);
  }, [times, notifStatus, lang]);

  const hijri         = toHijri(now);
  const nowMin        = now.getHours() * 60 + now.getMinutes();
  const hijriMonthIdx = HIJRI_AR.indexOf(hijri.monthAr);
  const dayName       = isAr ? WEEKDAYS_AR[now.getDay()] : WEEKDAYS_EN[now.getDay()];
  const azkarCard     = getAzkarCard(nowMin, times, isAr);

  const nextPrayer = times ? (() => {
    for (const p of PRAYER_LIST_5) {
      const m = timeToMin(times[p.key]);
      if (m > nowMin) return { ...p, min: m };
    }
    return { ...PRAYER_LIST_5[0], min: timeToMin(times["fajr"]) + 1440 };
  })() : null;

  const prevPrayer = times && nextPrayer ? (() => {
    const idx = PRAYER_LIST_5.findIndex(p => p.key === nextPrayer.key);
    const prev = PRAYER_LIST_5[(idx - 1 + PRAYER_LIST_5.length) % PRAYER_LIST_5.length];
    return { ...prev, min: timeToMin(times[prev.key]) };
  })() : null;

  const toggleBell = (key: string, i: 0|1|2) => {
    setBells(prev => {
      const arr = [...prev[key]] as [boolean,boolean,boolean];
      arr[i] = !arr[i];
      return { ...prev, [key]: arr };
    });
  };

  const handleEnableNotif = async () => {
    const granted = await requestNotifPermission();
    setNotifStatus(granted ? "granted" : "denied");
    if (granted && times) scheduleNotifications(times, lang);
  };

  // Kicker label — single font, WCAG-safe slate, no uppercase
  const kicker = (light = false): React.CSSProperties => ({
    fontFamily: UI, fontSize: "0.82rem", fontWeight: 600,
    letterSpacing: "0.03em",
    color: light ? "rgba(212,168,67,0.8)" : "#64748b",
    marginBottom: 4,
  });

  const cardBase: React.CSSProperties = {
    borderRadius: 18, overflow: "hidden",
    boxShadow: "0 2px 12px rgba(0,0,0,0.07)", cursor: "pointer",
  };

  // Date strings
  const hijriLine = isAr
    ? `${toArNums(hijri.day)} ${hijri.monthAr} ${toArNums(hijri.year)}`
    : `${hijri.day} ${hijri.month} ${hijri.year}`;

  const gregLine = isAr
    ? `${toArNums(now.getDate())} / ${toArNums(now.getMonth()+1)} / ${toArNums(now.getFullYear())}`
    : `${MONTHS_EN[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`;

  // Surah name — always locale-correct
  const surahDisplay = lastRead
    ? (isAr ? (lastRead.surahNameAr || lastRead.surahName) : lastRead.surahName)
    : null;

  return (
    <div dir={isAr ? "rtl" : "ltr"} style={{ minHeight: "100vh", background: "#FDFBF7", fontFamily: UI, color: "#1a1a2e" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Scheherazade+New:wght@400;700&family=DM+Sans:wght@400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        .tap:active { opacity: 0.82; }
        button { font-family: inherit; }
      `}</style>

      {/* ── HEADER ── */}
      <div style={{ background: "#2c3e6b", padding: "36px 20px 12px", textAlign: "center", position: "relative" }}>

        {/* Settings gear — top right of header */}
        <button onClick={() => onNavigate("settings")}
          style={{ position: "absolute", top: 42, [isAr ? "left" : "right"]: 16, background: "rgba(255,255,255,0.12)", border: "none", color: "rgba(245,240,232,0.7)", width: 36, height: 36, borderRadius: "50%", fontSize: "1rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          ⚙️
        </button>

        {/* Line 1: Day، Hijri — large gold, single UI font */}
        <div style={{ fontFamily: UI, fontSize: "1.45rem", fontWeight: 700, color: "#d4a843", lineHeight: 1.3 }}>
          {isAr ? `${dayName}، ${hijriLine}` : `${dayName} – ${hijriLine}`}
        </div>

        {/* Line 2: Gregorian — larger, higher contrast than before */}
        <div style={{ fontFamily: UI, fontSize: "1rem", color: "rgba(245,240,232,0.82)", marginTop: 5 }}>
          {gregLine}
        </div>

        {/* Line 3: Location */}
        {locationName && (
          <div style={{ fontFamily: UI, fontSize: "0.85rem", color: "rgba(245,240,232,0.5)", marginTop: 5, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
            <span>📍</span><span>{locationName}</span>
          </div>
        )}
      </div>

      {/* ── BODY ── */}
      <div style={{ padding: "14px 14px 100px", display: "flex", flexDirection: "column", gap: 14 }}>

        {/* No location banner */}
        {noLocation && (
          <div className="tap" onClick={() => onNavigate("settings")}
            style={{ background: "#fffbec", border: "1px solid #e8d04c", borderRadius: 16, padding: "14px 18px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
            <span style={{ fontSize: "1.4rem" }}>📍</span>
            <div style={{ flex: 1, fontFamily: UI, fontSize: "0.95rem", color: "#7a5800", lineHeight: 1.5 }}>{t.locationNotSet} — {t.locationDesc}</div>
            <span style={{ background: "#2c3e6b", color: "#f5f0e8", fontFamily: UI, fontSize: "0.85rem", fontWeight: 600, padding: "8px 14px", borderRadius: 8, whiteSpace: "nowrap" }}>{t.setUp}</span>
          </div>
        )}

        {/* Notification enable — only if undecided */}
        {notifStatus === "unknown" && times && (
          <div style={{ background: "#2c3e6b", borderRadius: 16, padding: "12px 18px", display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: "1.3rem" }}>🔔</span>
            <div style={{ flex: 1, fontFamily: UI, fontSize: "0.88rem", color: "rgba(245,240,232,0.85)", lineHeight: 1.4 }}>
              {isAr ? "فعّل الإشعارات لتلقي تنبيهات أوقات الصلاة" : "Enable notifications for prayer time alerts"}
            </div>
            <button onClick={handleEnableNotif}
              style={{ background: "#d4a843", border: "none", borderRadius: 8, color: "#1a1a2e", fontFamily: UI, fontSize: "0.85rem", fontWeight: 700, padding: "8px 14px", cursor: "pointer", whiteSpace: "nowrap" }}>
              {isAr ? "تفعيل" : "Enable"}
            </button>
          </div>
        )}
        {notifStatus === "denied" && (
          <div style={{ background: "rgba(180,60,60,0.08)", border: "1px solid rgba(180,60,60,0.2)", borderRadius: 14, padding: "10px 16px", fontFamily: UI, fontSize: "0.82rem", color: "#8b2020" }}>
            {isAr ? "⚠ تم رفض الإشعارات — يمكنك تفعيلها من إعدادات المتصفح" : "⚠ Notifications blocked — enable in browser settings"}
          </div>
        )}

        {/* ── CARD 1: Prayer ── */}
        {times && nextPrayer && (
          <div style={{ ...cardBase, background: "linear-gradient(160deg, #2c3e6b 0%, #1a2a4a 100%)" }}>
            <div style={{ padding: "18px 20px 16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                {/* Prayer name in UI font — not serif */}
                <div style={{ fontFamily: UI, fontSize: "2rem", fontWeight: 700, color: "#d4a843", lineHeight: 1 }}>
                  {isAr ? nextPrayer.ar : nextPrayer.en}
                </div>
                <PrayerCountdown targetMin={nextPrayer.min} isAr={isAr} fontSize="1.9rem" color="#f5f0e8" />
              </div>

              {prevPrayer && <ProgressBar prevMin={prevPrayer.min} nextMin={nextPrayer.min} nowMin={nowMin} />}

              {/* Ghost button */}
              <div style={{ display: "flex", justifyContent: "center", marginTop: 14 }}>
                <button onClick={e => { e.stopPropagation(); setExpanded(v => !v); }}
                  style={{
                    background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.22)",
                    borderRadius: 20, color: "rgba(255,255,255,0.85)",
                    fontFamily: UI, fontSize: "0.9rem", fontWeight: 500,
                    padding: "7px 28px", cursor: "pointer", backdropFilter: "blur(4px)",
                  }}>
                  {expanded ? (isAr ? "إظهار أقل ▲" : "Show less ▲") : (isAr ? "إظهار المزيد ▼" : "Show more ▼")}
                </button>
              </div>
            </div>

            {/* Expandable schedule */}
            <div style={{ overflow: "hidden", maxHeight: expanded ? 700 : 0, transition: "max-height 0.35s ease" }}>
              <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", background: "rgba(0,0,0,0.18)" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 72px", padding: "8px 16px 4px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                  <div />
                  {[isAr ? "قبل" : "Before", isAr ? "أذان" : "Azan", isAr ? "بعد" : "After"].map(h => (
                    <div key={h} style={{ fontFamily: UI, fontSize: "0.75rem", color: "rgba(245,240,232,0.45)", textAlign: "center" }}>{h}</div>
                  ))}
                  <div style={{ fontFamily: UI, fontSize: "0.75rem", color: "rgba(245,240,232,0.45)", textAlign: "center" }}>{isAr ? "الوقت" : "Time"}</div>
                </div>
                {PRAYER_LIST.map(p => {
                  const isCur = nextPrayer.key === p.key;
                  const b = bells[p.key] ?? [false, false, false];
                  const timeStr = isAr ? times[p.key].replace(/\d/g, d => HINDI[+d]) : times[p.key];
                  return (
                    <div key={p.key} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 72px", alignItems: "center", padding: "9px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)", background: isCur ? "rgba(255,255,255,0.08)" : "transparent" }}>
                      <div style={{ fontFamily: UI, fontSize: "1.1rem", fontWeight: isCur ? 700 : 500, color: isCur ? "#d4a843" : "rgba(245,240,232,0.88)" }}>
                        {isAr ? p.ar : p.en}
                      </div>
                      {([0, 1, 2] as (0|1|2)[]).map(i => (
                        <div key={i} style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
                          <button onClick={e => { e.stopPropagation(); toggleBell(p.key, i); }}
                            style={{ background: "none", border: "none", cursor: "pointer", padding: "4px", fontSize: "1.3rem", color: b[i] ? "#d4a843" : "rgba(245,240,232,0.2)", lineHeight: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            {b[i] ? "🔔" : "🔕"}
                          </button>
                        </div>
                      ))}
                      <div style={{ direction: "ltr", fontFamily: "'Courier New', monospace", fontSize: "1.1rem", fontWeight: isCur ? 700 : 400, color: isCur ? "#d4a843" : "rgba(245,240,232,0.75)", textAlign: "center" }}>
                        {timeStr}
                      </div>
                    </div>
                  );
                })}
                <div style={{ height: 10 }} />
              </div>
            </div>
          </div>
        )}

        {/* ── CARD 2: Continue Reading — elevated, gold border ── */}
        <div className="tap" onClick={() => onNavigate("quran")} style={{
          ...cardBase, background: "#fff",
          border: "1.5px solid rgba(212,168,67,0.45)",
          boxShadow: "0 4px 18px rgba(44,62,107,0.13)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "0 18px", height: CARD_H }}>
            <div style={{ width: 4, height: 52, background: "#d4a843", borderRadius: 2, flexShrink: 0 }} />
            <span style={{ fontSize: "2.2rem", flexShrink: 0 }}>📖</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={kicker()}>{t.continueReading}</div>
              {surahDisplay ? (
                <>
                  {/* Surah name — locale-correct, large */}
                  <div style={{ fontFamily: UI, fontSize: "1.45rem", fontWeight: 700, color: "#1a1a2e", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {surahDisplay}
                  </div>
                  <div style={{ fontFamily: UI, fontSize: "0.88rem", color: "#64748b", marginTop: 2 }}>
                    {t.page} {isAr ? toArNums(lastRead!.page) : lastRead!.page}
                  </div>
                </>
              ) : (
                <div style={{ fontFamily: UI, fontSize: "1.45rem", fontWeight: 700, color: "#1a1a2e" }}>{t.startReading}</div>
              )}
            </div>
            <span style={{ color: "#d4a843", fontSize: "1.5rem", flexShrink: 0, fontWeight: 300 }}>{isAr ? "‹" : "›"}</span>
          </div>
        </div>

        {/* ── CARD 3: Smart Azkar ── */}
        <div style={{ ...cardBase, background: "linear-gradient(135deg, #2c3e6b, #1a2a4a)" }} className="tap" onClick={() => onNavigate("azkar")}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "0 18px", height: CARD_H }}>
            <span style={{ fontSize: "2rem", flexShrink: 0 }}>{azkarCard.icon}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={kicker(true)}>{t.nowAzkar}</div>
              <div style={{ fontFamily: UI, fontSize: "1.5rem", fontWeight: 700, color: "#d4a843", lineHeight: 1.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {isAr ? azkarCard.ar : azkarCard.en}
              </div>
              <div style={{ fontFamily: UI, fontSize: "0.88rem", color: "rgba(245,240,232,0.65)", marginTop: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {azkarCard.desc}
              </div>
            </div>
            <span style={{ color: "rgba(212,168,67,0.5)", fontSize: "1.4rem", flexShrink: 0 }}>{isAr ? "‹" : "›"}</span>
          </div>
        </div>

        {/* ── CARD 4: Ayah of the day ── */}
        <div style={{ ...cardBase, background: "#fff" }} className="tap" onClick={() => onNavigate("quran")}>
          <div style={{ padding: "16px 20px" }}>
            <div style={kicker()}>{t.ayahOfDay}</div>

            {isAr ? (
              // Arabic mode: Ayah primary (large, Quran font), translation secondary
              <>
                <div style={{ fontFamily: QUR, fontSize: "1.75rem", color: "#2c3e6b", direction: "rtl", lineHeight: 2.0, marginBottom: 8 }}>
                  {inspiration.ar}
                </div>
                <div style={{ fontFamily: UI, fontStyle: "italic", fontSize: "0.92rem", color: "#64748b", lineHeight: 1.6, marginBottom: 5 }}>
                  "{inspiration.en}"
                </div>
                <div style={{ fontFamily: UI, fontSize: "0.85rem", color: "#d4a843", fontWeight: 600 }}>
                  — {AR_CITATION[inspiration.source] ?? inspiration.source}
                </div>
              </>
            ) : (
              // English mode: translation primary (large, bold), Arabic secondary (smaller)
              <>
                <div style={{ fontFamily: UI, fontSize: "1.15rem", fontWeight: 600, color: "#1a1a2e", lineHeight: 1.6, marginBottom: 10 }}>
                  "{inspiration.en}"
                </div>
                <div style={{ fontFamily: QUR, fontSize: "1.3rem", color: "#2c3e6b", direction: "rtl", lineHeight: 1.9, marginBottom: 6 }}>
                  {inspiration.ar}
                </div>
                <div style={{ fontFamily: UI, fontSize: "0.85rem", color: "#d4a843", fontWeight: 600 }}>
                  — {inspiration.source}
                </div>
              </>
            )}
          </div>
        </div>

      </div>

      {/* ── BOTTOM DOCK — Settings removed, Audio added ── */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "#fff", borderTop: "1px solid #ede8e0", display: "flex", padding: "8px 0 20px", boxShadow: "0 -4px 16px rgba(0,0,0,0.07)", zIndex: 100 }}>
        {[
          { key: "home",   icon: "🏠", label: t.home,   active: true,  disabled: false },
          { key: "quran",  icon: "📖", label: t.quran,  active: false, disabled: false },
          { key: "prayer", icon: "🕌", label: t.prayer, active: false, disabled: false },
          { key: "azkar",  icon: "📿", label: t.azkar,  active: false, disabled: false },
          { key: "audio",  icon: "🎧", label: isAr ? "الصوت" : "Audio", active: false, disabled: true },
        ].map(btn => (
          <button key={btn.key} disabled={btn.disabled} onClick={() => !btn.disabled && onNavigate(btn.key)}
            style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, background: "none", border: "none", cursor: btn.disabled ? "not-allowed" : "pointer", padding: "6px 2px", opacity: btn.disabled ? 0.4 : 1, WebkitTapHighlightColor: "transparent" }}>
            <span style={{ fontSize: "1.5rem", filter: btn.active ? "none" : "grayscale(0%)" }}>
              {btn.icon}
            </span>
            <span style={{ fontFamily: UI, fontSize: "0.78rem", color: btn.active ? "#2c3e6b" : "#64748b", fontWeight: btn.active ? 700 : 400 }}>
              {btn.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
