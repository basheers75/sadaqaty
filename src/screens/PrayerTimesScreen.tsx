import { useState, useEffect, useRef, memo } from "react";
import { computeTimes, toHijri, timeToMin, PRAYER_LIST, loadPrefs } from "./prayerUtils";
import { getLang, T } from "./langStore";

// ── Fixed-digit countdown, zero layout shift ──────────────────────────────────
const PrayerCountdown = memo(({ targetMin }: { targetMin: number }) => {
  const [p, setP] = useState({ h1:"0",h2:"0",m1:"0",m2:"0",s1:"0",s2:"0" });
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);

  const calc = () => {
    const n = new Date();
    const nowSec = n.getHours()*3600 + n.getMinutes()*60 + n.getSeconds();
    let diff = targetMin*60 - nowSec;
    if (diff < 0) diff += 86400;
    const h = String(Math.floor(diff/3600)).padStart(2,"0");
    const m = String(Math.floor((diff%3600)/60)).padStart(2,"0");
    const s = String(diff%60).padStart(2,"0");
    return { h1:h[0],h2:h[1],m1:m[0],m2:m[1],s1:s[0],s2:s[1] };
  };

  useEffect(() => {
    setP(calc());
    ref.current = setInterval(() => setP(calc()), 1000);
    return () => { if (ref.current) clearInterval(ref.current); };
  }, [targetMin]);

  const D = ({ v }: { v:string }) => (
    <span style={{ display:"inline-block", width:"0.62em", textAlign:"center" }}>{v}</span>
  );
  const C = () => <span style={{ display:"inline-block", width:"0.3em", textAlign:"center" }}>:</span>;

  return (
    <div style={{ fontFamily:"'Courier New',Courier,monospace", fontSize:"2.2rem", color:"#f5f0e8", fontWeight:700, lineHeight:1, letterSpacing:0 }}>
      <D v={p.h1}/><D v={p.h2}/><C/><D v={p.m1}/><D v={p.m2}/><C/><D v={p.s1}/><D v={p.s2}/>
    </div>
  );
});

// ── Progress bar ──────────────────────────────────────────────────────────────
function ProgressBar({ prevMin, nextMin, nowMin }: { prevMin:number; nextMin:number; nowMin:number }) {
  const total = nextMin > prevMin ? nextMin - prevMin : nextMin + 1440 - prevMin;
  const elapsed = nowMin >= prevMin ? nowMin - prevMin : nowMin + 1440 - prevMin;
  const pct = Math.min(100, Math.max(0, (elapsed/total)*100));
  return (
    <div style={{ height:5, background:"rgba(255,255,255,0.15)", borderRadius:3 }}>
      <div style={{ height:"100%", width:`${pct}%`, background:"#d4a843", borderRadius:3, transition:"width 30s linear" }}/>
    </div>
  );
}

// ── Bell toggle ───────────────────────────────────────────────────────────────
const Bell = ({ on, onClick }: { on:boolean; onClick:()=>void }) => (
  <button onClick={onClick} style={{ background:"none", border:"none", cursor:"pointer", padding:"2px 6px", fontSize:"1.25rem", color: on ? "#d4a843" : "rgba(245,240,232,0.2)", lineHeight:1, display:"flex", alignItems:"center", justifyContent:"center" }}>
    {on ? "🔔" : "🔕"}
  </button>
);

const WKDAYS_EN = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const WKDAYS_AR = ["الأحد","الاثنين","الثلاثاء","الأربعاء","الخميس","الجمعة","السبت"];

export default function PrayerTimesScreen({ onHome, onSettings }: { onHome:()=>void; onSettings:()=>void }) {
  const [now, setNow]     = useState(new Date());
  const [times, setTimes] = useState<Record<string,string>|null>(null);
  const [locName, setLoc] = useState("");
  const [noLoc, setNoLoc] = useState(false);
  const [expanded, setExp] = useState(false);
  const [bells, setBells] = useState<Record<string,[boolean,boolean,boolean]>>({
    fajr:    [true, true, true],
    sunrise: [false,false,false],
    dhuhr:   [true, true, true],
    asr:     [true, true, true],
    maghrib: [true, true, true],
    isha:    [true, true, true],
  });
  const timerRef = useRef<ReturnType<typeof setInterval>|null>(null);

  const lang   = getLang() || "en";
  const t      = T[lang];
  const isAr   = lang === "ar";
  const uiFont = isAr ? "'Scheherazade New',serif" : "'DM Sans',sans-serif";

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
  }, []);

  useEffect(() => {
    const prefs = loadPrefs();
    if (prefs) setTimes(computeTimes(now, prefs.lat, prefs.lng, prefs.method, prefs.asrFactor, prefs.offsets ?? {}));
  }, [now]);

  const nowMin   = now.getHours()*60 + now.getMinutes();
  const hijri    = toHijri(now);
  const dayName  = isAr ? WKDAYS_AR[now.getDay()] : WKDAYS_EN[now.getDay()];
  const FIVE     = PRAYER_LIST.filter(p => p.key !== "sunrise");

  const nextPrayer = times ? (() => {
    for (const p of FIVE) {
      const m = timeToMin(times[p.key]);
      if (m > nowMin) return { ...p, min: m };
    }
    return { ...FIVE[0], min: timeToMin(times["fajr"]) + 1440 };
  })() : null;

  const prevPrayer = times && nextPrayer ? (() => {
    const idx = FIVE.findIndex(p => p.key === nextPrayer.key);
    const prev = FIVE[(idx - 1 + FIVE.length) % FIVE.length];
    return { ...prev, min: timeToMin(times[prev.key]) };
  })() : null;

  const toggleBell = (key:string, i:0|1|2) => {
    setBells(prev => {
      const arr = [...prev[key]] as [boolean,boolean,boolean];
      arr[i] = !arr[i];
      return { ...prev, [key]: arr };
    });
  };

  // Name to show based on language
  const prayerName = (p: { ar:string; en:string }) => isAr ? p.ar : p.en;

  return (
    <div dir={isAr ? "rtl" : "ltr"} style={{ minHeight:"100vh", background:"#f5f0e8", fontFamily:uiFont, color:"#1a1a2e" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Scheherazade+New:wght@400;700&family=DM+Sans:wght@400;500;600&display=swap');
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
        button { font-family: inherit; }
      `}</style>

      {/* ── Header ── */}
      <div style={{ background:"#2c3e6b", padding:"52px 18px 16px", display:"flex", alignItems:"center", gap:12 }}>
        <button onClick={onHome} style={{ background:"rgba(255,255,255,0.1)", border:"none", color:"#f5f0e8", fontSize:"1.3rem", width:36, height:36, borderRadius:"50%", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
          {isAr ? "›" : "‹"}
        </button>
        <div style={{ flex:1 }}>
          <div style={{ fontFamily:"'Scheherazade New',serif", fontSize:"1rem", color:"#d4a843" }}>
            {hijri.day} {isAr ? hijri.monthAr : hijri.month} {hijri.year}
          </div>
          <div style={{ fontSize:"0.78rem", color:"rgba(245,240,232,0.45)", marginTop:2 }}>
            {dayName} · {now.getDate()}/{now.getMonth()+1}/{now.getFullYear()}
          </div>
          {locName && <div style={{ fontSize:"0.72rem", color:"rgba(245,240,232,0.32)", marginTop:3 }}>📍 {locName}</div>}
        </div>
        <button onClick={onSettings} style={{ background:"rgba(255,255,255,0.1)", border:"none", color:"rgba(245,240,232,0.55)", width:34, height:34, borderRadius:"50%", fontSize:"0.9rem", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>⚙</button>
      </div>

      <div style={{ padding:"14px 14px 80px", display:"flex", flexDirection:"column", gap:12 }}>

        {/* No location */}
        {noLoc && (
          <div onClick={onSettings} style={{ background:"#fffbec", border:"1px solid #e8d04c", borderRadius:14, padding:"14px 18px", display:"flex", alignItems:"center", gap:12, cursor:"pointer" }}>
            <span style={{ fontSize:"1.4rem" }}>📍</span>
            <div style={{ flex:1, fontSize:"0.9rem", color:"#7a5800", lineHeight:1.4 }}>{t.locationNotSet}. {t.locationDesc}</div>
          </div>
        )}

        {/* ── Single prayer card ── */}
        {times && nextPrayer && (
          <div style={{ background:"linear-gradient(160deg,#2c3e6b 0%,#1a2a4a 100%)", borderRadius:18, overflow:"hidden", boxShadow:"0 4px 18px rgba(44,62,107,0.3)" }}>

            {/* ── TOP: name + countdown always visible ── */}
            <div style={{ padding:"18px 20px 14px" }}>

              {/* Prayer name (left) + countdown (right) */}
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
                <div style={{ fontFamily:"'Scheherazade New',serif", fontSize:"2rem", color:"#d4a843", lineHeight:1 }}>
                  {prayerName(nextPrayer)}
                </div>
                <PrayerCountdown targetMin={nextPrayer.min} />
              </div>

              {/* Progress bar — always visible */}
              {prevPrayer && (
                <ProgressBar prevMin={prevPrayer.min} nextMin={nextPrayer.min} nowMin={nowMin} />
              )}

              {/* Show more / Show less — directly under progress bar */}
              <div style={{ display:"flex", justifyContent:"center", marginTop:14 }}>
                <button
                  onClick={() => setExp(v => !v)}
                  style={{ background:"rgba(192,57,43,0.85)", border:"none", borderRadius:20, color:"#fff", fontSize:"0.9rem", fontWeight:600, padding:"7px 26px", cursor:"pointer" }}>
                  {expanded
                    ? (isAr ? "إظهار أقل" : "Show less")
                    : (isAr ? "إظهار المزيد" : "Show more")}
                </button>
              </div>
            </div>

            {/* ── EXPANDABLE: prayer schedule with bells ── */}
            <div style={{ overflow:"hidden", maxHeight: expanded ? 700 : 0, transition:"max-height 0.35s ease" }}>
              <div style={{ background:"rgba(0,0,0,0.18)" }}>

                {/* Column headers */}
                <div style={{ display:"grid", gridTemplateColumns:"1fr repeat(3,44px) 56px", alignItems:"center", padding:"8px 16px 6px", borderBottom:"1px solid rgba(255,255,255,0.07)" }}>
                  <div/>
                  {[isAr?"قبل":"Before", isAr?"أذان":"Azan", isAr?"بعد":"After"].map(h => (
                    <div key={h} style={{ fontSize:"0.68rem", color:"rgba(245,240,232,0.38)", textAlign:"center", letterSpacing:"0.04em" }}>{h}</div>
                  ))}
                  <div style={{ fontSize:"0.68rem", color:"rgba(245,240,232,0.38)", textAlign:"center", letterSpacing:"0.04em" }}>{isAr?"الوقت":"Time"}</div>
                </div>

                {/* One row per prayer */}
                {PRAYER_LIST.map(p => {
                  const pm   = timeToMin(times[p.key]);
                  const isCur = nextPrayer.key === p.key;
                  const past  = pm >= 0 && pm < nowMin && !isCur;
                  const b     = bells[p.key] ?? [false,false,false];
                  return (
                    <div key={p.key} style={{ display:"grid", gridTemplateColumns:"1fr repeat(3,44px) 56px", alignItems:"center", padding:"7px 16px", borderBottom:"1px solid rgba(255,255,255,0.04)", background: isCur ? "rgba(255,255,255,0.07)" : "transparent", opacity: past ? 0.35 : 1 }}>
                      {/* Name */}
                      <div style={{ fontFamily:"'Scheherazade New',serif", fontSize:"1.1rem", color: isCur ? "#d4a843" : "rgba(245,240,232,0.82)", fontWeight: isCur ? 700 : 400 }}>
                        {prayerName(p)}
                      </div>
                      {/* 3 bells */}
                      {([0,1,2] as (0|1|2)[]).map(i => (
                        <div key={i} style={{ display:"flex", justifyContent:"center" }}>
                          <Bell on={b[i]} onClick={() => toggleBell(p.key, i)} />
                        </div>
                      ))}
                      {/* Time */}
                      <div style={{ fontFamily:"'Courier New',monospace", fontSize:"0.95rem", fontWeight: isCur ? 700 : 400, color: isCur ? "#d4a843" : "rgba(245,240,232,0.65)", textAlign:"center" }}>
                        {times[p.key]}
                      </div>
                    </div>
                  );
                })}

                <div style={{ height:10 }}/>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
