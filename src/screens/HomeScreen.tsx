import { useState, useEffect, useRef, memo } from "react";
import { computeTimes, toHijri, timeToMin, PRAYER_LIST_5, PRAYER_LIST, loadPrefs } from "./prayerUtils";
import { getLang, T } from "./langStore";

// ── Numeral helpers ───────────────────────────────────────────────────────────
const HINDI = "٠١٢٣٤٥٦٧٨٩";
function toHindi(s: string) { return s.replace(/\d/g, d => HINDI[+d]); }
function toArNums(s: string | number) { return String(s).replace(/\d/g, d => HINDI[+d]); }

// ── Countdown — direction always LTR internally so digits never flip in RTL ───
const PrayerCountdown = memo(({ targetMin, isAr, fontSize = "1.7rem", color = "#1a1a2e" }: {
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
      direction: "ltr",       // always LTR — digits must never reverse
      fontFamily: "'Courier New', Courier, monospace",
      fontSize,
      color,
      fontWeight: 700,
      lineHeight: 1,
      letterSpacing: "0.02em",
      fontVariantNumeric: "tabular-nums",
      whiteSpace: "nowrap",
    }}>
      {str}
    </div>
  );
});

// ── Progress bar ──────────────────────────────────────────────────────────────
function ProgressBar({ prevMin, nextMin, nowMin }: { prevMin: number; nextMin: number; nowMin: number }) {
  const total = nextMin > prevMin ? nextMin - prevMin : nextMin + 1440 - prevMin;
  const elapsed = nowMin >= prevMin ? nowMin - prevMin : nowMin + 1440 - prevMin;
  const pct = Math.min(100, Math.max(0, (elapsed / total) * 100));
  return (
    <div style={{ height: 5, background: "rgba(44,62,107,0.1)", borderRadius: 3, margin: "10px 0 0" }}>
      <div style={{ height: "100%", width: `${pct}%`, background: "#d4a843", borderRadius: 3 }} />
    </div>
  );
}

// ── Bell ─────────────────────────────────────────────────────────────────────
const Bell = ({ on, onClick }: { on: boolean; onClick: () => void }) => (
  <button onClick={e => { e.stopPropagation(); onClick(); }}
    style={{ background: "none", border: "none", cursor: "pointer", padding: "2px 5px", fontSize: "1.15rem", color: on ? "#c0392b" : "rgba(0,0,0,0.15)", lineHeight: 1 }}>
    {on ? "🔔" : "🔕"}
  </button>
);

// ── Notification helpers ──────────────────────────────────────────────────────
async function requestNotifPermission(): Promise<boolean> {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const result = await Notification.requestPermission();
  return result === "granted";
}

// Track scheduled timeouts so we can cancel and re-schedule if needed
const scheduledTimers: ReturnType<typeof setTimeout>[] = [];

function scheduleNotifications(times: Record<string, string>, lang: string) {
  // Clear any previously scheduled timers
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

  const now = new Date();
  const nowMs = now.getTime();

  prayers.forEach(p => {
    const timeStr = times[p.key];
    if (!timeStr) return;

    // Parse HH:MM — robust to "1:05" or "13:05"
    const parts = timeStr.trim().split(":");
    if (parts.length < 2) return;
    const ph = parseInt(parts[0], 10);
    const pm = parseInt(parts[1], 10);
    if (isNaN(ph) || isNaN(pm)) return;

    // Build a Date object for this prayer time today
    const prayerDate = new Date();
    prayerDate.setHours(ph, pm, 0, 0);

    // If already passed today, schedule for tomorrow
    let diffMs = prayerDate.getTime() - nowMs;
    if (diffMs < 0) diffMs += 24 * 60 * 60 * 1000;

    // Don't schedule if more than 24h away
    if (diffMs > 24 * 60 * 60 * 1000) return;

    console.log(`[Notif] Scheduling ${p.enName} in ${Math.round(diffMs/1000/60)} minutes (at ${timeStr})`);

    const id = setTimeout(() => {
      console.log(`[Notif] Firing notification for ${p.enName}`);
      if (Notification.permission === "granted") {
        new Notification(
          isAr ? `حان وقت ${p.arName}` : `Time for ${p.enName}`,
          {
            body: isAr ? "حان وقت الصلاة" : "Prayer time has arrived",
            icon: "/favicon.ico",
            tag: p.key,
            requireInteraction: true, // stays on screen until dismissed
          }
        );
      }
    }, diffMs);

    scheduledTimers.push(id);
  });

  console.log(`[Notif] Scheduled ${scheduledTimers.length} notifications`);
}

// ── Static data ───────────────────────────────────────────────────────────────
const INSPIRATIONS = [
  { ar: "إِنَّ مَعَ الْعُسْرِ يُسْرًا",                                         source: "Ash-Sharh 6",    en: "Indeed, with hardship comes ease." },
  { ar: "وَمَن يَتَوَكَّلْ عَلَى اللَّهِ فَهُوَ حَسْبُهُ",                     source: "At-Talaq 3",     en: "Whoever relies upon Allah — He is sufficient for him." },
  { ar: "فَاذْكُرُونِي أَذْكُرْكُمْ",                                            source: "Al-Baqarah 152", en: "Remember Me, and I will remember you." },
  { ar: "إِنَّ اللَّهَ مَعَ الصَّابِرِينَ",                                      source: "Al-Baqarah 153", en: "Indeed, Allah is with the patient." },
  { ar: "وَقُل رَّبِّ زِدْنِي عِلْمًا",                                          source: "Ta-Ha 114",      en: "Say: My Lord, increase me in knowledge." },
  { ar: "حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ",                                 source: "Al Imran 173",   en: "Allah is sufficient for us, and He is the best Guardian." },
  { ar: "رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً",   source: "Al-Baqarah 201", en: "Our Lord, give us good in this world and good in the Hereafter." },
];

function getAzkarCard(h: number, t: typeof T.en) {
  if (h >= 4  && h < 8)  return { icon: "🌅", ar: "أذكار الصباح",     desc: t.morningDesc };
  if (h >= 8  && h < 12) return { icon: "☀️", ar: "أذكار الضحى",      desc: t.duhaDesc };
  if (h >= 12 && h < 15) return { icon: "🕌", ar: "أذكار بعد الصلاة", desc: t.afterPrayerDesc };
  if (h >= 15 && h < 18) return { icon: "🌇", ar: "أذكار المساء",     desc: t.eveningDesc };
  if (h >= 18 && h < 21) return { icon: "🌆", ar: "أذكار المغرب",     desc: t.afterMaghribDesc };
  return                         { icon: "🌙", ar: "أذكار النوم",      desc: t.sleepDesc };
}

const WEEKDAYS_EN = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const WEEKDAYS_AR = ["الأحد","الاثنين","الثلاثاء","الأربعاء","الخميس","الجمعة","السبت"];
const HIJRI_MONTHS_AR = ["مُحَرَّم","صَفَر","رَبيع الأوَّل","رَبيع الثاني","جُمادى الأولى","جُمادى الآخرة","رَجَب","شَعبان","رَمَضان","شَوَّال","ذو القَعدة","ذو الحِجَّة"];
const CARD_H = 88;

export default function HomeScreen({ onNavigate }: { onNavigate: (s: string) => void }) {
  const [now, setNow]           = useState(new Date());
  const [times, setTimes]       = useState<Record<string, string> | null>(null);
  const [locationName, setLoc]  = useState("");
  const [noLocation, setNoLoc]  = useState(false);
  const [lastRead, setLastRead] = useState<{ page: number; surahName: string } | null>(null);
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

  const lang   = getLang() || "en";
  const t      = T[lang];
  const isAr   = lang === "ar";
  const uiFont = isAr ? "'Scheherazade New', serif" : "'DM Sans', sans-serif";

  const inspiration = INSPIRATIONS[now.getDate() % INSPIRATIONS.length];
  const azkarCard   = getAzkarCard(now.getHours(), t);

  useEffect(() => {
    timerRef.current = setInterval(() => setNow(new Date()), 60000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  useEffect(() => {
    const prefs = loadPrefs();
    if (prefs) {
      const t2 = computeTimes(new Date(), prefs.lat, prefs.lng, prefs.method, prefs.asrFactor, prefs.offsets ?? {});
      setTimes(t2);
      setLoc(prefs.locationName);
    } else {
      setNoLoc(true);
    }
    try {
      const raw = localStorage.getItem("quran_last_position");
      if (raw) {
        const pos = JSON.parse(raw);
        if (pos?.page) setLastRead({ page: pos.page, surahName: pos.surahName || "" });
      }
    } catch {}
    if (!("Notification" in window)) setNotifStatus("unsupported");
    else setNotifStatus(Notification.permission === "granted" ? "granted" : Notification.permission === "denied" ? "denied" : "unknown");
  }, []);

  // ── Schedule notifications — only when times loaded AND permission confirmed
  useEffect(() => {
    if (times && notifStatus === "granted") {
      scheduleNotifications(times, lang);
    }
  }, [times, notifStatus, lang]);

  const hijri        = toHijri(now);
  const nowMin       = now.getHours() * 60 + now.getMinutes();
  const hijriMonthIdx = HIJRI_MONTHS_AR.indexOf(hijri.monthAr);
  const dayName      = isAr ? WEEKDAYS_AR[now.getDay()] : WEEKDAYS_EN[now.getDay()];

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

  const cardBase: React.CSSProperties = {
    borderRadius: 18, overflow: "hidden",
    boxShadow: "0 2px 10px rgba(0,0,0,0.07)", cursor: "pointer",
  };
  const lbl = (light = false): React.CSSProperties => ({
    fontFamily: uiFont,
    fontSize: isAr ? "0.95rem" : "0.72rem",
    letterSpacing: isAr ? 0 : "0.07em",
    textTransform: isAr ? "none" : "uppercase",
    color: light ? "rgba(212,168,67,0.65)" : "#aaa",
    marginBottom: 4,
  });

  return (
    <div dir={isAr ? "rtl" : "ltr"} style={{ minHeight: "100vh", background: "#f5f0e8", fontFamily: uiFont, color: "#1a1a2e" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Scheherazade+New:wght@400;700&family=DM+Sans:wght@400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        .tap:active { opacity: 0.82; }
        button { font-family: inherit; }
      `}</style>

      {/* ── HEADER ── */}
      <div style={{ background: "#2c3e6b", padding: "48px 18px 8px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontFamily: uiFont, fontSize: "1.45rem", fontWeight: 700, color: "#d4a843", lineHeight: 1.25 }}>{dayName}</div>
            <div style={{ fontFamily: "'Scheherazade New', serif", fontSize: "1.45rem", fontWeight: 700, color: "#d4a843", lineHeight: 1.25 }}>
              {isAr ? `${toArNums(hijri.day)} ${hijri.monthAr}` : `${hijri.day} ${hijri.month}`}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: isAr ? "flex-start" : "flex-end" }}>
            <div style={{ fontFamily: isAr ? "'Scheherazade New', serif" : uiFont, fontSize: "1.45rem", fontWeight: 700, color: "#d4a843", lineHeight: 1.25 }}>
              {isAr
                ? `${toArNums(hijri.day)}/${toArNums(hijriMonthIdx + 1)}/${toArNums(hijri.year)}`
                : `${hijri.day}/${hijriMonthIdx + 1}/${hijri.year}`}
            </div>
            <div style={{ fontFamily: isAr ? "'Scheherazade New', serif" : uiFont, fontSize: "1.45rem", fontWeight: 700, color: "#d4a843", lineHeight: 1.25, direction: "ltr" }}>
              {isAr
                ? `${toArNums(now.getDate())}/${toArNums(now.getMonth()+1)}/${toArNums(now.getFullYear())}`
                : `${now.getDate()}/${now.getMonth()+1}/${now.getFullYear()}`}
            </div>
          </div>
        </div>
        {locationName && (
          <div style={{ fontFamily: uiFont, fontSize: "0.95rem", color: "rgba(245,240,232,0.82)", display: "flex", alignItems: "center", gap: 4, marginTop: 6, direction: "ltr" }}>
            <span>📍</span><span>{locationName}</span>
          </div>
        )}
      </div>

      {/* ── BODY ── */}
      <div style={{ padding: "12px 14px 100px", display: "flex", flexDirection: "column", gap: 10 }}>

        {/* No location banner */}
        {noLocation && (
          <div className="tap" onClick={() => onNavigate("settings")}
            style={{ background: "#fffbec", border: "1px solid #e8d04c", borderRadius: 14, padding: "14px 18px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
            <span style={{ fontSize: "1.5rem" }}>📍</span>
            <div style={{ flex: 1, fontFamily: uiFont, fontSize: "0.95rem", color: "#7a5800", lineHeight: 1.5 }}>{t.locationNotSet} — {t.locationDesc}</div>
            <span style={{ background: "#2c3e6b", color: "#f5f0e8", fontFamily: uiFont, fontSize: "0.88rem", fontWeight: 600, padding: "8px 14px", borderRadius: 8, whiteSpace: "nowrap" }}>{t.setUp}</span>
          </div>
        )}

        {/* Notification banner */}
        {notifStatus === "unknown" && times && (
          <div style={{ background: "#2c3e6b", borderRadius: 14, padding: "12px 18px", display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: "1.4rem" }}>🔔</span>
            <div style={{ flex: 1, fontSize: "0.9rem", color: "rgba(245,240,232,0.85)", lineHeight: 1.4 }}>
              {isAr ? "فعّل الإشعارات لتلقي تنبيهات أوقات الصلاة" : "Enable notifications to get prayer time alerts"}
            </div>
            <button onClick={handleEnableNotif}
              style={{ background: "#d4a843", border: "none", borderRadius: 8, color: "#1a1a2e", fontSize: "0.85rem", fontWeight: 700, padding: "8px 14px", cursor: "pointer", whiteSpace: "nowrap" }}>
              {isAr ? "تفعيل" : "Enable"}
            </button>
          </div>
        )}
        {notifStatus === "denied" && (
          <div style={{ background: "rgba(180,60,60,0.1)", border: "1px solid rgba(180,60,60,0.25)", borderRadius: 14, padding: "10px 16px", fontSize: "0.82rem", color: "#8b2020" }}>
            {isAr ? "⚠ تم رفض الإشعارات — يمكنك تفعيلها من إعدادات المتصفح" : "⚠ Notifications blocked — enable in browser settings"}
          </div>
        )}
        {notifStatus === "granted" && (
          <div style={{ background: "rgba(44,107,70,0.1)", border: "1px solid rgba(44,107,70,0.2)", borderRadius: 14, padding: "10px 16px", fontSize: "0.82rem", color: "#1a5c33" }}>
            🔔 {isAr ? "الإشعارات مفعلة — ستتلقى تنبيهاً عند كل أذان" : "Notifications enabled — you'll be alerted at each prayer time"}
          </div>
        )}

        {/* ── CARD 1: Prayer — navy background ── */}
        {times && nextPrayer && (
          <div style={{ ...cardBase, background: "linear-gradient(160deg, #2c3e6b 0%, #1a2a4a 100%)" }}>

            {/* Top always-visible section */}
            <div style={{ padding: "18px 20px 16px" }}>

              {/* Prayer name + countdown */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontFamily: "'Scheherazade New', serif", fontSize: "2.4rem", color: "#d4a843", lineHeight: 1 }}>
                  {isAr ? nextPrayer.ar : nextPrayer.en}
                </div>
                <PrayerCountdown targetMin={nextPrayer.min} isAr={isAr} fontSize="1.9rem" color="#f5f0e8" />
              </div>

              {/* Progress bar */}
              {prevPrayer && <ProgressBar prevMin={prevPrayer.min} nextMin={nextPrayer.min} nowMin={nowMin} />}

              {/* Show more / less */}
              <div style={{ display: "flex", justifyContent: "center", marginTop: 14 }}>
                <button onClick={e => { e.stopPropagation(); setExpanded(v => !v); }}
                  style={{ background: "#c0392b", border: "none", borderRadius: 20, color: "#fff", fontSize: "0.95rem", fontWeight: 600, padding: "8px 28px", cursor: "pointer" }}>
                  {expanded ? (isAr ? "إظهار أقل" : "Show less") : (isAr ? "إظهار المزيد" : "Show more")}
                </button>
              </div>
            </div>

            {/* Expandable bell schedule */}
            <div style={{ overflow: "hidden", maxHeight: expanded ? 700 : 0, transition: "max-height 0.35s ease" }}>
              <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", background: "rgba(0,0,0,0.18)" }}>

                {/* Column headers */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 72px", padding: "8px 16px 4px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                  <div />
                  {[isAr ? "قبل" : "Before", isAr ? "أذان" : "Azan", isAr ? "بعد" : "After"].map(h => (
                    <div key={h} style={{ fontFamily: uiFont, fontSize: "0.8rem", color: "rgba(245,240,232,0.45)", textAlign: "center" }}>{h}</div>
                  ))}
                  <div style={{ fontFamily: uiFont, fontSize: "0.8rem", color: "rgba(245,240,232,0.45)", textAlign: "center" }}>{isAr ? "الوقت" : "Time"}</div>
                </div>

                {/* Prayer rows — all full opacity */}
                {PRAYER_LIST.map(p => {
                  const isCur = nextPrayer.key === p.key;
                  const b = bells[p.key] ?? [false, false, false];
                  const timeStr = isAr
                    ? times[p.key].replace(/\d/g, d => "٠١٢٣٤٥٦٧٨٩"[+d])
                    : times[p.key];
                  return (
                    <div key={p.key} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 72px", alignItems: "center", padding: "9px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)", background: isCur ? "rgba(255,255,255,0.08)" : "transparent" }}>
                      {/* Name */}
                      <div style={{ fontFamily: "'Scheherazade New', serif", fontSize: "1.25rem", color: isCur ? "#d4a843" : "rgba(245,240,232,0.88)", fontWeight: isCur ? 700 : 400 }}>
                        {isAr ? p.ar : p.en}
                      </div>
                      {/* Bells — centered */}
                      {([0, 1, 2] as (0|1|2)[]).map(i => (
                        <div key={i} style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
                          <button onClick={e => { e.stopPropagation(); toggleBell(p.key, i); }}
                            style={{ background: "none", border: "none", cursor: "pointer", padding: "4px", fontSize: "1.35rem", color: b[i] ? "#d4a843" : "rgba(245,240,232,0.2)", lineHeight: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            {b[i] ? "🔔" : "🔕"}
                          </button>
                        </div>
                      ))}
                      {/* Time with Hindi numerals in AR */}
                      <div style={{ direction: "ltr", fontFamily: "'Courier New', monospace", fontSize: "1rem", fontWeight: isCur ? 700 : 400, color: isCur ? "#d4a843" : "rgba(245,240,232,0.65)", textAlign: "center" }}>
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

        {/* ── CARD 2: Continue reading ── */}
        <div style={{ ...cardBase, background: "#fff" }} className="tap" onClick={() => onNavigate("quran")}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "0 20px", height: CARD_H }}>
            <span style={{ fontSize: "1.9rem", flexShrink: 0 }}>📖</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={lbl()}>{t.continueReading}</div>
              {lastRead ? (
                <>
                  <div style={{ fontFamily: uiFont, fontSize: "1.15rem", fontWeight: 600, color: "#1a1a2e", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{lastRead.surahName}</div>
                  <div style={{ fontFamily: uiFont, fontSize: "0.9rem", color: "#999", marginTop: 2 }}>{t.page} {isAr ? toArNums(lastRead.page) : lastRead.page}</div>
                </>
              ) : (
                <div style={{ fontFamily: uiFont, fontSize: "1.15rem", fontWeight: 600, color: "#1a1a2e" }}>{t.startReading}</div>
              )}
            </div>
            <span style={{ color: "#ddd", fontSize: "1.4rem", flexShrink: 0 }}>{isAr ? "‹" : "›"}</span>
          </div>
        </div>

        {/* ── CARD 3: Azkar ── */}
        <div style={{ ...cardBase, background: "linear-gradient(135deg, #2c3e6b, #1a2a4a)" }} className="tap" onClick={() => onNavigate("azkar")}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "0 20px", height: CARD_H }}>
            <span style={{ fontSize: "2rem", flexShrink: 0 }}>{azkarCard.icon}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={lbl(true)}>{t.nowAzkar}</div>
              <div style={{ fontFamily: "'Scheherazade New', serif", fontSize: "1.5rem", color: "#d4a843", lineHeight: 1.15, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{azkarCard.ar}</div>
              <div style={{ fontFamily: uiFont, fontSize: "0.88rem", color: "rgba(245,240,232,0.45)", marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{azkarCard.desc}</div>
            </div>
            <span style={{ color: "rgba(212,168,67,0.35)", fontSize: "1.4rem", flexShrink: 0 }}>{isAr ? "‹" : "›"}</span>
          </div>
        </div>

        {/* ── CARD 4: Ayah of the day ── */}
        <div style={{ ...cardBase, background: "#fff" }} className="tap" onClick={() => onNavigate("quran")}>
          <div style={{ padding: "14px 20px" }}>
            <div style={lbl()}>{t.ayahOfDay}</div>
            <div style={{ fontFamily: "'Scheherazade New', serif", fontSize: "1.45rem", color: "#2c3e6b", direction: "rtl", lineHeight: 1.7, marginBottom: 6 }}>{inspiration.ar}</div>
            <div style={{ fontFamily: uiFont, fontStyle: "italic", fontSize: "0.88rem", color: "#777", lineHeight: 1.45, marginBottom: 4 }}>"{inspiration.en}"</div>
            <div style={{ fontFamily: uiFont, fontSize: "0.82rem", color: "#d4a843" }}>— {inspiration.source}</div>
          </div>
        </div>

      </div>

      {/* ── BOTTOM DOCK ── */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "#fff", borderTop: "1px solid #ede8e0", display: "flex", padding: "8px 0 20px", boxShadow: "0 -4px 16px rgba(0,0,0,0.07)", zIndex: 100 }}>
        {[
          { key: "home",     icon: "🏠", label: t.home,     active: true,  disabled: false },
          { key: "quran",    icon: "📖", label: t.quran,    active: false, disabled: false },
          { key: "prayer",   icon: "🕌", label: t.prayer,   active: false, disabled: false },
          { key: "azkar",    icon: "📿", label: t.azkar,    active: false, disabled: true  },
          { key: "settings", icon: "⚙️", label: t.settings, active: false, disabled: false },
        ].map(btn => (
          <button key={btn.key} disabled={btn.disabled} onClick={() => !btn.disabled && onNavigate(btn.key)}
            style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, background: "none", border: "none", cursor: btn.disabled ? "not-allowed" : "pointer", padding: "6px 2px", opacity: btn.disabled ? 0.3 : 1, WebkitTapHighlightColor: "transparent" }}>
            <span style={{ fontSize: "1.5rem", color: btn.active ? "#2c3e6b" : "#bbb" }}>{btn.icon}</span>
            <span style={{ fontFamily: uiFont, fontSize: isAr ? "0.88rem" : "0.7rem", color: btn.active ? "#2c3e6b" : "#bbb", fontWeight: btn.active ? 600 : 400 }}>{btn.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
