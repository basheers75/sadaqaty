import { useState, useEffect, useRef } from "react";
import { loadPrefs } from "./prayerUtils";
import { getLang } from "./langStore";

const UI = "'DM Sans', sans-serif";
const HINDI = "٠١٢٣٤٥٦٧٨٩";
const toAr = (s: string | number) => String(s).replace(/\d/g, d => HINDI[+d]);

// Kaaba coordinates
const KAABA_LAT = 21.4225;
const KAABA_LNG = 39.8262;

function toRad(d: number) { return (d * Math.PI) / 180; }
function toDeg(r: number) { return (r * 180) / Math.PI; }

// Great-circle bearing from (lat1,lng1) to Kaaba — returns 0..360 from true north
function qiblaBearing(lat: number, lng: number): number {
  const φ1 = toRad(lat);
  const φ2 = toRad(KAABA_LAT);
  const Δλ = toRad(KAABA_LNG - lng);
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  let θ = toDeg(Math.atan2(y, x));
  return (θ + 360) % 360;
}

// Distance to Kaaba (km) using haversine
function kaabaDistance(lat: number, lng: number): number {
  const R = 6371;
  const φ1 = toRad(lat), φ2 = toRad(KAABA_LAT);
  const dφ = toRad(KAABA_LAT - lat);
  const dλ = toRad(KAABA_LNG - lng);
  const a = Math.sin(dφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(dλ / 2) ** 2;
  return Math.round(2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

interface Props { onHome: () => void; onSettings: () => void }

export default function QiblaScreen({ onHome, onSettings }: Props) {
  const lang = getLang() || "en";
  const isAr = lang === "ar";

  const [heading, setHeading] = useState<number | null>(null); // device compass heading
  const [permission, setPermission] = useState<"unknown" | "granted" | "denied" | "unsupported">("unknown");
  const [requesting, setRequesting] = useState(false);

  const prefs = loadPrefs();
  const qibla = prefs ? qiblaBearing(prefs.lat, prefs.lng) : null;
  const distance = prefs ? kaabaDistance(prefs.lat, prefs.lng) : null;

  // Heading-relative angle for the arrow (rotates so qibla is up)
  // arrow rotation = qibla - heading
  const arrowRot = qibla !== null && heading !== null ? (qibla - heading + 360) % 360 : null;
  const aligned = arrowRot !== null && (arrowRot < 5 || arrowRot > 355);

  const handlerRef = useRef<((e: DeviceOrientationEvent) => void) | null>(null);

  const startCompass = () => {
    if (!("DeviceOrientationEvent" in window)) {
      setPermission("unsupported");
      return;
    }
    const handler = (e: DeviceOrientationEvent) => {
      // iOS Safari provides webkitCompassHeading directly (true north)
      const withWebkit = e as DeviceOrientationEvent & { webkitCompassHeading?: number };
      if (typeof withWebkit.webkitCompassHeading === "number") {
        setHeading(withWebkit.webkitCompassHeading);
      } else if (e.alpha !== null) {
        // Android/Firefox: alpha is rotation around z, 0 = facing north when device flat,
        // but increases counterclockwise → convert
        setHeading((360 - e.alpha) % 360);
      }
    };
    handlerRef.current = handler;
    window.addEventListener("deviceorientationabsolute", handler, true);
    window.addEventListener("deviceorientation", handler, true);
    setPermission("granted");
  };

  const requestPermission = async () => {
    setRequesting(true);
    const DOE = (window as any).DeviceOrientationEvent;
    if (DOE && typeof DOE.requestPermission === "function") {
      try {
        const result = await DOE.requestPermission();
        if (result === "granted") startCompass();
        else setPermission("denied");
      } catch {
        setPermission("denied");
      }
    } else {
      // Non-iOS — start directly
      startCompass();
    }
    setRequesting(false);
  };

  useEffect(() => {
    // Auto-start on non-iOS browsers (no explicit permission API)
    const DOE = (window as any).DeviceOrientationEvent;
    if (DOE && typeof DOE.requestPermission !== "function") {
      startCompass();
    }
    return () => {
      const h = handlerRef.current;
      if (h) {
        window.removeEventListener("deviceorientationabsolute", h, true);
        window.removeEventListener("deviceorientation", h, true);
      }
    };
  }, []);

  return (
    <div dir={isAr ? "rtl" : "ltr"} style={{ minHeight: "100vh", background: "#FDFBF7", fontFamily: UI, color: "#1a1a2e" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Scheherazade+New:wght@400;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        button { font-family: inherit; }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.03); }
        }
        .aligned { animation: pulse 1.2s ease-in-out infinite; }
        .compass {
          position: relative;
          width: 290px; height: 290px;
          margin: 0 auto;
          border-radius: 50%;
          background: radial-gradient(circle at 50% 35%, #fff 0%, #f5efe3 60%, #ebe1c8 100%);
          box-shadow:
            inset 0 0 0 6px #d4a843,
            inset 0 0 0 7px rgba(255,255,255,0.55),
            inset 0 0 0 14px #f0e4c3,
            0 12px 32px rgba(160,120,48,0.28),
            0 4px 12px rgba(0,0,0,0.08);
        }
        .cardinal {
          position: absolute;
          left: 50%; top: 50%;
          font-family: ${UI};
          font-weight: 800;
          font-size: 1rem;
          color: #2c3e6b;
          transform-origin: 0 0;
        }
        .arrow-wrap {
          position: absolute;
          inset: 0;
          transition: transform 0.18s ease-out;
        }
        .arrow {
          position: absolute;
          left: 50%; top: 50%;
          width: 0; height: 0;
          transform: translate(-50%, -100%);
          /* Triangle pointing up */
        }
        .arrow-shape {
          width: 36px;
          height: 130px;
          background: linear-gradient(180deg, #c0392b 0%, #c0392b 50%, #d4a843 50%, #d4a843 100%);
          clip-path: polygon(50% 0, 100% 100%, 50% 88%, 0 100%);
          margin-left: -18px;
          filter: drop-shadow(0 3px 6px rgba(0,0,0,0.22));
        }
        .center-dot {
          position: absolute;
          left: 50%; top: 50%;
          width: 22px; height: 22px;
          border-radius: 50%;
          background: radial-gradient(circle at 30% 30%, #d4a843, #7a5800);
          transform: translate(-50%, -50%);
          box-shadow: 0 0 0 4px #fff, 0 2px 6px rgba(0,0,0,0.2);
        }
        .kaaba-emoji {
          position: absolute;
          left: 50%;
          top: 8%;
          transform: translateX(-50%);
          font-size: 1.6rem;
          filter: drop-shadow(0 1px 2px rgba(0,0,0,0.3));
        }
      `}</style>

      {/* Header */}
      <div style={{ background: "#2c3e6b", padding: "44px 16px 18px", display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={onHome}
          data-testid="qibla-back-btn"
          style={{ background: "rgba(255,255,255,0.12)", border: "none", color: "#f5f0e8",
            width: 38, height: 38, borderRadius: "50%", cursor: "pointer",
            fontSize: "1.3rem", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {isAr ? "›" : "‹"}
        </button>
        <div style={{ flex: 1, textAlign: isAr ? "right" : "left" }}>
          <div style={{ fontSize: "0.78rem", color: "rgba(245,240,232,0.55)", letterSpacing: "0.05em", textTransform: "uppercase" }}>
            {isAr ? "اتجاه القبلة" : "Qibla Direction"}
          </div>
          <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "#d4a843", marginTop: 2 }}>
            🕋 {isAr ? "البوصلة" : "Compass"}
          </div>
        </div>
      </div>

      <div style={{ padding: "20px 16px 60px" }}>
        {/* No location */}
        {!prefs && (
          <div onClick={onSettings}
            data-testid="qibla-no-location"
            style={{ background: "#fffbec", border: "1px solid #e8d04c", borderRadius: 14,
              padding: "16px 18px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer",
              marginBottom: 20 }}>
            <span style={{ fontSize: "1.6rem" }}>📍</span>
            <div style={{ flex: 1, fontSize: "0.95rem", color: "#7a5800", lineHeight: 1.5 }}>
              {isAr ? "حدّد موقعك أولاً من الإعدادات لحساب اتجاه القبلة" : "Set your location from Settings to compute Qibla direction"}
            </div>
            <span style={{ background: "#2c3e6b", color: "#f5f0e8", fontSize: "0.85rem", fontWeight: 600,
              padding: "8px 14px", borderRadius: 8, whiteSpace: "nowrap" }}>
              {isAr ? "إعداد" : "Set"}
            </span>
          </div>
        )}

        {/* Compass */}
        {prefs && (
          <>
            <div className={`compass${aligned ? " aligned" : ""}`}>
              {/* Cardinal letters */}
              {[
                { lbl: isAr ? "ش" : "N", angle: 0, color: "#c0392b" },
                { lbl: isAr ? "ق" : "E", angle: 90, color: "#2c3e6b" },
                { lbl: isAr ? "ج" : "S", angle: 180, color: "#2c3e6b" },
                { lbl: isAr ? "غ" : "W", angle: 270, color: "#2c3e6b" },
              ].map((c) => {
                const rad = toRad(c.angle);
                const x = 145 + 120 * Math.sin(rad);
                const y = 145 - 120 * Math.cos(rad);
                return (
                  <span key={c.angle} className="cardinal"
                    style={{
                      transform: `translate(-50%,-50%)`,
                      left: x, top: y, position: "absolute",
                      color: c.color, fontSize: c.angle === 0 ? "1.2rem" : "0.95rem",
                      fontWeight: c.angle === 0 ? 900 : 700,
                    }}>
                    {c.lbl}
                  </span>
                );
              })}

              {/* Tick marks every 30° */}
              {Array.from({ length: 12 }).map((_, i) => {
                const angle = i * 30;
                const rad = toRad(angle);
                const x1 = 145 + 132 * Math.sin(rad);
                const y1 = 145 - 132 * Math.cos(rad);
                const x2 = 145 + 122 * Math.sin(rad);
                const y2 = 145 - 122 * Math.cos(rad);
                return (
                  <svg key={i} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
                    <line x1={x1} y1={y1} x2={x2} y2={y2}
                      stroke={angle === 0 ? "#c0392b" : "#7a5800"}
                      strokeWidth={angle % 90 === 0 ? 2 : 1} opacity={0.5} />
                  </svg>
                );
              })}

              {/* Rotating arrow + Kaaba */}
              <div className="arrow-wrap"
                style={{ transform: arrowRot !== null ? `rotate(${arrowRot}deg)` : "rotate(0deg)" }}>
                <div className="kaaba-emoji">🕋</div>
                <div className="arrow">
                  <div className="arrow-shape" />
                </div>
              </div>
              <div className="center-dot" />
            </div>

            {/* Info card */}
            <div style={{ marginTop: 24, background: "#fff", borderRadius: 16,
              padding: "18px 20px", boxShadow: "0 2px 14px rgba(44,62,107,0.08)",
              border: "1px solid rgba(212,168,67,0.18)" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <div style={{ fontSize: "0.75rem", color: "#94a3b8", letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 4 }}>
                    {isAr ? "اتجاه القبلة" : "Qibla bearing"}
                  </div>
                  <div data-testid="qibla-bearing" style={{ fontSize: "1.5rem", fontWeight: 700, color: "#2c3e6b" }}>
                    {qibla !== null
                      ? (isAr ? `${toAr(qibla.toFixed(1))}°` : `${qibla.toFixed(1)}°`)
                      : "—"}
                  </div>
                  <div style={{ fontSize: "0.78rem", color: "#64748b", marginTop: 3 }}>
                    {isAr ? "من الشمال الحقيقي" : "from true north"}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: "0.75rem", color: "#94a3b8", letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 4 }}>
                    {isAr ? "المسافة إلى مكة" : "Distance to Makkah"}
                  </div>
                  <div data-testid="qibla-distance" style={{ fontSize: "1.5rem", fontWeight: 700, color: "#2c3e6b" }}>
                    {distance !== null
                      ? (isAr ? `${toAr(distance.toLocaleString())} كم` : `${distance.toLocaleString()} km`)
                      : "—"}
                  </div>
                  <div style={{ fontSize: "0.78rem", color: "#64748b", marginTop: 3 }}>
                    {prefs.locationName}
                  </div>
                </div>
              </div>

              {/* Heading status */}
              <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid #f0ebe3" }}>
                {heading !== null ? (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontSize: "0.85rem", color: "#64748b" }}>
                      {isAr ? "اتجاه هاتفك" : "Device heading"}
                    </div>
                    <div data-testid="qibla-heading" style={{ fontFamily: "monospace", fontWeight: 700,
                      color: aligned ? "#2e7d32" : "#1a1a2e", fontSize: "1rem" }}>
                      {isAr ? `${toAr(heading.toFixed(0))}°` : `${heading.toFixed(0)}°`}
                      {aligned && " ✓"}
                    </div>
                  </div>
                ) : (
                  <button onClick={requestPermission}
                    disabled={requesting}
                    data-testid="qibla-enable-btn"
                    style={{ width: "100%", padding: 12, background: "#2c3e6b", border: "none",
                      borderRadius: 12, color: "#f5f0e8", fontSize: "0.95rem", fontWeight: 600,
                      cursor: "pointer", opacity: requesting ? 0.6 : 1 }}>
                    {requesting
                      ? (isAr ? "جاري…" : "Loading…")
                      : (isAr ? "🧭 تفعيل البوصلة" : "🧭 Enable compass")}
                  </button>
                )}
                {permission === "denied" && (
                  <div style={{ marginTop: 8, fontSize: "0.82rem", color: "#c0392b" }}>
                    {isAr ? "تم رفض إذن البوصلة — استخدم الزاوية الثابتة أعلاه" : "Compass permission denied — use the fixed bearing above"}
                  </div>
                )}
                {permission === "unsupported" && (
                  <div style={{ marginTop: 8, fontSize: "0.82rem", color: "#94a3b8" }}>
                    {isAr ? "البوصلة غير مدعومة على هذا الجهاز — استخدم الزاوية الثابتة أعلاه" : "Compass not supported — use the fixed bearing above"}
                  </div>
                )}
              </div>

              {aligned && (
                <div style={{ marginTop: 14, padding: "10px 14px", background: "linear-gradient(135deg, #eaf6ef, #f8fbf3)",
                  border: "1px solid rgba(60,120,80,0.32)", borderRadius: 10,
                  fontSize: "0.88rem", color: "#2e7d32", fontWeight: 600, textAlign: "center" }}>
                  {isAr ? "✓ أنت تواجه القبلة" : "✓ You are facing the Qibla"}
                </div>
              )}
            </div>

            {/* Tip */}
            <div style={{ marginTop: 14, padding: "12px 16px", background: "rgba(212,168,67,0.10)",
              border: "1px solid rgba(212,168,67,0.25)", borderRadius: 12,
              fontSize: "0.82rem", color: "#7a5800", lineHeight: 1.55 }}>
              💡 {isAr
                ? "للحصول على دقة أعلى: امسك الهاتف أفقياً وابتعد عن الأجسام المعدنية والأجهزة المغناطيسية"
                : "For best accuracy: hold the phone flat and stay away from metal objects or magnetic devices."}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
