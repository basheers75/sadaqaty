import { useState, useEffect } from "react";
import { loadPrefs, savePrefs, clearPrefs, geocodeCity, reverseGeocode, CALC_METHODS, DEFAULT_OFFSETS } from "./prayerUtils";
import type { LocationPrefs, PrayerOffsets } from "./prayerUtils";
import { getLang, setLang, T } from "./langStore";
import type { Lang } from "./langStore";

const PRAYER_ROWS: { key: keyof PrayerOffsets; ar: string; en: string }[] = [
  { key: "fajr",    ar: "الفجر",  en: "Fajr"    },
  { key: "dhuhr",   ar: "الظهر",  en: "Dhuhr"   },
  { key: "asr",     ar: "العصر",  en: "Asr"     },
  { key: "maghrib", ar: "المغرب", en: "Maghrib"  },
  { key: "isha",    ar: "العشاء", en: "Isha"     },
];

export default function SettingsScreen({ onHome }: { onHome: () => void }) {
  const [prefs, setPrefs]       = useState<LocationPrefs | null>(null);
  const [cityInput, setCityInput] = useState("");
  const [method, setMethod]     = useState("MWL");
  const [asrFactor, setAsr]     = useState(1);
  const [offsets, setOffsets]   = useState<PrayerOffsets>({ ...DEFAULT_OFFSETS });
  const [loading, setLoading]   = useState(false);
  const [status, setStatus]     = useState("");
  const [error, setError]       = useState("");
  const [lang, setLangState]    = useState<Lang>(getLang() || "en");

  const t    = T[lang];
  const isAr = lang === "ar";

  useEffect(() => {
    const p = loadPrefs();
    if (p) {
      setPrefs(p);
      setMethod(p.method);
      setAsr(p.asrFactor);
      setOffsets({ ...DEFAULT_OFFSETS, ...(p.offsets ?? {}) });
    }
  }, []);

  const switchLang = (l: Lang) => { setLang(l); setLangState(l); };

  const setOffset = (key: keyof PrayerOffsets, delta: number) => {
    setOffsets(prev => ({ ...prev, [key]: prev[key] + delta }));
  };

  const requestGPS = () => {
    if (!navigator.geolocation) { setError(t.gpsError); return; }
    setLoading(true); setError(""); setStatus(t.locating);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        const name = await reverseGeocode(lat, lng);
        const p: LocationPrefs = { lat, lng, locationName: name || `${lat.toFixed(2)}, ${lng.toFixed(2)}`, method, asrFactor, offsets };
        savePrefs(p); setPrefs(p);
        setStatus(`✓ ${t.locationSet}: ${p.locationName}`);
        setLoading(false);
      },
      (err) => {
        setLoading(false);
        setError(err.code === 1 ? t.gpsDenied : t.gpsError);
        setStatus("");
      },
      { timeout: 10000 }
    );
  };

  const searchCity = async () => {
    if (!cityInput.trim()) return;
    setLoading(true); setError(""); setStatus(t.searching);
    const result = await geocodeCity(cityInput.trim());
    if (result) {
      const p: LocationPrefs = { lat: result.lat, lng: result.lng, locationName: result.name, method, asrFactor, offsets };
      savePrefs(p); setPrefs(p);
      setCityInput("");
      setStatus(`✓ ${t.locationSet}: ${result.name}`);
    } else {
      setError(t.cityNotFound);
      setStatus("");
    }
    setLoading(false);
  };

  const saveCalcPrefs = () => {
    if (!prefs) { setError(t.location); return; }
    const p = { ...prefs, method, asrFactor, offsets };
    savePrefs(p); setPrefs(p);
    setStatus(`✓ ${t.calcSaved}`);
  };

  const reset = () => { clearPrefs(); setPrefs(null); setStatus(t.locationCleared); };

  const sectionTitle: React.CSSProperties = { fontSize: isAr ? "1rem" : "0.72rem", fontWeight: 600, letterSpacing: isAr ? 0 : "0.1em", textTransform: isAr ? "none" : "uppercase", color: "#2c3e6b", padding: "16px 18px 8px" };
  const inputStyle: React.CSSProperties = { flex: 1, background: "#f5f0e8", border: "1.5px solid #e8e0d5", borderRadius: 10, color: "#1a1a2e", fontFamily: "inherit", fontSize: "0.95rem", padding: "10px 14px", outline: "none", direction: isAr ? "rtl" : "ltr" };
  const adjBtn = (col = "#2c3e6b"): React.CSSProperties => ({ width: 36, height: 36, borderRadius: "50%", border: `1.5px solid ${col}`, background: "transparent", color: col, fontSize: "1.2rem", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 });

  return (
    <div dir={isAr ? "rtl" : "ltr"} style={{ minHeight: "100vh", background: "#f5f0e8", fontFamily: isAr ? "'Scheherazade New', serif" : "'DM Sans', sans-serif", color: "#1a1a2e" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Scheherazade+New:wght@400;700&family=DM+Sans:wght@300;400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        select option { direction: ltr; }
      `}</style>

      {/* Header */}
      <div style={{ background: "#2c3e6b", padding: "52px 20px 20px", display: "flex", alignItems: "center", gap: 14 }}>
        <button onClick={onHome} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "#f5f0e8", fontSize: "1.4rem", width: 38, height: 38, borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          {isAr ? "›" : "‹"}
        </button>
        <span style={{ fontSize: isAr ? "1.4rem" : "1.15rem", fontWeight: 600, color: "#f5f0e8" }}>{t.settingsTitle}</span>
      </div>

      <div style={{ padding: "20px 16px 60px", display: "flex", flexDirection: "column", gap: 16 }}>

        {status && <div style={{ padding: "12px 16px", background: "#f0faf5", border: "1px solid #b5e0c8", borderRadius: 10, fontSize: "0.9rem", color: "#1a6b3c" }}>{status}</div>}
        {error  && <div style={{ padding: "12px 16px", background: "#fff5f5", border: "1px solid #f0b8b8", borderRadius: 10, fontSize: "0.9rem", color: "#c0392b" }}>⚠ {error}</div>}

        {/* Language */}
        <div style={{ background: "#fff", borderRadius: 16, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
          <div style={sectionTitle}>{t.language}</div>
          <div style={{ display: "flex", gap: 10, padding: "4px 18px 16px" }}>
            {(["en", "ar"] as Lang[]).map(l => (
              <button key={l} onClick={() => switchLang(l)}
                style={{ flex: 1, padding: "12px", borderRadius: 12, border: `2px solid ${lang === l ? "#2c3e6b" : "#e8e0d5"}`, background: lang === l ? "#2c3e6b" : "#f5f0e8", color: lang === l ? "#f5f0e8" : "#666", fontFamily: l === "ar" ? "'Scheherazade New', serif" : "'DM Sans', sans-serif", fontSize: l === "ar" ? "1.15rem" : "0.95rem", fontWeight: 600, cursor: "pointer" }}>
                {l === "en" ? "🇬🇧 English" : "🇸🇦 العربية"}
              </button>
            ))}
          </div>
        </div>

        {/* Location */}
        <div style={{ background: "#fff", borderRadius: 16, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
          <div style={sectionTitle}>{t.location}</div>
          {prefs && (
            <>
              <div style={{ padding: "4px 18px 12px", display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: "1.3rem" }}>📍</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "1rem", fontWeight: 500 }}>{prefs.locationName}</div>
                  <div style={{ fontSize: "0.8rem", color: "#999", marginTop: 2 }}>{prefs.lat.toFixed(4)}, {prefs.lng.toFixed(4)}</div>
                </div>
                <button onClick={reset} style={{ background: "none", border: "1px solid #e8e0d5", borderRadius: 8, color: "#c0392b", fontFamily: "inherit", fontSize: "0.8rem", padding: "5px 10px", cursor: "pointer" }}>{t.clear}</button>
              </div>
              <div style={{ height: 1, background: "#f0ebe3", margin: "0 18px" }} />
            </>
          )}
          <div style={{ padding: "12px 18px" }}>
            <button onClick={requestGPS} disabled={loading}
              style={{ width: "100%", padding: 13, background: "#2c3e6b", border: "none", borderRadius: 12, color: "#f5f0e8", fontFamily: "inherit", fontSize: "1rem", fontWeight: 500, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              📡 {loading ? t.locating : t.useGPS}
            </button>
          </div>
          <div style={{ fontSize: "0.82rem", color: "#888", padding: "0 18px 8px" }}>{t.orEnterCity}</div>
          <div style={{ display: "flex", gap: 8, padding: "0 18px 16px" }}>
            <input style={inputStyle} placeholder={t.cityPlaceholder} value={cityInput}
              onChange={e => setCityInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && searchCity()} />
            <button onClick={searchCity} disabled={loading}
              style={{ background: "#d4a843", border: "none", borderRadius: 10, color: "#1a1a2e", fontFamily: "inherit", fontSize: "0.95rem", fontWeight: 600, padding: "10px 18px", cursor: "pointer", opacity: loading ? 0.6 : 1 }}>
              {loading ? "…" : t.go}
            </button>
          </div>
        </div>

        {/* Calculation method + Asr */}
        <div style={{ background: "#fff", borderRadius: 16, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
          <div style={sectionTitle}>{t.calcMethod}</div>
          <div style={{ padding: "4px 18px 14px" }}>
            <select value={method} onChange={e => setMethod(e.target.value)}
              style={{ width: "100%", background: "#f5f0e8", border: "1.5px solid #e8e0d5", borderRadius: 10, color: "#1a1a2e", fontFamily: "'DM Sans', sans-serif", fontSize: "0.95rem", padding: "10px 14px", outline: "none" }}>
              {Object.entries(CALC_METHODS).map(([k, v]) => (
                <option key={k} value={k}>{v.name}</option>
              ))}
            </select>
          </div>
          <div style={{ height: 1, background: "#f0ebe3", margin: "0 18px" }} />
          <div style={sectionTitle}>{t.asrCalc}</div>
          <div style={{ display: "flex", gap: 8, padding: "4px 18px 16px" }}>
            {[{ v: 1, label: t.shafi }, { v: 2, label: t.hanafi }].map(opt => (
              <button key={opt.v} onClick={() => setAsr(opt.v)}
                style={{ flex: 1, padding: "10px 6px", borderRadius: 10, border: `1.5px solid ${asrFactor === opt.v ? "#2c3e6b" : "#e8e0d5"}`, background: asrFactor === opt.v ? "#2c3e6b" : "#f5f0e8", color: asrFactor === opt.v ? "#f5f0e8" : "#666", fontFamily: "inherit", fontSize: "0.85rem", fontWeight: asrFactor === opt.v ? 600 : 400, cursor: "pointer" }}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Per-prayer time correction ── */}
        <div style={{ background: "#fff", borderRadius: 16, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
          <div style={sectionTitle}>
            {isAr ? "تصحيح أوقات الصلاة" : "Prayer Time Correction"}
          </div>
          <div style={{ padding: "0 18px 8px", fontSize: isAr ? "0.88rem" : "0.75rem", color: "#999", lineHeight: 1.5 }}>
            {isAr
              ? "اضبط كل صلاة بشكل مستقل لتتطابق مع أوقات مسجدك المحلي"
              : "Adjust each prayer independently to match your local mosque"}
          </div>

          {/* Table header */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto auto", gap: 0, padding: "8px 18px 4px", borderBottom: "1px solid #f0ebe3" }}>
            <div style={{ fontSize: "0.72rem", color: "#aaa", letterSpacing: "0.07em", textTransform: "uppercase" }}>{isAr ? "الصلاة" : "Prayer"}</div>
            <div style={{ fontSize: "0.72rem", color: "#aaa", letterSpacing: "0.07em", textTransform: "uppercase", textAlign: "center", width: 36 }}>−</div>
            <div style={{ fontSize: "0.72rem", color: "#aaa", letterSpacing: "0.07em", textTransform: "uppercase", textAlign: "center", minWidth: 54 }}>{isAr ? "دقيقة" : "min"}</div>
            <div style={{ fontSize: "0.72rem", color: "#aaa", letterSpacing: "0.07em", textTransform: "uppercase", textAlign: "center", width: 36 }}>+</div>
          </div>

          {/* One row per prayer */}
          {PRAYER_ROWS.map((p, i) => {
            const val = offsets[p.key];
            const color = val === 0 ? "#aaa" : val > 0 ? "#2c3e6b" : "#c0392b";
            return (
              <div key={p.key} style={{ display: "grid", gridTemplateColumns: "1fr auto auto auto", alignItems: "center", gap: 0, padding: "10px 18px", borderBottom: i < PRAYER_ROWS.length - 1 ? "1px solid #f8f5f0" : "none" }}>
                {/* Prayer name */}
                <div style={{ fontFamily: isAr ? "'Scheherazade New', serif" : "'DM Sans', sans-serif", fontSize: isAr ? "1.2rem" : "1rem", fontWeight: 500 }}>
                  {isAr ? p.ar : p.en}
                </div>
                {/* Minus */}
                <button style={adjBtn("#c0392b")} onClick={() => setOffset(p.key, -1)}>−</button>
                {/* Value */}
                <div style={{ textAlign: "center", minWidth: 54, fontSize: "1.1rem", fontWeight: 700, color }}>
                  {val > 0 ? `+${val}` : val}
                </div>
                {/* Plus */}
                <button style={adjBtn("#2c3e6b")} onClick={() => setOffset(p.key, 1)}>+</button>
              </div>
            );
          })}

          <div style={{ padding: "14px 18px 16px" }}>
            <button onClick={saveCalcPrefs}
              style={{ width: "100%", padding: 13, background: "#2c3e6b", border: "none", borderRadius: 12, color: "#f5f0e8", fontFamily: "inherit", fontSize: "1rem", fontWeight: 500, cursor: "pointer" }}>
              {t.savePrefs}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
