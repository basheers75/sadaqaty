import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import quranData from "../data/quran.json";
import { pageMap } from "../data/pageMap";
import TafsirModal from "./TafsirModal";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Verse {
  id: number;
  text: string;
}

interface Surah {
  id: number;
  name: string;
  transliteration: string;
  type: "Meccan" | "Medinan";
  total_verses: number;
  verses: Verse[];
}

type ViewMode = "surah" | "page" | "juz";

interface BookmarkEntry {
  surahId: number;
  label: string;
  timestamp: number;
}

// ─── Juz boundaries (verse global index 1–6236) ───────────────────────────────
// Standard 30-juz breakdown: start surah:verse for each juz
const JUZ_STARTS: [number, number][] = [
  [1, 1], [2, 142], [2, 253], [3, 93], [4, 24],
  [4, 148], [5, 82], [6, 111], [7, 88], [8, 41],
  [9, 93], [11, 6], [12, 53], [15, 1], [17, 1],
  [18, 75], [21, 1], [23, 1], [25, 21], [27, 56],
  [29, 46], [33, 31], [36, 28], [39, 32], [41, 47],
  [46, 1], [51, 31], [58, 1], [67, 1], [78, 1],
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const surahs = quranData as Surah[];

function getPageForVerse(surahId: number, verseId: number): number {
  const key = `${surahId}:${verseId}`;
  return pageMap[key] ?? 1;
}

function getVerseGlobalIndex(surahId: number, verseId: number): number {
  let idx = 0;
  for (const s of surahs) {
    if (s.id < surahId) { idx += s.total_verses; continue; }
    if (s.id === surahId) { idx += verseId; break; }
  }
  return idx;
}

function getJuzForVerse(surahId: number, verseId: number): number {
  for (let j = JUZ_STARTS.length - 1; j >= 0; j--) {
    const [js, jv] = JUZ_STARTS[j];
    if (surahId > js || (surahId === js && verseId >= jv)) return j + 1;
  }
  return 1;
}

function getVersesForPage(pageNum: number): { surahId: number; verseId: number }[] {
  const result: { surahId: number; verseId: number }[] = [];
  for (const [key, p] of Object.entries(pageMap)) {
    if (p === pageNum) {
      const [s, v] = key.split(":").map(Number);
      result.push({ surahId: s, verseId: v });
    }
  }
  result.sort((a, b) =>
    a.surahId !== b.surahId ? a.surahId - b.surahId : a.verseId - b.verseId
  );
  return result;
}

function getVersesForJuz(juzNum: number): { surahId: number; verseId: number }[] {
  const [startS, startV] = JUZ_STARTS[juzNum - 1];
  const [endS, endV] = juzNum < 30 ? JUZ_STARTS[juzNum] : [114, 999];
  const result: { surahId: number; verseId: number }[] = [];
  for (const s of surahs) {
    if (s.id < startS || s.id > endS) continue;
    for (const v of s.verses) {
      const afterStart = s.id > startS || (s.id === startS && v.id >= startV);
      const beforeEnd = s.id < endS || (s.id === endS && v.id < endV);
      if (afterStart && beforeEnd) result.push({ surahId: s.id, verseId: v.id });
    }
  }
  return result;
}

const STORAGE_KEY = "quran_bookmarks";

function loadBookmarks(): BookmarkEntry[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch { return []; }
}

function saveBookmarks(bm: BookmarkEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bm));
}

const LAST_POS_KEY = "quran_last_position";
function loadLastPosition(): { surahId: number; verseId: number } | null {
  try { return JSON.parse(localStorage.getItem(LAST_POS_KEY) ?? "null"); }
  catch { return null; }
}
function saveLastPosition(surahId: number, verseId: number, surahName = "", page = 0, surahNameAr = "") {
  const computedPage = page || getPageForVerse(surahId, verseId);
  localStorage.setItem(LAST_POS_KEY, JSON.stringify({ surahId, verseId, page: computedPage, surahName, surahNameAr }));
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface SurahBlockProps {
  surah: Surah;
  verses: Verse[];
  highlightedVerse: { s: number; v: number } | null;
  longPressVerse: string | null;
  isSurahBookmarked: boolean;
  onBookmarkSurah: (surahId: number) => void;
  verseRef: (surahId: number, verseId: number, el: HTMLSpanElement | null) => void;
  fontSize: number;
  onVerseTouchStart: (key: string) => void;
  onVerseTouchEnd: () => void;
}

function SurahBlock({
  surah,
  verses,
  highlightedVerse,
  longPressVerse,
  isSurahBookmarked,
  onBookmarkSurah,
  verseRef,
  fontSize,
  onVerseTouchStart,
  onVerseTouchEnd,
}: SurahBlockProps) {
  const startsFromFirst = verses[0]?.id === 1;
  return (
    <div className="surah-block">
      {startsFromFirst && (
        <div className="surah-title-block">
          <button
            className={`surah-bookmark-btn ${isSurahBookmarked ? "bookmarked" : ""}`}
            onClick={() => onBookmarkSurah(surah.id)}
            title={isSurahBookmarked ? "Remove bookmark" : "Bookmark this surah"}
          >
            {isSurahBookmarked ? "🔖" : "🏷️"}
          </button>
          <div className="surah-title-ornament">﴿</div>
          <div className="surah-title-arabic">{surah.name}</div>
          <div className="surah-title-ornament">﴾</div>
        </div>
      )}
      {startsFromFirst && surah.id !== 1 && surah.id !== 9 && (
        <div className="basmala" aria-label="Bismillah">
          بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
        </div>
      )}

      {/* Continuous flowing verses */}
      <div className="verses-flow" dir="rtl" lang="ar" style={{ fontSize: `${fontSize}rem` }}>
        {verses.map((verse) => {
          const key = `${surah.id}:${verse.id}`;
          const isHighlighted = highlightedVerse?.s === surah.id && highlightedVerse?.v === verse.id;
          const isLongPressed = longPressVerse === key;
          return (
            <span
              key={verse.id}
              ref={(el) => verseRef(surah.id, verse.id, el)}
              data-surah={surah.id}
              data-verse={verse.id}
              className={`verse-inline${isHighlighted || isLongPressed ? " verse-highlighted-inline" : ""}`}
              onTouchStart={() => onVerseTouchStart(key)}
              onTouchEnd={onVerseTouchEnd}
              onTouchCancel={onVerseTouchEnd}
            >
              {verse.text}
              {" "}
              <span className="verse-end-marker">
                ﴿{verse.id.toLocaleString("ar-EG")}﴾
              </span>
              {" "}
            </span>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function QuranScreen({ onHome }: { onHome?: () => void }) {
  // ── State ──────────────────────────────────────────────────────────────────
  const [viewMode, setViewMode] = useState<ViewMode>("page");
  const [selectedSurah, setSelectedSurah] = useState<number>(1);
  const [selectedPage, setSelectedPage] = useState<number>(1);
  const [selectedJuz, setSelectedJuz] = useState<number>(1);

  const [highlightedVerse, setHighlightedVerse] = useState<{ s: number; v: number } | null>(null);
  const [bookmarks, setBookmarks] = useState<BookmarkEntry[]>(loadBookmarks);
  const [showSurahList, setShowSurahList] = useState(false);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [showSearch, setShowSearch] = useState(false); // kept for panel timer logic, unused
  const [searchQuery, setSearchQuery] = useState("");
  const [fontSize, setFontSize] = useState<number>(1.6); // continuous rem
  const [showFontMenu, setShowFontMenu] = useState(false);
  const MIN_FONT = 0.9;
  const MAX_FONT = 4.5;

  // ── Immersive reading mode ─────────────────────────────────────────────────
  const [uiVisible, setUiVisible] = useState(true);
  const uiTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showUI = useCallback(() => {
    setUiVisible(true);
    if (uiTimerRef.current) clearTimeout(uiTimerRef.current);
    uiTimerRef.current = setTimeout(() => {
      setUiVisible(false);
    }, 3000);
  }, []);

  const verseRefs = useRef<Map<string, HTMLSpanElement>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  // ── Font size ──────────────────────────────────────────────────────────────
  const fontSizeClass = "fs-custom"; // single class, font set via inline style
  const decreaseFont = () => setFontSize((f: number) => Math.max(MIN_FONT, parseFloat((f - 0.15).toFixed(2))));
  const increaseFont = () => setFontSize((f: number) => Math.min(MAX_FONT, parseFloat((f + 0.15).toFixed(2))));

  // ── Swipe handlers ────────────────────────────────────────────────────────
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length > 1) {
      // Multi-touch (pinch) — ignore completely
      touchStartX.current = null;
      touchStartY.current = null;
      return;
    }
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    // If any multi-touch happened during the gesture, ignore
    if (e.touches.length > 0) {
      touchStartX.current = null;
      touchStartY.current = null;
      return;
    }
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 8) {
      // Pure tap — toggle UI
      if (uiVisible) {
        if (uiTimerRef.current) clearTimeout(uiTimerRef.current);
        setUiVisible(false);
      } else {
        showUI();
      }
    } else if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 2) {
      showUI();
      if (dx > 0) setSelectedPage((p: number) => Math.min(604, p + 1));
      else setSelectedPage((p: number) => Math.max(1, p - 1));
    }
    touchStartX.current = null;
    touchStartY.current = null;
  }, [uiVisible, showUI]);

  // ── Restore last position ──────────────────────────────────────────────────
  useEffect(() => {
    const pos = loadLastPosition();
    if (pos) {
      const page = getPageForVerse(pos.surahId, pos.verseId);
      setSelectedPage(page);
      setHighlightedVerse({ s: pos.surahId, v: pos.verseId });
    }
  }, []);

  // Clear highlight when navigating to a new page
  useEffect(() => {
    setHighlightedVerse(null);
  }, [selectedPage]);
  const currentVisibleVerse = useRef<{ surahId: number; verseId: number } | null>(null);

  // ── Build verse list based on view mode ───────────────────────────────────
  const verseList = useMemo(() => {
    return getVersesForPage(selectedPage);
  }, [selectedPage]);

  // ── Scroll to highlighted verse ───────────────────────────────────────────
  useEffect(() => {
    if (!highlightedVerse) return;
    const key = `${highlightedVerse.s}:${highlightedVerse.v}`;
    const el = verseRefs.current.get(key);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [highlightedVerse, verseList]);

  // ── Intersection observer to track reading position ───────────────────────
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement;
            const s = Number(el.dataset.surah);
            const v = Number(el.dataset.verse);
            if (s && v) {
              const surah = surahs.find(sr => sr.id === s);
              const name = surah?.transliteration || "";
              const nameAr = surah?.name || "";
              saveLastPosition(s, v, name, 0, nameAr);
              currentVisibleVerse.current = { surahId: s, verseId: v };
            }
          }
        }
      },
      { threshold: 0.5 }
    );
    verseRefs.current.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [verseList]);

  // ── Smart tab switch - sync to current position ───────────────────────────
  const switchTab = useCallback((newMode: ViewMode) => {
    const pos = currentVisibleVerse.current;
    if (pos) {
      if (newMode === "surah") {
        setSelectedSurah(pos.surahId);
      } else if (newMode === "page") {
        const page = getPageForVerse(pos.surahId, pos.verseId);
        setSelectedPage(page);
      } else if (newMode === "juz") {
        const juz = getJuzForVerse(pos.surahId, pos.verseId);
        setSelectedJuz(juz);
      }
    }
    setViewMode(newMode);
  }, []);

  // ── Bookmark handlers ─────────────────────────────────────────────────────
  const toggleBookmark = useCallback((surahId: number) => {
    setBookmarks((prev) => {
      const idx = prev.findIndex((b) => b.surahId === surahId);
      let next: BookmarkEntry[];
      if (idx >= 0) {
        next = prev.filter((_, i) => i !== idx);
      } else {
        const surah = surahs.find((s) => s.id === surahId)!;
        next = [
          ...prev,
          {
            surahId,
            label: `${surah.transliteration} (${surah.name})`,
            timestamp: Date.now(),
          },
        ];
      }
      saveBookmarks(next);
      return next;
    });
  }, []);

  const isSurahBookmarked = useCallback(
    (surahId: number) => bookmarks.some((b) => b.surahId === surahId),
    [bookmarks]
  );

  // ── Navigation helpers ────────────────────────────────────────────────────
  const goToVerse = (surahId: number, verseId: number) => {
    const page = getPageForVerse(surahId, verseId);
    setSelectedPage(page);
    setHighlightedVerse({ s: surahId, v: verseId });
    setShowBookmarks(false);
    setShowSurahList(false);
    setShowSearch(false);
  };

  const prevPage = () => setSelectedPage((p) => Math.max(1, p - 1));
  const nextPage = () => setSelectedPage((p) => Math.min(604, p + 1));
  const prevJuz = () => setSelectedJuz((j) => Math.max(1, j - 1));
  const nextJuz = () => setSelectedJuz((j) => Math.min(30, j + 1));
  const prevSurah = () => setSelectedSurah((s) => Math.max(1, s - 1));
  const nextSurah = () => setSelectedSurah((s) => Math.min(114, s + 1));

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length > 1) {
      // Pinch detected mid-gesture — cancel swipe tracking
      touchStartX.current = null;
      touchStartY.current = null;
    }
  }, []);

  // ── Pinch to resize font ──────────────────────────────────────────────────
  const pinchStartDist = useRef<number | null>(null);
  const pinchStartFont = useRef<number>(1.6);

  const handlePinchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      pinchStartDist.current = Math.sqrt(dx * dx + dy * dy);
      pinchStartFont.current = fontSize;
    }
  }, [fontSize]);

  const handlePinchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchStartDist.current !== null) {
      e.preventDefault();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const ratio = dist / pinchStartDist.current;
      const newFont = Math.min(MAX_FONT, Math.max(MIN_FONT,
        parseFloat((pinchStartFont.current * ratio).toFixed(2))
      ));
      setFontSize(newFont);
    }
  }, []);

  const handlePinchEnd = useCallback(() => {
    pinchStartDist.current = null;
  }, []);

  const [longPressVerse, setLongPressVerse] = useState<string | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Tafsir modal
  const [tafsirTarget, setTafsirTarget] = useState<{ surahId: number; verseId: number; surahName: string; text: string } | null>(null);

  const openTafsir = useCallback((key: string) => {
    const [sId, vId] = key.split(":").map(Number);
    const surah = surahs.find(s => s.id === sId);
    const verse = surah?.verses.find(v => v.id === vId);
    if (surah && verse) {
      setTafsirTarget({ surahId: sId, verseId: vId, surahName: surah.name, text: verse.text });
      setLongPressVerse(null);
    }
  }, []);

  const handleVerseTouchStart = useCallback((key: string) => {
    longPressTimer.current = setTimeout(() => {
      setLongPressVerse(prev => prev === key ? null : key);
    }, 600);
  }, []);

  const handleVerseTouchEnd = useCallback(() => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  }, []);
  const [showJump, setShowJump] = useState(false);
  const [jumpPage, setJumpPage] = useState("");
  const [jumpSurah, setJumpSurah] = useState("");

  // Keep UI visible when any panel is open — cancel the timer entirely
  useEffect(() => {
    if (showSurahList || showBookmarks || showSearch || showFontMenu || showJump) {
      if (uiTimerRef.current) clearTimeout(uiTimerRef.current);
      setUiVisible(true);
    } else {
      if (uiTimerRef.current) clearTimeout(uiTimerRef.current);
      uiTimerRef.current = setTimeout(() => setUiVisible(false), 3000);
    }
  }, [showSurahList, showBookmarks, showSearch, showFontMenu, showJump]);

  const handleJumpPage = () => {
    const num = parseInt(jumpPage.trim());
    if (!isNaN(num) && num >= 1 && num <= 604) {
      setSelectedPage(num);
      setShowJump(false);
      setJumpPage("");
    }
  };

  const handleJumpSurah = (val: string) => {
    const num = parseInt(val);
    if (!isNaN(num) && num >= 1 && num <= 114) {
      setSelectedPage(getPageForVerse(num, 1));
      setShowJump(false);
      setJumpSurah("");
    }
  };

  // ── Search ────────────────────────────────────────────────────────────────
  // ── Current surah data ────────────────────────────────────────────────────
  const currentSurah = surahs.find((s) => s.id === selectedSurah)!;

  // ── Render verses ─────────────────────────────────────────────────────────
  const renderedVerses = useMemo(() => {
    // Group verseList by surahId
    const groups: { surahId: number; verses: Verse[] }[] = [];
    for (const { surahId, verseId } of verseList) {
      const surah = surahs.find((s) => s.id === surahId)!;
      const verse = surah?.verses.find((v) => v.id === verseId);
      if (!surah || !verse) continue;
      const last = groups[groups.length - 1];
      if (last && last.surahId === surahId) {
        last.verses.push(verse);
      } else {
        groups.push({ surahId, verses: [verse] });
      }
    }
    return groups.map(({ surahId, verses }) => {
      const surah = surahs.find((s) => s.id === surahId)!;
      return (
        <SurahBlock
          key={surahId}
          surah={surah}
          verses={verses}
          highlightedVerse={highlightedVerse}
          longPressVerse={longPressVerse}
          isSurahBookmarked={isSurahBookmarked(surahId)}
          onBookmarkSurah={toggleBookmark}
          fontSize={fontSize}
          onVerseTouchStart={handleVerseTouchStart}
          onVerseTouchEnd={handleVerseTouchEnd}
          verseRef={(sId, vId, el) => {
            const key = `${sId}:${vId}`;
            if (el) verseRefs.current.set(key, el);
            else verseRefs.current.delete(key);
          }}
        />
      );
    });
  }, [verseList, highlightedVerse, isSurahBookmarked, toggleBookmark, fontSize, longPressVerse]);

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        /* ── Tokens ── */
        :root {
          --cream: #faf7f0;
          --parchment: #f0e8d5;
          --gold: #c9a84c;
          --gold-dark: #a07830;
          --gold-light: #e8cc80;
          --ink: #1a1208;
          --ink-soft: #3d2e14;
          --teal: #2c3e6b;
          --teal-light: #3d5296;
          --teal-pale: #eef1f8;
          --red: #8b1a1a;
          --shadow: rgba(100,70,20,0.15);
          --font-arabic: 'KFGQPC Uthmanic Script HAFS', 'Scheherazade New', serif;
          --font-ui: 'Cormorant Garamond', Georgia, serif;
          --radius: 12px;
          --bg: #f5f0e8;
        }

        /* ── Surah Title Block ── */
        .surah-title-block {
          position: relative;
          margin: 20px 16px 0;
          padding: 12px 40px;
          text-align: center;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          border-top: 1px solid var(--gold);
          border-bottom: 1px solid var(--gold);
          background: linear-gradient(180deg, #fdf8ee 0%, #f7edcf 100%);
        }
        .surah-title-arabic {
          font-family: var(--font-arabic);
          font-size: 1.6rem;
          color: #1a1a3e;
          font-weight: 700;
          direction: rtl;
        }
        .surah-title-ornament {
          color: var(--gold-dark);
          font-size: 1.2rem;
        }
        .surah-bookmark-btn {
          position: absolute;
          top: 50%;
          left: 10px;
          transform: translateY(-50%);
          background: none;
          border: none;
          font-size: 1rem;
          cursor: pointer;
          opacity: 0.45;
          transition: opacity 0.15s;
        }
        .surah-bookmark-btn:hover,
        .surah-bookmark-btn.bookmarked { opacity: 1; }
        .basmala {
          font-family: var(--font-arabic);
          font-size: 1.35rem;
          color: #1a1a3e;
          direction: rtl;
          text-align: center;
          padding: 10px 16px 4px;
        }

        /* ── Base ── */
        .quran-screen {
          min-height: 100vh;
          background: var(--bg);
          font-family: var(--font-ui);
          color: var(--ink);
          display: flex;
          flex-direction: column;
        }

        /* ── Immersive Mode ── */
        .topbar {
          position: sticky;
          top: 0;
          z-index: 100;
          background: var(--teal);
          color: var(--gold-light);
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 14px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
          transition: opacity 0.35s ease, transform 0.35s ease;
        }
        .topbar.hidden {
          opacity: 0;
          pointer-events: none;
          transform: translateY(-100%);
        }
        .nav-strip {
          display: flex;
          align-items: center;
          background: var(--parchment);
          border-bottom: 1px solid var(--gold);
          padding: 6px 8px;
          gap: 6px;
          position: sticky;
          top: 52px;
          z-index: 99;
          transition: opacity 0.35s ease, transform 0.35s ease;
        }
        .nav-strip.hidden {
          opacity: 0;
          pointer-events: none;
          transform: translateY(-8px);
        }
        .nav-info {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 4px;
        }
        .nav-info-center {
          font-family: var(--font-arabic);
          font-size: 1.15rem;
          color: var(--teal);
          font-weight: 700;
          text-align: center;
          flex: 1;
          cursor: pointer;
          direction: rtl;
        }
        .nav-info-center:hover { text-decoration: underline; }
        .nav-info-side {
          font-size: 0.72rem;
          color: var(--ink-soft);
          font-weight: 600;
          min-width: 32px;
          text-align: center;
          letter-spacing: 0.02em;
        }

        .topbar-title {
          font-size: 1.15rem;
          font-weight: 600;
          flex: 1;
          letter-spacing: 0.02em;
        }

        .icon-btn {
          background: none;
          border: none;
          color: var(--gold-light);
          font-size: 1.2rem;
          cursor: pointer;
          padding: 6px;
          border-radius: 8px;
          transition: background 0.15s;
          display: flex;
          align-items: center;
        }
        .icon-btn:hover { background: rgba(255,255,255,0.1); }
        .icon-btn.active { color: var(--gold); background: rgba(255,255,255,0.15); }
        .home-btn {
          background: none;
          border: none;
          color: var(--gold-light);
          font-size: 1.8rem;
          cursor: pointer;
          padding: 4px 10px;
          border-radius: 8px;
          transition: background 0.15s;
          display: flex;
          align-items: center;
          line-height: 1;
        }
        .home-btn:hover { background: rgba(255,255,255,0.1); }

        /* ── Disable text selection on verses, allow long press ── */
        .verses-flow {
          -webkit-user-select: none;
          user-select: none;
          -webkit-touch-callout: none;
        }
        .verse-inline {
          -webkit-user-select: none;
          user-select: none;
          cursor: default;
        }
        .verse-inline.verse-highlighted-inline {
          -webkit-user-select: text;
          user-select: text;
        }

        /* ── View Mode Tabs ── */
        .mode-tab {
          flex: 1;
          padding: 10px 4px;
          font-size: 0.82rem;
          font-family: var(--font-ui);
          font-weight: 600;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          border: none;
          background: none;
          color: var(--ink-soft);
          cursor: pointer;
          transition: all 0.2s;
          border-bottom: 3px solid transparent;
          margin-bottom: -2px;
        }
        .mode-tab.active {
          color: var(--teal);
          border-bottom-color: var(--teal);
          background: var(--cream);
        }

        /* ── Nav Strip ── */
        .nav-label {
          font-weight: 700;
          color: var(--teal);
          font-size: 1rem;
          text-align: center;
          flex: 1;
          cursor: pointer;
        }
        .nav-label:hover { text-decoration: underline; }
        .nav-btn {
          background: var(--teal);
          color: var(--gold-light);
          border: none;
          border-radius: 8px;
          padding: 6px 14px;
          font-size: 1.1rem;
          cursor: pointer;
          transition: background 0.15s;
          min-width: 40px;
        }
        .nav-btn:hover { background: var(--teal-light); }
        .nav-btn:disabled { opacity: 0.3; cursor: not-allowed; }

        /* ── Scroll Area ── */
        .verse-scroll {
          flex: 1;
          overflow-y: auto;
          padding: 0 0 80px;
          scroll-behavior: smooth;
        }

        /* ── Surah Header ── */
        .surah-header {
          background: linear-gradient(135deg, var(--teal) 0%, #1a2545 100%);
          padding: 16px 16px 14px;
          text-align: center;
          margin-bottom: 4px;
        }
        /* ── Verse end marker ── */
        .verse-end-marker {
          color: var(--gold-dark);
          font-size: 0.78em;
          margin: 0 4px;
          display: inline;
          font-weight: 700;
          vertical-align: middle;
          font-family: 'Scheherazade New', serif;
        }

        /* ── Surah Block ── */
        .surah-block {
          margin-bottom: 24px;
        }

        /* ── Font size set via inline style on .verses-flow ── */
        .verses-flow {
          padding: 16px 20px 20px;
          text-align: center;
          line-height: 2.6;
          word-spacing: 0.1em;
          letter-spacing: 0.01em;
        }
        .verse-inline {
          font-family: var(--font-arabic);
          color: var(--ink);
          display: inline;
        }
        .verse-inline.verse-highlighted-inline {
          background: #fff3cc;
          border-radius: 4px;
          padding: 0 2px;
        }
        @media (min-width: 768px) {
          .verse-scroll { max-width: 800px; margin: 0 auto; }
        }

        .bookmark-btn {
          background: none;
          border: none;
          font-size: 1.1rem;
          cursor: pointer;
          padding: 4px;
          opacity: 0.4;
          transition: opacity 0.15s, transform 0.15s;
          flex-shrink: 0;
        }
        .bookmark-btn:hover, .bookmark-btn.bookmarked { opacity: 1; }
        .bookmark-btn.bookmarked { transform: scale(1.15); }

        /* ── Overlay Panels ── */
        .overlay {
          position: fixed;
          inset: 0;
          z-index: 200;
          display: flex;
          flex-direction: column;
          background: rgba(10,30,25,0.55);
          backdrop-filter: blur(2px);
        }
        .panel {
          background: var(--cream);
          max-height: 85vh;
          overflow-y: auto;
          border-radius: var(--radius) var(--radius) 0 0;
          margin-top: auto;
          display: flex;
          flex-direction: column;
        }
        .panel-header {
          position: sticky;
          top: 0;
          background: var(--teal);
          color: var(--gold-light);
          padding: 14px 16px;
          display: flex;
          align-items: center;
          font-size: 1.05rem;
          font-weight: 700;
          gap: 10px;
          border-radius: var(--radius) var(--radius) 0 0;
        }
        .panel-header span { flex: 1; text-align: center; }
        .panel-close {
          background: none;
          border: none;
          color: var(--gold-light);
          font-size: 1.4rem;
          cursor: pointer;
          line-height: 1;
          padding: 0 4px;
          flex-shrink: 0;
        }
        .panel-body { padding: 8px 0; }

        /* ── Surah List ── */
        .surah-list-item {
          display: flex;
          align-items: center;
          padding: 10px 12px;
          border-bottom: 1px solid var(--parchment);
          gap: 8px;
          transition: background 0.15s;
          direction: ltr;
        }
        .surah-list-item:hover { background: var(--teal-pale); }
        /* Left side — info only, no tap action */
        .sli-left {
          flex: 1;
          pointer-events: none;
          min-width: 0;
        }
        .sli-trans { font-weight: 700; font-size: 0.92rem; color: var(--ink); }
        .sli-meta { font-size: 0.73rem; color: var(--ink-soft); margin-top: 1px; }
        /* Right side — tappable */
        .sli-right {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          flex-shrink: 0;
        }
        .sli-num {
          width: 30px;
          height: 30px;
          border: 1px solid var(--gold);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.78rem;
          color: var(--gold-dark);
          flex-shrink: 0;
        }
        .sli-arabic {
          font-family: var(--font-arabic);
          font-size: 1.2rem;
          color: var(--teal);
          direction: rtl;
        }

        /* ── Bookmarks ── */
        .bm-item {
          display: flex;
          align-items: center;
          padding: 12px 16px;
          border-bottom: 1px solid var(--parchment);
          gap: 10px;
          cursor: pointer;
          transition: background 0.15s;
        }
        .bm-item:hover { background: var(--teal-pale); }
        .bm-label { flex: 1; }
        .bm-title { font-weight: 700; color: var(--teal); }
        .bm-sub { font-size: 0.78rem; color: var(--ink-soft); }
        .bm-delete {
          background: none;
          border: none;
          color: var(--red);
          font-size: 1.1rem;
          cursor: pointer;
          padding: 4px 8px;
        }
        .bm-empty {
          padding: 32px 16px;
          text-align: center;
          color: var(--ink-soft);
          font-style: italic;
        }

        /* ── Search ── */

        /* ── Font Menu ── */
        .font-menu {
          position: absolute;
          top: 52px;
          left: 0;
          background: var(--cream);
          border: 2px solid var(--gold);
          border-radius: var(--radius);
          box-shadow: 0 4px 20px var(--shadow);
          z-index: 300;
          padding: 14px 16px;
          width: 240px;
        }
        .font-menu-label {
          text-align: center;
          font-size: 0.8rem;
          color: var(--ink-soft);
          margin-bottom: 10px;
          font-family: var(--font-ui);
        }
        .font-controls {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .font-step-btn {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          border: 2px solid var(--gold);
          background: var(--teal);
          color: var(--gold-light);
          font-size: 1.3rem;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: background 0.15s;
        }
        .font-step-btn:hover { background: var(--teal-light); }
        .font-step-btn:disabled { opacity: 0.3; cursor: not-allowed; }
        .font-slider {
          flex: 1;
          -webkit-appearance: none;
          appearance: none;
          height: 4px;
          background: var(--gold);
          border-radius: 2px;
          outline: none;
          cursor: pointer;
        }
        .font-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: var(--teal);
          border: 2px solid var(--gold);
          cursor: pointer;
        }

        /* ── Jump Popup ── */
        .jump-popup {
          position: absolute;
          top: 52px;
          left: 50%;
          transform: translateX(-50%);
          background: var(--cream);
          border: 2px solid var(--gold);
          border-radius: var(--radius);
          box-shadow: 0 4px 20px var(--shadow);
          z-index: 300;
          padding: 14px 16px;
          width: 240px;
        }
        .jump-label {
          font-size: 0.82rem;
          color: var(--ink-soft);
          margin-bottom: 8px;
          text-align: center;
        }
        .jump-row {
          display: flex;
          gap: 8px;
        }
        .jump-input {
          flex: 1;
          padding: 8px 10px;
          border: 2px solid var(--gold);
          border-radius: 8px;
          font-size: 1.1rem;
          font-family: var(--font-ui);
          background: var(--parchment);
          color: var(--ink);
          outline: none;
          text-align: center;
        }
        .jump-input:focus { border-color: var(--teal); }
        .jump-go-btn {
          padding: 8px 14px;
          background: var(--teal);
          color: var(--gold-light);
          border: none;
          border-radius: 8px;
          font-size: 0.95rem;
          font-weight: 700;
          cursor: pointer;
          font-family: var(--font-ui);
        }
        .jump-go-btn:hover { background: var(--teal-light); }

        /* ── Jump Popup ── */
        .jump-popup {
          position: absolute;
          top: 52px;
          left: 50%;
          transform: translateX(-50%);
          background: var(--cream);
          border: 2px solid var(--gold);
          border-radius: var(--radius);
          box-shadow: 0 4px 20px var(--shadow);
          z-index: 300;
          padding: 14px 16px;
          width: 260px;
        }
        .jump-label {
          font-size: 0.82rem;
          color: var(--ink-soft);
          margin-bottom: 8px;
          font-weight: 700;
          color: var(--teal);
        }
        .jump-row {
          display: flex;
          gap: 8px;
          margin-bottom: 10px;
        }
        .jump-input {
          flex: 1;
          padding: 8px 10px;
          border: 2px solid var(--gold);
          border-radius: 8px;
          font-size: 1rem;
          font-family: var(--font-ui);
          background: var(--parchment);
          color: var(--ink);
          outline: none;
          text-align: center;
        }
        .jump-input:focus { border-color: var(--teal); }
        .jump-select {
          flex: 1;
          padding: 8px 10px;
          border: 2px solid var(--gold);
          border-radius: 8px;
          font-size: 0.9rem;
          font-family: var(--font-ui);
          background: var(--parchment);
          color: var(--ink);
          outline: none;
          cursor: pointer;
        }
        .jump-select:focus { border-color: var(--teal); }
        .jump-go-btn {
          padding: 8px 14px;
          background: var(--teal);
          color: var(--gold-light);
          border: none;
          border-radius: 8px;
          font-size: 0.95rem;
          font-weight: 700;
          cursor: pointer;
          font-family: var(--font-ui);
          white-space: nowrap;
        }
        .jump-go-btn:hover { background: var(--teal-light); }
        .jump-divider {
          text-align: center;
          font-size: 0.75rem;
          color: var(--ink-soft);
          margin: 4px 0 10px;
          position: relative;
        }
        .jump-divider::before, .jump-divider::after {
          content: '';
          position: absolute;
          top: 50%;
          width: 40%;
          height: 1px;
          background: var(--parchment);
        }
        .jump-divider::before { left: 0; }
        .jump-divider::after { right: 0; }

        /* ── Jump to Juz indicator ── */
        .juz-info {
          text-align: center;
          padding: 4px;
          font-size: 0.75rem;
          color: var(--ink-soft);
          background: var(--parchment);
          border-bottom: 1px solid var(--gold);
        }

        /* ── Responsive layout ── */
        @media (max-width: 360px) {
          .topbar-title { font-size: 1rem; }
          .icon-btn { font-size: 1rem; padding: 5px; }
          .verse-block { padding: 10px 10px; }
          .surah-header { padding: 14px 12px 10px; }
          .nav-label { font-size: 0.85rem; }
        }

        /* ── Google font import ── */
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Scheherazade+New:wght@400;700&display=swap');
      `}</style>

      <div className={`quran-screen ${fontSizeClass}`}>
        {/* Top Bar */}
        <header className={`topbar${uiVisible ? "" : " hidden"}`}>
          <button
            className={`icon-btn ${showSurahList ? "active" : ""}`}
            onClick={() => { setShowSurahList(true); setShowBookmarks(false); setShowSearch(false); }}
            title="Surah list"
          >☰</button>
          <span className="topbar-title">القرآن الكريم</span>
          {onHome && (
            <button className="home-btn" onClick={onHome} title="Back to Home">🏠</button>
          )}
          <div style={{ position: "relative" }}>
            <button
              className={`icon-btn ${showJump ? "active" : ""}`}
              onClick={() => { setShowJump(j => !j); setShowSurahList(false); setShowBookmarks(false); setShowSearch(false); }}
              title="Jump to page/surah"
            >
              ↗
            </button>
            {showJump && (
              <div className="jump-popup">
                <div className="jump-label">Jump to Surah</div>
                <div className="jump-row">
                  <select
                    className="jump-select"
                    value={jumpSurah}
                    onChange={e => { setJumpSurah(e.target.value); handleJumpSurah(e.target.value); }}
                  >
                    <option value="">— Select Surah —</option>
                    {surahs.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.id}. {s.transliteration}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="jump-divider">or</div>
                <div className="jump-label">Jump to Page</div>
                <div className="jump-row">
                  <input
                    className="jump-input"
                    type="number"
                    placeholder="1 – 604"
                    min={1}
                    max={604}
                    value={jumpPage}
                    onChange={e => setJumpPage(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleJumpPage()}
                  />
                  <button className="jump-go-btn" onClick={handleJumpPage}>Go</button>
                </div>
              </div>
            )}
          </div>
          <button
            className={`icon-btn ${showBookmarks ? "active" : ""}`}
            onClick={() => { setShowBookmarks(true); setShowSurahList(false); setShowSearch(false); }}
            title="Bookmarks"
          >
            🔖
          </button>
          <div style={{ position: "relative" }}>
            <button
              className={`icon-btn ${showFontMenu ? "active" : ""}`}
              onClick={() => setShowFontMenu((f) => !f)}
              title="Font size"
            >
              Aa
            </button>
            {showFontMenu && (
              <div className="font-menu">
                <div className="font-menu-label">
                  Text Size — {fontSize.toFixed(1)}rem
                </div>
                <div className="font-controls">
                  <button
                    className="font-step-btn"
                    onClick={decreaseFont}
                    disabled={fontSize <= MIN_FONT}
                    title="Decrease"
                  >−</button>
                  <input
                    type="range"
                    className="font-slider"
                    min={MIN_FONT}
                    max={MAX_FONT}
                    step={0.05}
                    value={fontSize}
                    onChange={(e) => setFontSize(parseFloat(e.target.value))}
                  />
                  <button
                    className="font-step-btn"
                    onClick={increaseFont}
                    disabled={fontSize >= MAX_FONT}
                    title="Increase"
                  >+</button>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Nav Strip — page navigation only */}
        <div className={`nav-strip${uiVisible ? "" : " hidden"}`}>
          <button className="nav-btn" onClick={prevPage} disabled={selectedPage <= 1}>‹</button>

          <div className="nav-info">
            <span className="nav-info-side">
              {verseList.length > 0 ? `p.${selectedPage}` : ""}
            </span>
            <span className="nav-info-center" dir="rtl" onClick={() => setShowSurahList(true)}>
              {verseList.length > 0
                ? surahs.find(s => s.id === verseList[0].surahId)?.name
                : ""}
            </span>
            <span className="nav-info-side">
              {verseList.length > 0 ? `j.${getJuzForVerse(verseList[0].surahId, verseList[0].verseId)}` : ""}
            </span>
          </div>

          <button className="nav-btn" onClick={nextPage} disabled={selectedPage >= 604}>›</button>
        </div>

        {/* Verse Scroll Area */}
        <div
          className="verse-scroll"
          ref={containerRef}
          onTouchStart={(e) => { handleTouchStart(e); handlePinchStart(e); }}
          onTouchMove={(e) => { handleTouchMove(e); handlePinchMove(e); }}
          onTouchEnd={(e) => { handleTouchEnd(e); handlePinchEnd(); }}
        >
          {renderedVerses}
        </div>
      </div>

      {/* ── Surah List Overlay ── */}
      {showSurahList && (
        <div className="overlay" onClick={() => setShowSurahList(false)}>
          <div className="panel" onClick={(e) => e.stopPropagation()}>
            <div className="panel-header">
              <span>Surahs</span>
              <button className="panel-close" onClick={() => setShowSurahList(false)}>✕</button>
            </div>
            <div className="panel-body">
              {surahs.map((s) => (
                <div key={s.id} className="surah-list-item">

                  {/* LEFT — no action */}
                  <div className="sli-num">{s.id}</div>
                  <div className="sli-left">
                    <div className="sli-trans">{s.transliteration}</div>
                    <div className="sli-meta">{s.type} · {s.total_verses} verses</div>
                  </div>

                  {/* RIGHT — actions only */}
                  <button
                    className={`bookmark-btn ${isSurahBookmarked(s.id) ? "bookmarked" : ""}`}
                    onClick={(e) => { e.stopPropagation(); toggleBookmark(s.id); }}
                    title={isSurahBookmarked(s.id) ? "Remove bookmark" : "Bookmark surah"}
                  >
                    {isSurahBookmarked(s.id) ? "🔖" : "🏷️"}
                  </button>
                  <div className="sli-arabic" onClick={() => {
                    setSelectedPage(getPageForVerse(s.id, 1));
                    setHighlightedVerse(null);
                    setShowSurahList(false);
                  }}>
                    {s.name}
                  </div>

                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Bookmarks Overlay ── */}
      {showBookmarks && (
        <div className="overlay" onClick={() => setShowBookmarks(false)}>
          <div className="panel" onClick={(e) => e.stopPropagation()}>
            <div className="panel-header">
              <span>Bookmarks ({bookmarks.length})</span>
              <button className="panel-close" onClick={() => setShowBookmarks(false)}>✕</button>
            </div>
            <div className="panel-body">
              {bookmarks.length === 0 ? (
                <div className="bm-empty">No bookmarks yet. Tap 🏷️ on any surah header to save it.</div>
              ) : (
                [...bookmarks]
                  .sort((a, b) => a.surahId - b.surahId)
                  .map((bm) => {
                    const surah = surahs.find(s => s.id === bm.surahId)!;
                    return (
                      <div
                        key={bm.surahId}
                        className="bm-item"
                        onClick={() => {
                          setSelectedPage(getPageForVerse(bm.surahId, 1));
                          setHighlightedVerse(null);
                          setShowBookmarks(false);
                        }}
                      >
                        <div className="bm-label">
                          <div className="bm-title">{surah.transliteration}</div>
                          <div className="bm-sub">{surah.name} · {surah.type} · {surah.total_verses} verses</div>
                        </div>
                        <button
                          className="bm-delete"
                          onClick={(e) => { e.stopPropagation(); toggleBookmark(bm.surahId); }}
                          title="Remove bookmark"
                        >
                          🗑️
                        </button>
                      </div>
                    );
                  })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Long-press floating action bar — opens Tafsir ── */}
      {longPressVerse && !tafsirTarget && (
        <div
          onClick={() => setLongPressVerse(null)}
          style={{ position: "fixed", inset: 0, zIndex: 350,
            background: "rgba(15,25,50,0.25)", backdropFilter: "blur(1px)",
            display: "flex", alignItems: "flex-end", justifyContent: "center",
            paddingBottom: 30 }}>
          <div onClick={(e) => e.stopPropagation()}
            data-testid="verse-action-bar"
            style={{ background: "#fff", borderRadius: 18,
              padding: "10px 14px",
              boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
              display: "flex", gap: 8, alignItems: "center",
              border: "1.5px solid #d4a843" }}>
            <button
              data-testid="open-tafsir-btn"
              onClick={() => openTafsir(longPressVerse)}
              style={{ background: "linear-gradient(135deg, #2c3e6b, #1a2545)",
                border: "none", color: "#f5f0e8",
                padding: "10px 20px", borderRadius: 12, cursor: "pointer",
                fontSize: "0.95rem", fontWeight: 700,
                display: "flex", alignItems: "center", gap: 8,
                fontFamily: "'DM Sans', sans-serif" }}>
              📖 التفسير
            </button>
            <button
              onClick={() => setLongPressVerse(null)}
              style={{ background: "#f5f0e8", border: "none", color: "#64748b",
                width: 38, height: 38, borderRadius: "50%", cursor: "pointer",
                fontSize: "1rem" }}>
              ✕
            </button>
          </div>
        </div>
      )}

      {/* ── Tafsir modal ── */}
      {tafsirTarget && (
        <TafsirModal
          surahId={tafsirTarget.surahId}
          verseId={tafsirTarget.verseId}
          surahName={tafsirTarget.surahName}
          verseText={tafsirTarget.text}
          onClose={() => setTafsirTarget(null)}
        />
      )}
    </>
  );
}
