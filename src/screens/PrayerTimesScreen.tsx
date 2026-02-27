import { useState, useEffect, useRef } from "react";
import { computeTimes, toHijri, timeToMin, PRAYER_LIST, loadPrefs } from "./prayerUtils";
import { getLang, T } from "./langStore";

const WEEKDAYS_EN = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const WEEKDAYS_AR = ["الأحد","الاثنين","الثلاثاء","الأربعاء","الخميس","الجمعة","السبت"];
const MONTHS_EN = ["January","February","March","April","May","June","July","August","September","October","November","December"];

export default function PrayerTimesScreen({ onHome, onSettings }: { onHome: () => void; onSettings: () => void }) {
  const [now, setNow]     = useState(new Date());
  const [times, setTimes] = useState<Record<string,string> | null>(null);
  const [locName, setLoc] = useState("");
  const [noLoc, setNoLoc] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const lang = getLang() || "en";
  const t    = T[lang];
  const isAr = lang === "ar";

  useEffect(() => {
    timerRef.current = setInterval(() => setNow(new Date()), 15000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  useEffect(() => {
    const prefs = loadPrefs();
    if (prefs) {
      setTimes(computeTimes(new Date(), prefs.lat, prefs.lng, prefs.method, prefs.asrFactor, prefs.offsetMin ?? 0));
      setLoc(prefs.locationName);
    } else { setNoLoc(true); }
  }, []);

  useEffect(() => {
    const prefs = loadPrefs();
    if (prefs) setTimes(computeTimes(now, prefs.lat, prefs.lng, prefs.method, prefs.asrFactor, prefs.offsetMin ?? 0));
  }, [now]);

  const hijri  = toHijri(now);
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const dayName  = isAr ? WEEKDAYS_AR[now.getDay()] : WEEKDAYS_EN[now.getDay()];
  const gregDate = isAr
    ? `${now.getDate()} / ${now.getMonth()+1} / ${now.getFullYear()}`
    : `${MONTHS_EN[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`;

  const nextPrayer = times ? (() => {
    const list = PRAYER_LIST.filter(p => p.key !== "sunrise");
    for (const p of list) {
      const m = timeToMin(times[p.key]);
      if (m > nowMin) return { ...p, min: m };
    }
    return { ...list[0], min: timeToMin(times["fajr"]) + 1440 };
  })() : null;

  function countdown(targetMin: number) {
    let diff = targetMin - nowMin;
    if (diff < 0) diff += 1440;
    const h = Math.floor(diff / 60), m = diff % 60;
    return h > 0 ? `${h}h ${String(m).padStart(2,"0")}m` : `${m}m`;
  }

  return (
    <div dir={isAr ? "rtl" : "ltr"} style={{ minHeight: "100vh", background: "#f5f0e8", fontFamily: isAr ? "'Scheherazade New', serif" : "'DM Sans', sans-serif", color: "#1a1a2e" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Scheherazade+New:wght@400;700&family=DM+Sans:wght@300;400;500;600&family=Lora:wght@400&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
      `}</style>

      {/* Header */}
      <div style={{ background: "#2c3e6b", padding: "52px 20px 18px", display: "flex", alignItems: "center", gap: 12, position: "relative" }}>
        <button onClick={onHome} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "#f5f0e8", fontSize: "1.4rem", width: 38, height: 38, borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          {isAr ? "›" : "‹"}
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "'Scheherazade New', serif", fontSize: "1.1rem", color: "#d4a843" }}>{hijri.day} {hijri.monthAr} {hijri.year} هـ</div>
          <div style={{ fontSize: "0.82rem", color: "rgba(245,240,232,0.5)", marginTop: 2 }}>{dayName}، {gregDate}</div>
          {locName && <div style={{ fontSize: "0.78rem", color: "rgba(245,240,232,0.38)", marginTop: 4 }}>📍 {locName}</div>}
        </div>
        <button onClick={onSettings} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "rgba(245,240,232,0.6)", width: 36, height: 36, borderRadius: "50%", fontSize: "0.95rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>⚙</button>
      </div>

      <div style={{ padding: "16px 16px 40px", display: "flex", flexDirection: "column", gap: 14 }}>

        {/* No location */}
        {noLoc && (
          <div onClick={onSettings} style={{ background: "#fffbec", border: "1px solid #e8d04c", borderRadius: 14, padding: "16px 18px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
            <span style={{ fontSize: "1.5rem" }}>📍</span>
            <div style={{ flex: 1, fontSize: "0.95rem", color: "#7a5800" }}>{t.locationNotSet}. {t.locationDesc}</div>
            <button onClick={onSettings} style={{ background: "#2c3e6b", border: "none", color: "#f5f0e8", fontFamily: "inherit", fontSize: "0.85rem", fontWeight: 500, padding: "8px 14px", borderRadius: 8, cursor: "pointer" }}>{t.settings}</button>
          </div>
        )}

        {/* Next prayer hero */}
        {times && nextPrayer && (
          <div style={{ background: "linear-gradient(135deg, #2c3e6b 0%, #1a2a4a 100%)", borderRadius: 18, padding: "24px 24px 20px", display: "flex", justifyContent: "space-between", alignItems: "flex-end", boxShadow: "0 4px 16px rgba(44,62,107,0.25)", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: -40, [isAr ? "left" : "right"]: -40, width: 180, height: 180, borderRadius: "50%", border: "1px solid rgba(212,168,67,0.12)", pointerEvents: "none" }} />
            <div style={{ position: "absolute", top: -70, [isAr ? "left" : "right"]: -70, width: 260, height: 260, borderRadius: "50%", border: "1px solid rgba(212,168,67,0.06)", pointerEvents: "none" }} />
            <div style={{ position: "relative", zIndex: 1 }}>
              <div style={{ fontSize: "0.7rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(212,168,67,0.65)", marginBottom: 8 }}>{t.nextPrayer}</div>
              <div style={{ fontFamily: "'Scheherazade New', serif", fontSize: "3rem", color: "#d4a843", lineHeight: 1 }}>{nextPrayer.ar}</div>
              <div style={{ fontSize: "0.9rem", color: "rgba(245,240,232,0.55)", marginTop: 4 }}>{nextPrayer.en}</div>
            </div>
            <div style={{ textAlign: isAr ? "left" : "right", position: "relative", zIndex: 1 }}>
              <div style={{ fontSize: "0.68rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(245,240,232,0.35)", marginBottom: 4 }}>{t.in}</div>
              <div style={{ fontFamily: "'Lora', serif", fontSize: "2.8rem", color: "#f5f0e8", fontWeight: 400, lineHeight: 1 }}>{countdown(nextPrayer.min)}</div>
              <div style={{ fontSize: "0.88rem", color: "rgba(212,168,67,0.65)", marginTop: 5 }}>{t.at} {times[nextPrayer.key]}</div>
            </div>
          </div>
        )}

        {/* Full prayer list */}
        {times && (
          <div style={{ background: "#fff", borderRadius: 18, overflow: "hidden", boxShadow: "0 2px 10px rgba(0,0,0,0.06)" }}>
            <div style={{ fontSize: isAr ? "1rem" : "0.72rem", fontWeight: 600, letterSpacing: isAr ? 0 : "0.1em", textTransform: isAr ? "none" : "uppercase", color: "#2c3e6b", padding: "16px 20px 10px" }}>{t.todaySchedule}</div>
            {PRAYER_LIST.map(p => {
              const pm = timeToMin(times[p.key]);
              const isCur = nextPrayer?.key === p.key;
              const past  = pm >= 0 && pm < nowMin && !isCur;
              return (
                <div key={p.key} style={{ display: "flex", alignItems: "center", padding: "14px 20px", borderBottom: "1px solid #f5f0e8", background: isCur ? "rgba(44,62,107,0.06)" : "transparent", opacity: past ? 0.38 : 1 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: isCur ? "#2c3e6b" : "#e8e0d5", marginRight: isAr ? 0 : 16, marginLeft: isAr ? 16 : 0, flexShrink: 0, boxShadow: isCur ? "0 0 6px rgba(44,62,107,0.5)" : "none" }} />
                  <span style={{ fontFamily: "'Scheherazade New', serif", fontSize: "1.25rem", color: "#2c3e6b", width: 80 }}>{p.ar}</span>
                  <span style={{ flex: 1, fontSize: "0.85rem", color: "#aaa" }}>{p.en}</span>
                  <span style={{ fontSize: "1.15rem", fontWeight: isCur ? 700 : 500, color: isCur ? "#2c3e6b" : "#1a1a2e", letterSpacing: "0.03em" }}>{times[p.key]}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
