import { useState, useEffect, useMemo } from "react";
import { AZKAR, type AzkarCategory } from "../data/azkar";
import { getLang } from "./langStore";
import { computeTimes, loadPrefs, timeToMin } from "./prayerUtils";

const UI = "'DM Sans', 'Segoe UI', Arial, sans-serif";
const ARABIC = "'Scheherazade New', 'KFGQPC Uthmanic Script HAFS', serif";

// ── Numerals ──
const HINDI = "٠١٢٣٤٥٦٧٨٩";
function toAr(s: string | number) { return String(s).replace(/\d/g, d => HINDI[+d]); }

// ── Vibration helper ──
function vibrate(ms = 18) {
  try { if ("vibrate" in navigator) navigator.vibrate(ms); } catch {}
}

// ── Counter persistence (per-day) ──
function counterKey(catId: string) {
  const d = new Date();
  const key = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  return `azkar_counter_${catId}_${key}`;
}
function loadCounters(catId: string): Record<number, number> {
  try { return JSON.parse(localStorage.getItem(counterKey(catId)) || "{}"); }
  catch { return {}; }
}
function saveCounters(catId: string, c: Record<number, number>) {
  try { localStorage.setItem(counterKey(catId), JSON.stringify(c)); } catch {}
}

// ── Smart initial category based on time of day & prayer ──
function pickInitialCategory(): string {
  const now = new Date();
  const h = now.getHours();
  const m = now.getMinutes();
  const nowMin = h * 60 + m;

  const prefs = loadPrefs();
  if (prefs) {
    const times = computeTimes(now, prefs.lat, prefs.lng, prefs.method, prefs.asrFactor, prefs.offsets ?? {});
    // Within 90min after any prayer → after_prayer
    for (const p of ["fajr", "dhuhr", "asr", "maghrib", "isha"]) {
      const pm = timeToMin(times[p as keyof typeof times]);
      if (pm < 0) continue;
      const diff = nowMin >= pm ? nowMin - pm : nowMin + 1440 - pm;
      if (diff <= 90) return "after_prayer";
    }
  }

  if (h >= 4 && h < 8) return "morning";
  if (h >= 8 && h < 11) return "duha";
  if (h >= 15 && h < 19) return "evening";
  if (h >= 21 || h < 4) return "sleep";
  return "morning";
}

interface Props { onHome: () => void }

export default function AzkarScreen({ onHome }: Props) {
  const lang = getLang() || "en";
  const isAr = lang === "ar";

  const [activeId, setActiveId] = useState<string>(() => pickInitialCategory());
  const [counters, setCounters] = useState<Record<number, number>>({});
  const [showSidebar, setShowSidebar] = useState(false);
  const [fontSize, setFontSize] = useState(1.45);

  const category: AzkarCategory = useMemo(
    () => AZKAR.find(c => c.id === activeId) || AZKAR[0],
    [activeId]
  );

  useEffect(() => { setCounters(loadCounters(activeId)); }, [activeId]);
  useEffect(() => { saveCounters(activeId, counters); }, [counters, activeId]);

  const total = category.items.reduce((s, z) => s + z.count, 0);
  const done = category.items.reduce(
    (s, z, i) => s + Math.min(counters[i] ?? 0, z.count),
    0
  );
  const progressPct = total === 0 ? 0 : Math.round((done / total) * 100);

  const tap = (i: number, cap: number) => {
    if (counters[i] >= cap) return;
    vibrate(15);
    setCounters(prev => ({ ...prev, [i]: Math.min(cap, (prev[i] ?? 0) + 1) }));
  };

  const resetOne = (i: number) => {
    setCounters(prev => ({ ...prev, [i]: 0 }));
  };

  const resetAll = () => {
    if (confirm(isAr ? "إعادة تعيين كل العدّاد؟" : "Reset all counters?")) {
      setCounters({});
    }
  };

  return (
    <div dir={isAr ? "rtl" : "ltr"} style={{ minHeight: "100vh", background: "#FDFBF7", fontFamily: UI, color: "#1a1a2e" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Scheherazade+New:wght@400;700&family=DM+Sans:wght@400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        button { font-family: inherit; }

        /* Long-press friendly tap card */
        .zikr-card {
          position: relative;
          background: #fff;
          border-radius: 18px;
          padding: 18px 18px 14px;
          box-shadow: 0 2px 14px rgba(44,62,107,0.08);
          margin-bottom: 14px;
          border: 1px solid rgba(212,168,67,0.18);
          transition: transform 0.18s, box-shadow 0.18s;
          -webkit-tap-highlight-color: transparent;
          user-select: none;
        }
        .zikr-card.completed {
          background: linear-gradient(135deg, #eaf6ef 0%, #f8fbf3 100%);
          border-color: rgba(60,120,80,0.32);
        }
        .zikr-card.tappable:active { transform: scale(0.985); }

        .ring-btn {
          position: relative;
          width: 70px; height: 70px;
          border-radius: 50%;
          border: none;
          cursor: pointer;
          background: radial-gradient(circle at 30% 30%, #d4a843, #a07830);
          color: #fff;
          font-family: ${UI};
          font-weight: 800;
          font-size: 1.4rem;
          box-shadow: 0 4px 14px rgba(160,120,48,0.35), inset 0 -3px 8px rgba(0,0,0,0.18);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          transition: transform 0.12s;
        }
        .ring-btn:active { transform: scale(0.92); }
        .ring-btn.done {
          background: radial-gradient(circle at 30% 30%, #4caf50, #2e7d32);
          box-shadow: 0 4px 14px rgba(46,125,50,0.35);
        }

        .sidebar-backdrop {
          position: fixed; inset: 0;
          background: rgba(20,30,55,0.55);
          backdrop-filter: blur(2px);
          z-index: 250;
        }
        .sidebar {
          position: fixed; top: 0; bottom: 0;
          ${isAr ? "right" : "left"}: 0;
          width: 86%; max-width: 340px;
          background: #FDFBF7;
          box-shadow: ${isAr ? "-" : ""}4px 0 22px rgba(0,0,0,0.18);
          z-index: 260;
          overflow-y: auto;
          padding: 18px 14px 28px;
        }
        .cat-row {
          display: flex; align-items: center; gap: 12px;
          padding: 14px 14px;
          background: #fff;
          border-radius: 14px;
          margin-bottom: 10px;
          cursor: pointer;
          border: 1.5px solid transparent;
          transition: border-color 0.15s, background 0.15s;
        }
        .cat-row:active { background: #f5f0e8; }
        .cat-row.active {
          border-color: #d4a843;
          background: linear-gradient(135deg, rgba(212,168,67,0.08), #fff);
        }
      `}</style>

      {/* ── Header ── */}
      <div style={{ background: "#2c3e6b", padding: "44px 16px 18px", display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={onHome}
          data-testid="azkar-back-btn"
          style={{ background: "rgba(255,255,255,0.12)", border: "none", color: "#f5f0e8",
            width: 38, height: 38, borderRadius: "50%", cursor: "pointer",
            fontSize: "1.3rem", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {isAr ? "›" : "‹"}
        </button>
        <button onClick={() => setShowSidebar(true)}
          data-testid="azkar-menu-btn"
          style={{ background: "rgba(255,255,255,0.12)", border: "none", color: "#f5f0e8",
            width: 38, height: 38, borderRadius: "50%", cursor: "pointer",
            fontSize: "1.15rem", display: "flex", alignItems: "center", justifyContent: "center" }}>
          ☰
        </button>
        <div style={{ flex: 1, textAlign: isAr ? "right" : "left" }}>
          <div style={{ fontFamily: UI, fontSize: "0.78rem", color: "rgba(245,240,232,0.55)", letterSpacing: "0.05em", textTransform: "uppercase" }}>
            {isAr ? "الأذكار" : "Adhkar"}
          </div>
          <div style={{ fontFamily: UI, fontSize: "1.3rem", fontWeight: 700, color: "#d4a843", marginTop: 2 }}>
            {category.icon} {isAr ? category.ar : category.en}
          </div>
        </div>
        <button onClick={resetAll}
          data-testid="azkar-reset-btn"
          style={{ background: "rgba(255,255,255,0.12)", border: "none", color: "rgba(245,240,232,0.85)",
            width: 38, height: 38, borderRadius: "50%", cursor: "pointer",
            fontSize: "1rem", display: "flex", alignItems: "center", justifyContent: "center" }}
          title={isAr ? "إعادة تعيين" : "Reset"}>
          ↻
        </button>
      </div>

      {/* ── Progress bar ── */}
      <div style={{ background: "#2c3e6b", padding: "0 16px 14px" }}>
        <div style={{ height: 6, background: "rgba(255,255,255,0.12)", borderRadius: 3, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${progressPct}%`,
            background: "linear-gradient(90deg, #d4a843, #f0c560)", borderRadius: 3,
            transition: "width 0.3s ease" }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6,
          fontFamily: UI, fontSize: "0.78rem", color: "rgba(245,240,232,0.6)" }}>
          <span>{isAr ? `${toAr(done)} / ${toAr(total)}` : `${done} / ${total}`}</span>
          <span>{isAr ? `${toAr(progressPct)}٪` : `${progressPct}%`}</span>
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ padding: "14px 14px 80px" }}>
        {/* Description */}
        <div style={{ background: "linear-gradient(135deg, #fff8e8, #fff)",
          borderRadius: 14, padding: "12px 16px", marginBottom: 14,
          border: "1px solid rgba(212,168,67,0.25)",
          fontFamily: UI, fontSize: "0.88rem", color: "#7a5800", lineHeight: 1.5 }}>
          {isAr ? category.description : category.descriptionEn}
        </div>

        {/* Font size adjuster */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: isAr ? "flex-start" : "flex-end",
          gap: 6, marginBottom: 12, fontSize: "0.82rem", color: "#64748b" }}>
          <span>{isAr ? "حجم الخط" : "Font size"}</span>
          <button data-testid="azkar-font-decrease"
            onClick={() => setFontSize(f => Math.max(1.0, +(f - 0.1).toFixed(2)))}
            style={{ background: "#fff", border: "1.5px solid #e8e0d5", borderRadius: 8,
              width: 30, height: 30, cursor: "pointer", fontSize: "1rem" }}>−</button>
          <span style={{ minWidth: 36, textAlign: "center", fontWeight: 600 }}>{fontSize.toFixed(1)}</span>
          <button data-testid="azkar-font-increase"
            onClick={() => setFontSize(f => Math.min(2.5, +(f + 0.1).toFixed(2)))}
            style={{ background: "#fff", border: "1.5px solid #e8e0d5", borderRadius: 8,
              width: 30, height: 30, cursor: "pointer", fontSize: "1rem" }}>+</button>
        </div>

        {/* Zikr cards */}
        {category.items.map((z, i) => {
          const c = counters[i] ?? 0;
          const completed = c >= z.count;
          return (
            <div key={i}
              data-testid={`zikr-card-${i}`}
              className={`zikr-card${completed ? " completed" : " tappable"}`}
              onClick={() => tap(i, z.count)}>

              {/* Header row: index + reset */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div style={{ fontFamily: UI, fontSize: "0.78rem", fontWeight: 700,
                  color: completed ? "#2e7d32" : "#d4a843", letterSpacing: "0.04em" }}>
                  {completed ? "✓ " : ""}{isAr ? `الذِّكر ${toAr(i + 1)}` : `Zikr ${i + 1}`}
                </div>
                <button onClick={(e) => { e.stopPropagation(); resetOne(i); }}
                  data-testid={`zikr-reset-${i}`}
                  style={{ background: "transparent", border: "none", color: "#94a3b8",
                    cursor: "pointer", fontSize: "0.95rem", padding: 4 }}>↺</button>
              </div>

              {/* Arabic text */}
              <div style={{ fontFamily: ARABIC, fontSize: `${fontSize}rem`,
                color: "#1a1a2e", direction: "rtl", textAlign: "right",
                lineHeight: 2.0, marginBottom: 8 }}>
                {z.ar}
              </div>

              {/* English translation */}
              {!isAr && z.en && (
                <div style={{ fontFamily: UI, fontStyle: "italic", fontSize: "0.92rem",
                  color: "#475569", lineHeight: 1.6, marginBottom: 8 }}>
                  "{z.en}"
                </div>
              )}

              {/* Source */}
              {(z.source || z.sourceEn) && (
                <div style={{ fontFamily: UI, fontSize: "0.78rem", color: "#d4a843",
                  fontWeight: 600, marginBottom: 6 }}>
                  — {isAr ? z.source : (z.sourceEn || z.source)}
                </div>
              )}

              {/* Benefit (if any) */}
              {(z.benefit || z.benefitEn) && (
                <div style={{ background: "rgba(212,168,67,0.10)", borderRadius: 10,
                  padding: "8px 12px", marginBottom: 10,
                  fontFamily: UI, fontSize: "0.82rem", color: "#7a5800", lineHeight: 1.5,
                  borderInlineStart: "3px solid #d4a843" }}>
                  <span style={{ fontWeight: 700 }}>{isAr ? "الفضل: " : "Benefit: "}</span>
                  {isAr ? z.benefit : (z.benefitEn || z.benefit)}
                </div>
              )}

              {/* Counter row */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
                marginTop: 10, gap: 14 }}>
                <div style={{ fontFamily: UI, fontSize: "0.88rem", color: "#64748b" }}>
                  {isAr
                    ? `العدد: ${toAr(c)} من ${toAr(z.count)}`
                    : `Count: ${c} of ${z.count}`}
                </div>
                <button className={`ring-btn${completed ? " done" : ""}`}
                  data-testid={`zikr-tap-${i}`}
                  onClick={(e) => { e.stopPropagation(); tap(i, z.count); }}>
                  {completed ? "✓" : (isAr ? toAr(z.count - c) : (z.count - c))}
                </button>
              </div>
            </div>
          );
        })}

        <div style={{ textAlign: "center", padding: "20px 0 10px",
          fontFamily: UI, fontSize: "0.85rem", color: "#94a3b8" }}>
          {progressPct === 100
            ? (isAr ? "✨ تم بحمد الله — تقبل الله منك" : "✨ Done. May Allah accept from you")
            : (isAr ? "اضغط على الزر الذهبي لكل ذِكر" : "Tap the gold button to count each zikr")}
        </div>
      </div>

      {/* ── Sidebar ── */}
      {showSidebar && (
        <>
          <div className="sidebar-backdrop" onClick={() => setShowSidebar(false)} />
          <div className="sidebar">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
              marginBottom: 16, padding: "0 4px" }}>
              <div style={{ fontFamily: UI, fontSize: "1.15rem", fontWeight: 700, color: "#2c3e6b" }}>
                {isAr ? "الفئات" : "Categories"}
              </div>
              <button onClick={() => setShowSidebar(false)}
                data-testid="azkar-sidebar-close"
                style={{ background: "none", border: "none", fontSize: "1.4rem",
                  color: "#64748b", cursor: "pointer", padding: 4 }}>✕</button>
            </div>
            {AZKAR.map(cat => (
              <div key={cat.id}
                data-testid={`azkar-cat-${cat.id}`}
                className={`cat-row${activeId === cat.id ? " active" : ""}`}
                onClick={() => { setActiveId(cat.id); setShowSidebar(false); }}>
                <span style={{ fontSize: "1.6rem", flexShrink: 0 }}>{cat.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: UI, fontSize: "1rem", fontWeight: 700, color: "#1a1a2e" }}>
                    {isAr ? cat.ar : cat.en}
                  </div>
                  <div style={{ fontFamily: UI, fontSize: "0.78rem", color: "#64748b", marginTop: 2 }}>
                    {isAr ? `${toAr(cat.items.length)} ذِكر` : `${cat.items.length} adhkar`}
                  </div>
                </div>
                {activeId === cat.id && (
                  <span style={{ color: "#d4a843", fontSize: "1.2rem" }}>●</span>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
