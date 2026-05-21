import { useState, useEffect, useRef, useMemo } from "react";
import quranData from "../data/quran.json";
import { RECITERS, ayahAudioUrl, fullSurahUrl, getSavedReciter, saveReciter, type Reciter } from "../data/reciters";
import { getLang } from "./langStore";

const UI = "'DM Sans', sans-serif";
const ARABIC = "'Scheherazade New', 'KFGQPC Uthmanic Script HAFS', serif";

const HINDI = "٠١٢٣٤٥٦٧٨٩";
const toAr = (s: string | number) => String(s).replace(/\d/g, d => HINDI[+d]);

interface Surah {
  id: number;
  name: string;
  transliteration: string;
  type: "Meccan" | "Medinan";
  total_verses: number;
  verses: { id: number; text: string }[];
}
const surahs = quranData as Surah[];

type PlayMode = "verse" | "surah";

interface Props { onHome: () => void }

export default function AudioQuranScreen({ onHome }: Props) {
  const lang = getLang() || "en";
  const isAr = lang === "ar";

  const [reciterId, setReciterId] = useState<string>(() => getSavedReciter());
  const reciter: Reciter = useMemo(
    () => RECITERS.find(r => r.id === reciterId) || RECITERS[0],
    [reciterId]
  );

  const [surahId, setSurahId] = useState<number>(() => {
    try { return parseInt(localStorage.getItem("audio_last_surah") || "1", 10) || 1; }
    catch { return 1; }
  });
  const [verseId, setVerseId] = useState<number>(1);
  const [mode, setMode] = useState<PlayMode>("verse");
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [autoNext, setAutoNext] = useState(true);
  const [showSurahList, setShowSurahList] = useState(false);
  const [showReciterList, setShowReciterList] = useState(false);
  const [progress, setProgress] = useState(0); // 0..1
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const verseScrollRef = useRef<HTMLDivElement>(null);
  const currentVerseRef = useRef<HTMLDivElement | null>(null);

  const surah = surahs.find(s => s.id === surahId) || surahs[0];

  useEffect(() => { saveReciter(reciterId); }, [reciterId]);
  useEffect(() => { localStorage.setItem("audio_last_surah", String(surahId)); }, [surahId]);

  // Build current URL
  const currentUrl = useMemo(() => {
    if (mode === "surah") return fullSurahUrl(reciter, surahId);
    return ayahAudioUrl(reciter.id, surahId, verseId);
  }, [reciter, surahId, verseId, mode]);

  // Reset verse on surah/mode change
  useEffect(() => {
    if (mode === "verse") setVerseId(1);
    setProgress(0); setCurrentTime(0); setDuration(0);
  }, [surahId, mode]);

  // Scroll current verse into view
  useEffect(() => {
    if (mode === "verse" && currentVerseRef.current) {
      currentVerseRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [verseId, mode]);

  // Audio event handlers
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onLoadStart = () => { setLoading(true); setError(""); };
    const onCanPlay   = () => setLoading(false);
    const onPlaying   = () => { setPlaying(true); setLoading(false); };
    const onPause     = () => setPlaying(false);
    const onError     = () => {
      setLoading(false); setPlaying(false);
      setError(isAr ? "تعذّر تحميل الصوت — جرب قارئاً آخر" : "Failed to load audio — try a different reciter");
    };
    const onTimeUpdate = () => {
      if (!audio.duration) return;
      setCurrentTime(audio.currentTime);
      setDuration(audio.duration);
      setProgress(audio.currentTime / audio.duration);
    };
    const onEnded = () => {
      setPlaying(false);
      setProgress(1);
      if (mode === "verse" && autoNext) {
        if (verseId < surah.total_verses) {
          setVerseId(v => v + 1);
        } else if (surahId < 114) {
          setSurahId(s => s + 1);
        }
      } else if (mode === "surah" && autoNext && surahId < 114) {
        setSurahId(s => s + 1);
      }
    };

    audio.addEventListener("loadstart", onLoadStart);
    audio.addEventListener("canplay", onCanPlay);
    audio.addEventListener("playing", onPlaying);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("error", onError);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("loadstart", onLoadStart);
      audio.removeEventListener("canplay", onCanPlay);
      audio.removeEventListener("playing", onPlaying);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("error", onError);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("ended", onEnded);
    };
  }, [mode, autoNext, verseId, surahId, surah.total_verses, isAr]);

  // Auto-play when URL changes (if user was playing)
  const wasPlayingRef = useRef(false);
  useEffect(() => {
    wasPlayingRef.current = playing;
    // We track separately for transitions in next effect
  }, [playing]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentUrl) return;
    if (wasPlayingRef.current) {
      audio.play().catch(() => {});
    }
  }, [currentUrl]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    setError("");
    if (audio.paused) {
      audio.play().catch(() => {
        setError(isAr ? "تعذّر التشغيل" : "Could not play");
      });
    } else {
      audio.pause();
    }
  };

  const goNext = () => {
    if (mode === "verse") {
      if (verseId < surah.total_verses) setVerseId(v => v + 1);
      else if (surahId < 114) setSurahId(s => s + 1);
    } else if (surahId < 114) {
      setSurahId(s => s + 1);
    }
  };

  const goPrev = () => {
    if (mode === "verse") {
      if (verseId > 1) setVerseId(v => v - 1);
      else if (surahId > 1) {
        const prev = surahs[surahId - 2];
        setSurahId(prev.id);
        setVerseId(prev.total_verses);
      }
    } else if (surahId > 1) {
      setSurahId(s => s - 1);
    }
  };

  const seek = (pct: number) => {
    const audio = audioRef.current;
    if (audio && audio.duration) {
      audio.currentTime = pct * audio.duration;
    }
  };

  const fmtTime = (s: number) => {
    if (!isFinite(s)) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div dir={isAr ? "rtl" : "ltr"} style={{ minHeight: "100vh", background: "#FDFBF7", fontFamily: UI, color: "#1a1a2e" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Scheherazade+New:wght@400;700&family=DM+Sans:wght@400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        button { font-family: inherit; }
        .pill-btn {
          background: rgba(255,255,255,0.12);
          border: none;
          border-radius: 999px;
          color: #f5f0e8;
          padding: 7px 14px;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.15s;
        }
        .pill-btn:active { background: rgba(255,255,255,0.22); }
        .pill-btn.active {
          background: #d4a843;
          color: #1a1a2e;
        }
        .verse-row {
          padding: 14px 18px;
          border-bottom: 1px solid rgba(212,168,67,0.18);
          background: #fff;
          cursor: pointer;
          transition: background 0.18s;
          -webkit-tap-highlight-color: transparent;
        }
        .verse-row:hover { background: #fdf8ed; }
        .verse-row.current {
          background: linear-gradient(135deg, #fff8e0, #fffdf3);
          border-left: 4px solid #d4a843;
        }
        .ctrl-btn {
          background: rgba(255,255,255,0.12);
          border: none;
          color: #f5f0e8;
          width: 44px; height: 44px;
          border-radius: 50%;
          cursor: pointer;
          font-size: 1.2rem;
          display: flex; align-items: center; justify-content: center;
          transition: transform 0.1s, background 0.15s;
        }
        .ctrl-btn:active { transform: scale(0.92); }
        .ctrl-btn:hover { background: rgba(255,255,255,0.22); }
        .ctrl-btn.primary {
          background: #d4a843;
          color: #1a1a2e;
          width: 60px; height: 60px;
          font-size: 1.6rem;
          box-shadow: 0 4px 14px rgba(212,168,67,0.4);
        }
        .ctrl-btn.primary:hover { background: #e0b855; }
        .panel-backdrop {
          position: fixed; inset: 0;
          background: rgba(15,25,50,0.65);
          backdrop-filter: blur(3px);
          z-index: 200;
          display: flex; align-items: flex-end;
        }
        .panel-sheet {
          width: 100%;
          background: #FDFBF7;
          border-radius: 18px 18px 0 0;
          max-height: 80vh;
          overflow-y: auto;
          padding: 14px 0 30px;
        }
        .item {
          padding: 14px 18px;
          border-bottom: 1px solid #f0ebe3;
          cursor: pointer;
          display: flex; align-items: center; gap: 12px;
        }
        .item:active { background: #f5f0e8; }
        .item.selected {
          background: linear-gradient(135deg, rgba(212,168,67,0.13), #fff);
          border-${isAr ? "right" : "left"}: 4px solid #d4a843;
        }
      `}</style>

      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        src={currentUrl || undefined}
        preload="auto"
        crossOrigin="anonymous"
        data-testid="audio-element"
      />

      {/* ── Header ── */}
      <div style={{ background: "linear-gradient(160deg, #2c3e6b 0%, #1a2a4a 100%)",
        padding: "44px 16px 18px", position: "sticky", top: 0, zIndex: 50,
        boxShadow: "0 2px 14px rgba(0,0,0,0.15)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <button onClick={onHome}
            data-testid="audio-back-btn"
            style={{ background: "rgba(255,255,255,0.12)", border: "none", color: "#f5f0e8",
              width: 38, height: 38, borderRadius: "50%", cursor: "pointer",
              fontSize: "1.3rem", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {isAr ? "›" : "‹"}
          </button>
          <div style={{ flex: 1, textAlign: isAr ? "right" : "left" }}>
            <div style={{ fontSize: "0.72rem", color: "rgba(245,240,232,0.55)", letterSpacing: "0.05em", textTransform: "uppercase" }}>
              {isAr ? "القرآن الصوتي" : "Audio Quran"}
            </div>
            <div style={{ fontFamily: ARABIC, fontSize: "1.55rem", color: "#d4a843", fontWeight: 700, lineHeight: 1.2 }}>
              {surah.name}
            </div>
            <div style={{ fontFamily: UI, fontSize: "0.82rem", color: "rgba(245,240,232,0.65)", marginTop: 2 }}>
              {surah.transliteration} · {isAr ? toAr(surah.total_verses) : surah.total_verses} {isAr ? "آية" : "verses"}
            </div>
          </div>
        </div>

        {/* Mode pill toggle + selectors */}
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <button data-testid="audio-mode-verse"
            className={`pill-btn${mode === "verse" ? " active" : ""}`}
            onClick={() => setMode("verse")}>
            {isAr ? "آية بآية" : "Verse-by-verse"}
          </button>
          <button data-testid="audio-mode-surah"
            className={`pill-btn${mode === "surah" ? " active" : ""}`}
            onClick={() => setMode("surah")}>
            {isAr ? "سورة كاملة" : "Full surah"}
          </button>
          <button data-testid="audio-reciter-btn"
            className="pill-btn"
            onClick={() => setShowReciterList(true)}
            style={{ marginInlineStart: "auto" }}>
            🎙️ {isAr ? reciter.ar.split(" ").slice(0, 2).join(" ") : reciter.en.split(" ").slice(0, 2).join(" ")}
          </button>
        </div>

        {error && (
          <div style={{ marginTop: 10, background: "rgba(180,60,60,0.18)",
            border: "1px solid rgba(220,80,80,0.4)", borderRadius: 10,
            padding: "8px 12px", fontSize: "0.82rem", color: "#ffd1d1" }}>
            ⚠ {error}
          </div>
        )}
      </div>

      {/* ── Verse list ── */}
      <div ref={verseScrollRef} style={{ paddingBottom: 200 }}>
        {/* Bismillah header (except surah 1, 9) */}
        {surahId !== 1 && surahId !== 9 && (
          <div style={{ fontFamily: ARABIC, fontSize: "1.5rem", color: "#2c3e6b",
            direction: "rtl", textAlign: "center", padding: "20px 16px 6px", fontWeight: 700 }}>
            بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
          </div>
        )}

        {surah.verses.map(v => {
          const isCurrent = mode === "verse" && verseId === v.id;
          return (
            <div key={v.id}
              ref={isCurrent ? currentVerseRef : null}
              data-testid={`audio-verse-${v.id}`}
              className={`verse-row${isCurrent ? " current" : ""}`}
              onClick={() => {
                setMode("verse");
                setVerseId(v.id);
              }}>
              <div style={{ display: "flex", justifyContent: "space-between",
                alignItems: "flex-start", gap: 10, marginBottom: 6 }}>
                <div style={{ background: isCurrent ? "#d4a843" : "#e8e0d5",
                  color: isCurrent ? "#1a1a2e" : "#7a5800",
                  width: 28, height: 28, borderRadius: "50%",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: UI, fontSize: "0.78rem", fontWeight: 700, flexShrink: 0 }}>
                  {isAr ? toAr(v.id) : v.id}
                </div>
                {isCurrent && playing && (
                  <span style={{ color: "#d4a843", fontSize: "0.85rem", fontWeight: 600 }}>
                    ▶ {isAr ? "قيد التشغيل" : "Playing"}
                  </span>
                )}
              </div>
              <div style={{ fontFamily: ARABIC, fontSize: "1.5rem",
                color: "#1a1a2e", direction: "rtl", textAlign: "right",
                lineHeight: 2.0 }}>
                {v.text}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Sticky player bar ── */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0,
        background: "linear-gradient(180deg, #1a2a4a, #0e1730)",
        color: "#f5f0e8",
        padding: "12px 16px 18px",
        boxShadow: "0 -6px 20px rgba(0,0,0,0.25)",
        zIndex: 100 }}>
        {/* Track info row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
          marginBottom: 6, fontSize: "0.78rem", color: "rgba(245,240,232,0.7)" }}>
          <span data-testid="audio-now-playing">
            {mode === "verse"
              ? (isAr
                  ? `${surah.name} ${toAr(surahId)}:${toAr(verseId)}`
                  : `${surah.transliteration} ${surahId}:${verseId}`)
              : (isAr ? `${surah.name} (كاملة)` : `${surah.transliteration} (full)`)}
          </span>
          <span style={{ fontFamily: "monospace", direction: "ltr" }}>
            {fmtTime(currentTime)} / {fmtTime(duration)}
          </span>
        </div>

        {/* Progress slider */}
        <div data-testid="audio-progress"
          style={{ height: 4, background: "rgba(255,255,255,0.18)",
            borderRadius: 2, cursor: "pointer", marginBottom: 12 }}
          onClick={(e) => {
            const rect = (e.target as HTMLElement).getBoundingClientRect();
            const pct = (e.clientX - rect.left) / rect.width;
            seek(Math.max(0, Math.min(1, pct)));
          }}>
          <div style={{ height: "100%", width: `${progress * 100}%`,
            background: "linear-gradient(90deg, #d4a843, #f0c560)", borderRadius: 2 }} />
        </div>

        {/* Controls */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
          <button className="ctrl-btn"
            data-testid="audio-surah-list-btn"
            onClick={() => setShowSurahList(true)} title={isAr ? "اختر سورة" : "Select surah"}>☰</button>
          <button className="ctrl-btn"
            data-testid="audio-prev-btn"
            onClick={goPrev} title={isAr ? "السابق" : "Previous"}>{isAr ? "›" : "‹"}{isAr ? "›" : "‹"}</button>
          <button className="ctrl-btn primary"
            data-testid="audio-play-btn"
            onClick={togglePlay}>
            {loading ? "…" : (playing ? "⏸" : "▶")}
          </button>
          <button className="ctrl-btn"
            data-testid="audio-next-btn"
            onClick={goNext} title={isAr ? "التالي" : "Next"}>{isAr ? "‹" : "›"}{isAr ? "‹" : "›"}</button>
          <button className={`ctrl-btn${autoNext ? "" : ""}`}
            data-testid="audio-loop-btn"
            onClick={() => setAutoNext(v => !v)}
            style={{ opacity: autoNext ? 1 : 0.45 }}
            title={isAr ? "التشغيل المتواصل" : "Auto-continue"}>
            ⤵
          </button>
        </div>
      </div>

      {/* ── Surah list panel ── */}
      {showSurahList && (
        <div className="panel-backdrop" onClick={() => setShowSurahList(false)}>
          <div className="panel-sheet" onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: "8px 18px 14px",
              borderBottom: "1px solid #ede5d5",
              display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontFamily: UI, fontSize: "1.05rem", fontWeight: 700, color: "#2c3e6b" }}>
                {isAr ? "اختر السورة" : "Select Surah"}
              </div>
              <button onClick={() => setShowSurahList(false)}
                data-testid="audio-surah-close"
                style={{ background: "none", border: "none", fontSize: "1.4rem", color: "#64748b", cursor: "pointer" }}>✕</button>
            </div>
            {surahs.map(s => (
              <div key={s.id}
                data-testid={`audio-surah-${s.id}`}
                className={`item${s.id === surahId ? " selected" : ""}`}
                onClick={() => { setSurahId(s.id); setShowSurahList(false); }}>
                <div style={{ background: "#fff", border: "1.5px solid #d4a843",
                  borderRadius: "50%", width: 34, height: 34, display: "flex",
                  alignItems: "center", justifyContent: "center",
                  fontFamily: UI, fontSize: "0.78rem", fontWeight: 700, color: "#7a5800", flexShrink: 0 }}>
                  {s.id}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: UI, fontSize: "0.95rem", fontWeight: 600, color: "#1a1a2e" }}>
                    {s.transliteration}
                  </div>
                  <div style={{ fontFamily: UI, fontSize: "0.75rem", color: "#64748b" }}>
                    {s.type} · {s.total_verses} {isAr ? "آية" : "verses"}
                  </div>
                </div>
                <div style={{ fontFamily: ARABIC, fontSize: "1.3rem", color: "#2c3e6b", direction: "rtl" }}>
                  {s.name}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Reciter panel ── */}
      {showReciterList && (
        <div className="panel-backdrop" onClick={() => setShowReciterList(false)}>
          <div className="panel-sheet" onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: "8px 18px 14px",
              borderBottom: "1px solid #ede5d5",
              display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontFamily: UI, fontSize: "1.05rem", fontWeight: 700, color: "#2c3e6b" }}>
                {isAr ? "اختر القارئ" : "Select Reciter"}
              </div>
              <button onClick={() => setShowReciterList(false)}
                data-testid="audio-reciter-close"
                style={{ background: "none", border: "none", fontSize: "1.4rem", color: "#64748b", cursor: "pointer" }}>✕</button>
            </div>
            {RECITERS.map(r => (
              <div key={r.id}
                data-testid={`audio-reciter-${r.id}`}
                className={`item${r.id === reciterId ? " selected" : ""}`}
                onClick={() => { setReciterId(r.id); setShowReciterList(false); }}>
                <div style={{ width: 40, height: 40, borderRadius: "50%",
                  background: "linear-gradient(135deg, #d4a843, #a07830)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "1.2rem", flexShrink: 0 }}>🎙️</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: UI, fontSize: "0.95rem", fontWeight: 600, color: "#1a1a2e" }}>
                    {isAr ? r.ar : r.en}
                  </div>
                  <div style={{ fontFamily: UI, fontSize: "0.75rem", color: "#64748b" }}>
                    {isAr ? r.en : r.ar} · {r.bitrate} kbps
                  </div>
                </div>
                {r.id === reciterId && (
                  <span style={{ color: "#d4a843", fontSize: "1.4rem" }}>✓</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
