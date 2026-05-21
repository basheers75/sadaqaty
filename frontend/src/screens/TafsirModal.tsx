import { useState, useEffect } from "react";

const UI = "'DM Sans', sans-serif";
const ARABIC = "'KFGQPC Uthmanic Script HAFS', 'Scheherazade New', serif";

interface Props {
  surahId: number;
  verseId: number;
  surahName: string;
  verseText: string;
  onClose: () => void;
}

interface CacheEntry {
  text: string;
  ts: number;
}

const CACHE_KEY = "tafsir_muyassar_cache_v1";
const CACHE_TTL = 1000 * 60 * 60 * 24 * 30; // 30 days

function loadCache(): Record<string, CacheEntry> {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY) || "{}"); }
  catch { return {}; }
}
function saveCache(c: Record<string, CacheEntry>) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(c)); } catch {}
}

export default function TafsirModal({ surahId, verseId, surahName, verseText, onClose }: Props) {
  const [tafsir, setTafsir] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const key = `${surahId}:${verseId}`;
    const cache = loadCache();
    const cached = cache[key];
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      setTafsir(cached.text);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError("");
    // Primary: api.alquran.cloud — Tafsir Al-Muyassar
    fetch(`https://api.alquran.cloud/v1/ayah/${surahId}:${verseId}/ar.muyassar`)
      .then(r => r.json())
      .then(data => {
        if (cancelled) return;
        const txt: string = data?.data?.text || "";
        if (!txt) throw new Error("empty");
        setTafsir(txt);
        const newCache = loadCache();
        newCache[key] = { text: txt, ts: Date.now() };
        saveCache(newCache);
        setLoading(false);
      })
      .catch(() => {
        // Fallback: quranenc.com
        fetch(`https://quranenc.com/api/v1/translation/aya/arabic_moyassar/${surahId}/${verseId}`)
          .then(r => r.json())
          .then(data => {
            if (cancelled) return;
            const txt: string = data?.result?.translation || "";
            if (!txt) throw new Error("empty");
            setTafsir(txt);
            const newCache = loadCache();
            newCache[key] = { text: txt, ts: Date.now() };
            saveCache(newCache);
            setLoading(false);
          })
          .catch(() => {
            if (cancelled) return;
            setError("تعذّر تحميل التفسير — تحقق من اتصال الإنترنت");
            setLoading(false);
          });
      });

    return () => { cancelled = true; };
  }, [surahId, verseId]);

  return (
    <div data-testid="tafsir-modal"
      onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 400,
        background: "rgba(15,25,50,0.65)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div onClick={(e) => e.stopPropagation()}
        style={{ background: "linear-gradient(180deg, #FDFBF7 0%, #faf5ec 100%)",
          width: "100%", maxWidth: 720,
          borderRadius: "20px 20px 0 0",
          maxHeight: "85vh", overflow: "hidden",
          display: "flex", flexDirection: "column",
          boxShadow: "0 -10px 32px rgba(0,0,0,0.22)" }}>

        <style>{`
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        `}</style>

        {/* Header */}
        <div style={{ background: "#2c3e6b", padding: "16px 18px",
          display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontFamily: UI, fontSize: "0.72rem", color: "rgba(245,240,232,0.55)",
              letterSpacing: "0.06em", textTransform: "uppercase" }}>
              التفسير الميسّر
            </div>
            <div style={{ fontFamily: ARABIC, fontSize: "1.3rem", fontWeight: 700, color: "#d4a843", marginTop: 2 }} dir="rtl">
              {surahName} — الآية {verseId.toLocaleString("ar-EG")}
            </div>
          </div>
          <button onClick={onClose}
            data-testid="tafsir-close-btn"
            style={{ background: "rgba(255,255,255,0.18)", border: "none", color: "#f5f0e8",
              width: 38, height: 38, borderRadius: "50%", fontSize: "1.2rem", cursor: "pointer" }}>
            ✕
          </button>
        </div>

        {/* Body */}
        <div style={{ overflowY: "auto", padding: "18px 20px 26px" }} dir="rtl">
          {/* Verse text */}
          <div style={{ background: "linear-gradient(135deg, #fff8e0, #fffdf3)",
            border: "1px solid rgba(212,168,67,0.32)", borderRadius: 14,
            padding: "16px 18px", marginBottom: 16 }}>
            <div style={{ fontFamily: UI, fontSize: "0.74rem", fontWeight: 700,
              color: "#7a5800", letterSpacing: "0.05em", marginBottom: 6 }}>
              نص الآية
            </div>
            <div style={{ fontFamily: ARABIC, fontSize: "1.5rem", color: "#1a1a2e",
              lineHeight: 2.0, direction: "rtl", textAlign: "right" }}>
              {verseText}
            </div>
          </div>

          {/* Tafsir content */}
          <div style={{ fontFamily: UI, fontSize: "0.74rem", fontWeight: 700,
            color: "#2c3e6b", letterSpacing: "0.05em", marginBottom: 8 }}>
            التفسير
          </div>

          {loading && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center",
              padding: "32px 0", gap: 10 }}>
              <div style={{ width: 24, height: 24, border: "3px solid #d4a843",
                borderTopColor: "transparent", borderRadius: "50%",
                animation: "spin 0.8s linear infinite" }} />
              <span style={{ fontFamily: UI, color: "#64748b" }}>جاري تحميل التفسير…</span>
            </div>
          )}

          {error && (
            <div style={{ padding: "14px 16px", background: "#fff5f5",
              border: "1px solid #f0b8b8", borderRadius: 10,
              fontFamily: UI, fontSize: "0.9rem", color: "#c0392b", textAlign: "center" }}>
              ⚠ {error}
            </div>
          )}

          {!loading && !error && tafsir && (
            <div data-testid="tafsir-content"
              style={{ fontFamily: "'Amiri', 'Scheherazade New', serif",
                fontSize: "1.1rem", color: "#1a1a2e",
                lineHeight: 2.0, direction: "rtl", textAlign: "right",
                background: "#fff", borderRadius: 14, padding: "18px 20px",
                border: "1px solid #ede5d5",
                boxShadow: "0 2px 10px rgba(0,0,0,0.04)" }}>
              {tafsir}
            </div>
          )}

          {/* Source */}
          {!loading && !error && tafsir && (
            <div style={{ marginTop: 14, fontFamily: UI, fontSize: "0.82rem",
              color: "#d4a843", fontWeight: 600, textAlign: "center" }}>
              — التفسير الميسّر • مجمع الملك فهد لطباعة المصحف الشريف
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
