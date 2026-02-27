import { useState, useEffect, useRef, memo } from "react";
import { computeTimes, toHijri, timeToMin, PRAYER_LIST_5, loadPrefs } from "./prayerUtils";
import { getLang, T } from "./langStore";

// ─── Isolated countdown — only this re-renders every second, nothing else ───
const PrayerCountdown = memo(({ targetMin }: { targetMin: number }) => {
  const [display, setDisplay] = useState("");
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);

  const calc = () => {
    const n = new Date();
    const nowSec = n.getHours() * 3600 + n.getMinutes() * 60 + n.getSeconds();
    let diff = targetMin * 60 - nowSec;
    if (diff < 0) diff += 86400;
    const h = Math.floor(diff / 3600);
    const m = Math.floor((diff % 3600) / 60);
    const s = diff % 60;
    return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
  };

  useEffect(() => {
    setDisplay(calc());
    ref.current = setInterval(() => setDisplay(calc()), 1000);
    return () => { if (ref.current) clearInterval(ref.current); };
  }, [targetMin]);

  return (
    <div style={{
      fontFamily: "'DM Sans', monospace",
      fontSize: "3.2rem",
      color: "#f5f0e8",
      fontWeight: 700,
      lineHeight: 1,
      letterSpacing: "0.06em",
      fontVariantNumeric: "tabular-nums",
      // Fixed width prevents layout shift as digits change
      minWidth: "100%",
      textAlign: "center",
    }}>
      {display}
    </div>
  );
});

// ─── Notification helpers ─────────────────────────────────────────────────────
async function requestNotifPermission(): Promise<boolean> {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const result = await Notification.requestPermission();
  return result === "granted";
}

function scheduleNotifications(times: Record<string, string>, lang: string) {
  // Store scheduled timeouts in sessionStorage keys so we don't double-schedule
  const isAr = lang === "ar";
  const prayers = [
    { key: "fajr",    arName: "الفجر",   enName: "Fajr"    },
    { key: "dhuhr",   arName: "الظهر",   enName: "Dhuhr"   },
    { key: "asr",     arName: "العصر",   enName: "Asr"     },
    { key: "maghrib", arName: "المغرب",  enName: "Maghrib" },
    { key: "isha",    arName: "العشاء",  enName: "Isha"    },
  ];
  const now = new Date();
  const nowSec = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();

  prayers.forEach(p => {
    if (!times[p.key]) return;
    const [ph, pm] = times[p.key].split(":").map(Number);
    const prayerSec = ph * 3600 + pm * 60;
    let diff = prayerSec - nowSec;
    if (diff < 0) diff += 86400; // next day
    if (diff > 86400) return;

    setTimeout(() => {
      if (Notification.permission === "granted") {
        new Notification(isAr ? `حان وقت ${p.arName}` : `Time for ${p.enName}`, {
          body: isAr ? "حان وقت الصلاة" : "Prayer time has arrived",
          icon: "/favicon.ico",
          badge: "/favicon.ico",
          tag: p.key, // prevents duplicate notifications
        });
      }
    }, diff * 1000);
  });
}

// ─── Static data ─────────────────────────────────────────────────────────────
const INSPIRATIONS = [
  { ar: "إِنَّ مَعَ الْعُسْرِ يُسْرًا",                                                      source: "Ash-Sharh 6",   en: "Indeed, with hardship comes ease." },
  { ar: "وَمَن يَتَوَكَّلْ عَلَى اللَّهِ فَهُوَ حَسْبُهُ",                                  source: "At-Talaq 3",    en: "Whoever relies upon Allah — He is sufficient for him." },
  { ar: "فَاذْكُرُونِي أَذْكُرْكُمْ",                                                         source: "Al-Baqarah 152",en: "Remember Me, and I will remember you." },
  { ar: "إِنَّ اللَّهَ مَعَ الصَّابِرِينَ",                                                   source: "Al-Baqarah 153",en: "Indeed, Allah is with the patient." },
  { ar: "وَقُل رَّبِّ زِدْنِي عِلْمًا",                                                       source: "Ta-Ha 114",     en: "Say: My Lord, increase me in knowledge." },
  { ar: "حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ",                                              source: "Al Imran 173",  en: "Allah is sufficient for us, and He is the best Guardian." },
  { ar: "رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً",                source: "Al-Baqarah 201",en: "Our Lord, give us good in this world and good in the Hereafter." },
];

function getAzkarCard(h: number, t: typeof T.en) {
  if (h >= 4  && h < 8)  return { icon: "🌅", ar: "أذكار الصباح",     desc: t.morningDesc };
  if (h >= 8  && h < 12) return { icon: "☀️", ar: "أذكار الضحى",      desc: t.duhaDesc };
  if (h >= 12 && h < 15) return { icon: "🕌", ar: "أذكار بعد الصلاة", desc: t.afterPrayerDesc };
  if (h >= 15 && h < 18) return { icon: "🌇", ar: "أذكار المساء",     desc: t.eveningDesc };
  if (h >= 18 && h < 21) return { icon: "🌆", ar: "أذكار المغرب",     desc: t.afterMaghribDesc };
  return                         { icon: "🌙", ar: "أذكار النوم",      desc: t.sleepDesc };
}

function toArNums(s: string | number) {
  return String(s).replace(/\d/g, d => "٠١٢٣٤٥٦٧٨٩"[+d]);
}

const WEEKDAYS_EN = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const WEEKDAYS_AR = ["الأحد","الاثنين","الثلاثاء","الأربعاء","الخميس","الجمعة","السبت"];
const CARD_H = 88;

export default function HomeScreen({ onNavigate }: { onNavigate: (s: string) => void }) {
  // now only updates every minute — no per-second re-render of whole screen
  const [now, setNow]           = useState(new Date());
  const [times, setTimes]       = useState<Record<string, string> | null>(null);
  const [locationName, setLoc]  = useState("");
  const [noLocation, setNoLoc]  = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [lastRead, setLastRead] = useState<{ page: number; surahName: string } | null>(null);
  const [notifStatus, setNotifStatus] = useState<"unknown"|"granted"|"denied"|"unsupported">("unknown");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const lang   = getLang() || "en";
  const t      = T[lang];
  const isAr   = lang === "ar";
  const uiFont = isAr ? "'Scheherazade New', serif" : "'DM Sans', sans-serif";

  const inspiration = INSPIRATIONS[now.getDate() % INSPIRATIONS.length];
  const azkarCard   = getAzkarCard(now.getHours(), t);

  // ── Minute timer — whole screen only re-renders once per minute
  useEffect(() => {
    timerRef.current = setInterval(() => setNow(new Date()), 60000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  // ── Load prefs + data
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
    // Check notification permission state
    if (!("Notification" in window)) setNotifStatus("unsupported");
    else setNotifStatus(Notification.permission === "granted" ? "granted" : Notification.permission === "denied" ? "denied" : "unknown");
  }, []);

  // ── Schedule notifications when times load
  useEffect(() => {
    if (times && notifStatus === "granted") {
      scheduleNotifications(times, lang);
    }
  }, [times, notifStatus]);

  const hijri  = toHijri(now);
  const nowMin = now.getHours() * 60 + now.getMinutes();

  const hijriMonthIdx = ["مُحَرَّم","صَفَر","رَبيع الأوَّل","رَبيع الثاني","جُمادى الأولى","جُمادى الآخرة","رَجَب","شَعبان","رَمَضان","شَوَّال","ذو القَعدة","ذو الحِجَّة"].indexOf(hijri.monthAr);

  const nextPrayer = times ? (() => {
    for (const p of PRAYER_LIST_5) {
      const m = timeToMin(times[p.key]);
      if (m > nowMin) return { ...p, min: m, time: times[p.key] };
    }
    return { ...PRAYER_LIST_5[0], min: timeToMin(times["fajr"]) + 1440, time: times["fajr"] };
  })() : null;

  const dayName = isAr ? WEEKDAYS_AR[now.getDay()] : WEEKDAYS_EN[now.getDay()];

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
      `}</style>

      {/* ── HEADER ── */}
      <div style={{ background: "#2c3e6b", padding: "48px 18px 8px" }}>
        <div dir={isAr ? "rtl" : "ltr"} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          {/* START: day name + "8 Ramadan" */}
          <div>
            <div style={{ fontFamily: uiFont, fontSize: "1.45rem", fontWeight: 700, color: "#d4a843", lineHeight: 1.25 }}>
              {dayName}
            </div>
            <div style={{ fontFamily: isAr ? "'Scheherazade New', serif" : uiFont, fontSize: "1.45rem", fontWeight: 700, color: "#d4a843", lineHeight: 1.25 }}>
              {isAr ? `${toArNums(hijri.day)} ${hijri.monthAr}` : `${hijri.day} ${hijri.month}`}
            </div>
          </div>
          {/* END: numeric dates */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: isAr ? "flex-start" : "flex-end" }}>
            <div style={{ fontFamily: isAr ? "'Scheherazade New', serif" : uiFont, fontSize: "1.45rem", fontWeight: 700, color: "#d4a843", lineHeight: 1.25 }}>
              {isAr
                ? `${toArNums(hijri.day)}/${toArNums(hijriMonthIdx + 1)}/${toArNums(hijri.year)}`
                : `${hijri.day}/${hijriMonthIdx + 1}/${hijri.year}`}
            </div>
            <div style={{ fontFamily: uiFont, fontSize: "1.45rem", fontWeight: 700, color: "#d4a843", lineHeight: 1.25 }}>
              {isAr
                ? `${toArNums(now.getDate())}/${toArNums(now.getMonth()+1)}/${toArNums(now.getFullYear())}`
                : `${now.getDate()}/${now.getMonth()+1}/${now.getFullYear()}`}
            </div>
          </div>
        </div>
        {/* Location — always LTR, always left */}
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

        {/* ── Notification enable banner ── */}
        {notifStatus === "unknown" && times && (
          <div style={{ background: "#2c3e6b", borderRadius: 14, padding: "12px 18px", display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: "1.4rem" }}>🔔</span>
            <div style={{ flex: 1, fontFamily: uiFont, fontSize: "0.9rem", color: "rgba(245,240,232,0.85)", lineHeight: 1.4 }}>
              {isAr ? "فعّل الإشعارات لتلقي تنبيهات أوقات الصلاة" : "Enable notifications to get prayer time alerts"}
            </div>
            <button onClick={handleEnableNotif}
              style={{ background: "#d4a843", border: "none", borderRadius: 8, color: "#1a1a2e", fontFamily: uiFont, fontSize: "0.85rem", fontWeight: 700, padding: "8px 14px", cursor: "pointer", whiteSpace: "nowrap" }}>
              {isAr ? "تفعيل" : "Enable"}
            </button>
          </div>
        )}
        {notifStatus === "denied" && (
          <div style={{ background: "rgba(180,60,60,0.12)", border: "1px solid rgba(180,60,60,0.3)", borderRadius: 14, padding: "10px 16px", fontFamily: uiFont, fontSize: "0.82rem", color: "#8b2020" }}>
            {isAr ? "⚠ تم رفض الإشعارات — يمكنك تفعيلها من إعدادات المتصفح" : "⚠ Notifications blocked — enable them in browser settings"}
          </div>
        )}
        {notifStatus === "granted" && (
          <div style={{ background: "rgba(44,107,70,0.1)", border: "1px solid rgba(44,107,70,0.25)", borderRadius: 14, padding: "10px 16px", fontFamily: uiFont, fontSize: "0.82rem", color: "#1a5c33" }}>
            🔔 {isAr ? "الإشعارات مفعلة — ستتلقى تنبيهاً عند كل أذان" : "Notifications enabled — you'll be alerted at each prayer time"}
          </div>
        )}

        {/* ── CARD 1: Prayer ── */}
        {times && nextPrayer && (
          <div style={{ ...cardBase, background: "linear-gradient(160deg, #2c3e6b 0%, #1a2a4a 100%)" }} className="tap"
            onClick={() => onNavigate("prayer")}>

            {/* Prayer name */}
            <div style={{ textAlign: "center", paddingTop: 18 }}>
              <span style={{ fontFamily: "'Scheherazade New', serif", fontSize: "2.6rem", color: "#d4a843", lineHeight: 1 }}>
                {nextPrayer.ar}
              </span>
              {!isAr && (
                <div style={{ fontFamily: uiFont, fontSize: "1rem", color: "rgba(245,240,232,0.5)", marginTop: 2 }}>
                  {nextPrayer.en}
                </div>
              )}
            </div>

            {/* Countdown — isolated component, only it re-renders every second */}
            <div style={{ padding: "8px 20px 4px" }}>
              <PrayerCountdown targetMin={nextPrayer.min} />
            </div>

            {/* Full schedule toggle */}
            <div style={{ textAlign: "center", padding: "10px 20px 16px" }}
              onClick={e => { e.stopPropagation(); setExpanded(v => !v); }}>
              <span style={{ fontFamily: uiFont, fontSize: "0.95rem", color: "#ffffff", fontWeight: 500, cursor: "pointer" }}>
                {expanded ? `▲ ${t.hideSchedule}` : `▼ ${t.fullSchedule}`}
              </span>
            </div>

            {/* Expanded schedule */}
            <div style={{ overflow: "hidden", maxHeight: expanded ? 500 : 0, transition: "max-height 0.4s ease", background: "rgba(0,0,0,0.15)" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", padding: "8px 14px 14px", gap: 4 }}>
                {PRAYER_LIST_5.map(p => {
                  const pm = timeToMin(times[p.key]);
                  const isCur = nextPrayer.key === p.key;
                  const past  = pm >= 0 && pm < nowMin && !isCur;
                  return (
                    <div key={p.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", borderRadius: 10, background: isCur ? "rgba(255,255,255,0.12)" : "transparent", opacity: past ? 0.35 : 1 }}>
                      <span style={{ fontFamily: "'Scheherazade New', serif", fontSize: "1.2rem", color: isCur ? "#d4a843" : "rgba(245,240,232,0.8)" }}>{p.ar}</span>
                      <span style={{ fontFamily: uiFont, fontSize: "1rem", fontWeight: isCur ? 700 : 400, color: isCur ? "#d4a843" : "rgba(245,240,232,0.7)" }}>{times[p.key]}</span>
                    </div>
                  );
                })}
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
          <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "0 20px", minHeight: CARD_H }}>
            <div style={{ flex: 1, padding: "14px 0" }}>
              <div style={lbl()}>{t.ayahOfDay}</div>
              <div style={{ fontFamily: "'Scheherazade New', serif", fontSize: "1.45rem", color: "#2c3e6b", direction: "rtl", lineHeight: 1.7, marginBottom: 6 }}>{inspiration.ar}</div>
              <div style={{ fontFamily: uiFont, fontStyle: "italic", fontSize: "0.88rem", color: "#777", lineHeight: 1.45, marginBottom: 4 }}>"{inspiration.en}"</div>
              <div style={{ fontFamily: uiFont, fontSize: "0.82rem", color: "#d4a843" }}>— {inspiration.source}</div>
            </div>
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
