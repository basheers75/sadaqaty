import { useState, useEffect, useRef, memo } from "react";
import { computeTimes, toHijri, timeToMin, PRAYER_LIST, loadPrefs } from "./prayerUtils";
import { getLang, T } from "./langStore";

// ── Same fixed-digit countdown as HomeScreen ──────────────────────────────────
const PrayerCountdown = memo(({ targetMin }: { targetMin: number }) => {
  const [parts, setParts] = useState({ h1:"0",h2:"0",m1:"0",m2:"0",s1:"0",s2:"0" });
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);

  const calc = () => {
    const n = new Date();
    const nowSec = n.getHours() * 3600 + n.getMinutes() * 60 + n.getSeconds();
    let diff = targetMin * 60 - nowSec;
    if (diff < 0) diff += 86400;
    const h = Math.floor(diff / 3600);
    const m = Math.floor((diff % 3600) / 60);
    const s = diff % 60;
    const hh = String(h).padStart(2,"0");
    const mm = String(m).padStart(2,"0");
    const ss = String(s).padStart(2,"0");
    return { h1:hh[0], h2:hh[1], m1:mm[0], m2:mm[1], s1:ss[0], s2:ss[1] };
  };

  useEffect(() => {
    setParts(calc());
    ref.current = setInterval(() => setParts(calc()), 1000);
    return () => { if (ref.current) clearInterval(ref.current); };
  }, [targetMin]);

  const D = ({ v }: { v: string }) => (
    <span style={{ display:"inline-block", width:"1ch", textAlign:"center", fontVariantNumeric:"tabular-nums" }}>{v}</span>
  );
  const Sep = () => <span style={{ display:"inline-block", width:"0.5ch", textAlign:"center" }}>:</span>;

  return (
    <div style={{ fontFamily:"'Courier New', Courier, monospace", fontSize:"3.2rem", color:"#f5f0e8", fontWeight:700, lineHeight:1, textAlign:"center", width:"100%", letterSpacing:0 }}>
      <D v={parts.h1}/><D v={parts.h2}/><Sep/><D v={parts.m1}/><D v={parts.m2}/><Sep/><D v={parts.s1}/><D v={parts.s2}/>
    </div>
  );
});

// ── Bell icon — filled or outline ─────────────────────────────────────────────
const Bell = ({ on, onClick }: { on: boolean; onClick: () => void }) => (
  <button onClick={onClick} style={{ background:"none", border:"none", cursor:"pointer", padding:"4px 8px", fontSize:"1.4rem", color: on ? "#d4a843" : "rgba(245,240,232,0.25)", lineHeight:1 }}>
    {on ? "🔔" : "🔕"}
  </button>
);

// ── Progress bar between two prayer times ────────────────────────────────────
function ProgressBar({ prevMin, nextMin, nowMin }: { prevMin:number; nextMin:number; nowMin:number }) {
  const total = nextMin > prevMin ? nextMin - prevMin : nextMin + 1440 - prevMin;
  const elapsed = nowMin >= prevMin ? nowMin - prevMin : nowMin + 1440 - prevMin;
  const pct = Math.min(100, Math.max(0, (elapsed / total) * 100));
  return (
    <div style={{ height:4, background:"rgba(255,255,255,0.15)", borderRadius:2, margin:"10px 0 4px" }}>
      <div style={{ height:"100%", width:`${pct}%`, background:"#d4a843", borderRadius:2, transition:"width 1s linear" }} />
    </div>
  );
}

const WEEKDAYS_EN = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const WEEKDAYS_AR = ["الأحد","الاثنين","الثلاثاء","الأربعاء","الخميس","الجمعة","السبت"];

export default function PrayerTimesScreen({ onHome, onSettings }: { onHome: () => void; onSettings: () => void }) {
  const [now, setNow]       = useState(new Date());
  const [times, setTimes]   = useState<Record<string,string> | null>(null);
  const [locName, setLoc]   = useState("");
  const [noLoc, setNoLoc]   = useState(false);
  const [expanded, setExpanded] = useState(false);
  // Notification bells state per prayer: before / azan / after
  const [bells, setBells]   = useState<Record<string, [boolean,boolean,boolean]>>({
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
  const uiFont = isAr ? "'Scheherazade New', serif" : "'DM Sans', sans-serif";

  useEffect(() => {
    timerRef.current = setInterval(() => setNow(new Date()), 60000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  useEffect(() => {
    const prefs = loadPrefs();
    if (prefs) {
      setTimes(computeTimes(new Date(), prefs.lat, prefs.lng, prefs.method, prefs.asrFactor, prefs.offsets ?? {}));
      setLoc(prefs.locationName);
    } else { setNoLoc(true); }
  }, []);

  useEffect(() => {
    const prefs = loadPrefs();
    if (prefs) setTimes(computeTimes(now, prefs.lat, prefs.lng, prefs.method, prefs.asrFactor, prefs.offsets ?? {}));
  }, [now]);

  const nowMin = now.getHours() * 60 + now.getMinutes();

  const PRAYERS_5 = PRAYER_LIST.filter(p => p.key !== "sunrise");

  const nextPrayer = times ? (() => {
    for (const p of PRAYERS_5) {
      const m = timeToMin(times[p.key]);
      if (m > nowMin) return { ...p, min: m };
    }
    return { ...PRAYERS_5[0], min: timeToMin(times["fajr"]) + 1440 };
  })() : null;

  // Previous prayer for progress bar
  const prevPrayer = times && nextPrayer ? (() => {
    const idx = PRAYERS_5.findIndex(p => p.key === nextPrayer.key);
    const prevIdx = (idx - 1 + PRAYERS_5.length) % PRAYERS_5.length;
    return { ...PRAYERS_5[prevIdx], min: timeToMin(times[PRAYERS_5[prevIdx].key]) };
  })() : null;

  const toggleBell = (key: string, i: 0|1|2) => {
    setBells(prev => {
      const next = [...prev[key]] as [boolean,boolean,boolean];
      next[i] = !next[i];
      return { ...prev, [key]: next };
    });
  };

  const hijri = toHijri(now);
  const dayName = isAr ? WEEKDAYS_AR[now.getDay()] : WEEKDAYS_EN[now.getDay()];

  return (
    <div dir={isAr ? "rtl" : "ltr"} style={{ minHeight:"100vh", background:"#f5f0e8", fontFamily: uiFont, color:"#1a1a2e" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Scheherazade+New:wght@400;700&family=DM+Sans:wght@300;400;500;600&display=swap');
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
      `}</style>

      {/* ── Header ── */}
      <div style={{ background:"#2c3e6b", padding:"52px 20px 18px", display:"flex", alignItems:"center", gap:12 }}>
        <button onClick={onHome} style={{ background:"rgba(255,255,255,0.1)", border:"none", color:"#f5f0e8", fontSize:"1.4rem", width:38, height:38, borderRadius:"50%", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
          {isAr ? "›" : "‹"}
        </button>
        <div style={{ flex:1 }}>
          <div style={{ fontFamily:"'Scheherazade New', serif", fontSize:"1.1rem", color:"#d4a843" }}>
            {hijri.day} {isAr ? hijri.monthAr : hijri.month} {hijri.year}
          </div>
          <div style={{ fontSize:"0.82rem", color:"rgba(245,240,232,0.5)", marginTop:2 }}>
            {dayName} · {now.getDate()}/{now.getMonth()+1}/{now.getFullYear()}
          </div>
          {locName && <div style={{ fontSize:"0.78rem", color:"rgba(245,240,232,0.38)", marginTop:4 }}>📍 {locName}</div>}
        </div>
        <button onClick={onSettings} style={{ background:"rgba(255,255,255,0.1)", border:"none", color:"rgba(245,240,232,0.6)", width:36, height:36, borderRadius:"50%", fontSize:"0.95rem", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>⚙</button>
      </div>

      <div style={{ padding:"16px 14px 40px", display:"flex", flexDirection:"column", gap:12 }}>

        {/* No location */}
        {noLoc && (
          <div onClick={onSettings} style={{ background:"#fffbec", border:"1px solid #e8d04c", borderRadius:14, padding:"16px 18px", display:"flex", alignItems:"center", gap:12, cursor:"pointer" }}>
            <span style={{ fontSize:"1.5rem" }}>📍</span>
            <div style={{ flex:1, fontSize:"0.95rem", color:"#7a5800" }}>{t.locationNotSet}. {t.locationDesc}</div>
          </div>
        )}

        {/* ── Main prayer card ── */}
        {times && nextPrayer && (
          <div style={{ background:"linear-gradient(160deg, #2c3e6b 0%, #1a2a4a 100%)", borderRadius:18, overflow:"hidden", boxShadow:"0 4px 16px rgba(44,62,107,0.25)" }}>

            {/* Top: prayer name + countdown */}
            <div style={{ padding:"20px 22px 0" }}>
              {/* Name row */}
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                <div>
                  <div style={{ fontFamily:"'Scheherazade New', serif", fontSize:"2.8rem", color:"#d4a843", lineHeight:1 }}>
                    {nextPrayer.ar}
                  </div>
                  {!isAr && <div style={{ fontSize:"0.95rem", color:"rgba(245,240,232,0.45)", marginTop:2 }}>{nextPrayer.en}</div>}
                </div>
                <div style={{ textAlign:"right" }}>
                  <PrayerCountdown targetMin={nextPrayer.min} />
                </div>
              </div>

              {/* Progress bar */}
              {prevPrayer && (
                <ProgressBar
                  prevMin={prevPrayer.min}
                  nextMin={nextPrayer.min}
                  nowMin={nowMin}
                />
              )}
              <div style={{ fontSize:"0.78rem", color:"rgba(245,240,232,0.35)", marginBottom:14 }}>
                {isAr ? "جاري التحميل..." : "Loading..."}
              </div>
            </div>

            {/* Show more / less button */}
            <div style={{ display:"flex", justifyContent:"center", padding:"0 22px 14px", gap:16, alignItems:"center" }}>
              <button style={{ background:"none", border:"none", color:"rgba(245,240,232,0.45)", fontSize:"1.2rem", cursor:"pointer" }}>‹</button>
              <button onClick={() => setExpanded(v => !v)}
                style={{ background:"#c0392b", border:"none", borderRadius:20, color:"#fff", fontFamily: uiFont, fontSize:"0.95rem", fontWeight:600, padding:"8px 28px", cursor:"pointer" }}>
                {expanded ? (isAr ? "إظهار أقل" : "Show less") : (isAr ? "إظهار المزيد" : "Show more")}
              </button>
              <button style={{ background:"none", border:"none", color:"rgba(245,240,232,0.45)", fontSize:"1.2rem", cursor:"pointer" }}>›</button>
            </div>

            {/* Expandable schedule with bells */}
            <div style={{ overflow:"hidden", maxHeight: expanded ? 600 : 0, transition:"max-height 0.4s ease" }}>
              <div style={{ background:"rgba(0,0,0,0.2)", padding:"8px 0 8px" }}>

                {/* Column headers */}
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr auto", padding:"4px 22px 8px", borderBottom:"1px solid rgba(255,255,255,0.08)" }}>
                  <div />
                  <div style={{ fontFamily: uiFont, fontSize:"0.72rem", color:"rgba(245,240,232,0.4)", textAlign:"center", letterSpacing:"0.05em" }}>{isAr ? "قبل" : "Before"}</div>
                  <div style={{ fontFamily: uiFont, fontSize:"0.72rem", color:"rgba(245,240,232,0.4)", textAlign:"center", letterSpacing:"0.05em" }}>{isAr ? "أذان" : "Azan"}</div>
                  <div style={{ fontFamily: uiFont, fontSize:"0.72rem", color:"rgba(245,240,232,0.4)", textAlign:"center", letterSpacing:"0.05em" }}>{isAr ? "بعد" : "After"}</div>
                  <div style={{ fontFamily: uiFont, fontSize:"0.72rem", color:"rgba(245,240,232,0.4)", minWidth:60, textAlign:"center" }}>{isAr ? "الوقت" : "Time"}</div>
                </div>

                {/* Prayer rows */}
                {PRAYER_LIST.map(p => {
                  const pm = timeToMin(times[p.key]);
                  const isCur = nextPrayer.key === p.key;
                  const past  = pm >= 0 && pm < nowMin && !isCur;
                  const b = bells[p.key] ?? [false,false,false];
                  return (
                    <div key={p.key} style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr auto", alignItems:"center", padding:"6px 22px", background: isCur ? "rgba(255,255,255,0.07)" : "transparent", opacity: past ? 0.38 : 1 }}>
                      {/* Name */}
                      <div style={{ fontFamily:"'Scheherazade New', serif", fontSize:"1.2rem", color: isCur ? "#d4a843" : "rgba(245,240,232,0.85)" }}>
                        {isAr ? p.ar : p.en}
                      </div>
                      {/* Before bell */}
                      <div style={{ display:"flex", justifyContent:"center" }}>
                        <Bell on={b[0]} onClick={() => toggleBell(p.key, 0)} />
                      </div>
                      {/* Azan bell */}
                      <div style={{ display:"flex", justifyContent:"center" }}>
                        <Bell on={b[1]} onClick={() => toggleBell(p.key, 1)} />
                      </div>
                      {/* After bell */}
                      <div style={{ display:"flex", justifyContent:"center" }}>
                        <Bell on={b[2]} onClick={() => toggleBell(p.key, 2)} />
                      </div>
                      {/* Time */}
                      <div style={{ fontFamily: uiFont, fontSize:"1rem", fontWeight: isCur ? 700 : 500, color: isCur ? "#d4a843" : "rgba(245,240,232,0.7)", minWidth:60, textAlign:"center" }}>
                        {times[p.key]}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
