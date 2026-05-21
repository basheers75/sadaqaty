import { setLang } from "./langStore";
import type { Lang } from "./langStore";

export default function LanguagePicker({ onDone }: { onDone: () => void }) {
  const pick = (lang: Lang) => { setLang(lang); onDone(); };

  return (
    <div style={{
      minHeight: "100vh", background: "#f5f0e8",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      fontFamily: "'DM Sans', sans-serif", padding: "32px 24px",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Scheherazade+New:wght@400;700&family=DM+Sans:wght@400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
      `}</style>

      {/* App icon area */}
      <div style={{ marginBottom: 40, textAlign: "center" }}>
        <div style={{ fontSize: "3.5rem", marginBottom: 12 }}>🕌</div>
        <div style={{ fontFamily: "'Scheherazade New', serif", fontSize: "2rem", color: "#2c3e6b", marginBottom: 6 }}>
          صدقة جارية
        </div>
        <div style={{ fontSize: "0.9rem", color: "#888" }}>Sadaqa Jaryeh</div>
      </div>

      {/* Prompt */}
      <div style={{ textAlign: "center", marginBottom: 36 }}>
        <div style={{ fontSize: "1.3rem", fontWeight: 600, color: "#1a1a2e", marginBottom: 6 }}>
          Welcome · أهلاً وسهلاً
        </div>
        <div style={{ fontSize: "0.95rem", color: "#888" }}>
          Choose your language · اختر لغتك
        </div>
      </div>

      {/* Language buttons */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14, width: "100%", maxWidth: 320 }}>
        <button onClick={() => pick("en")} style={{
          padding: "18px 24px", borderRadius: 16,
          border: "2px solid #2c3e6b", background: "#2c3e6b",
          color: "#f5f0e8", fontFamily: "'DM Sans', sans-serif",
          fontSize: "1.1rem", fontWeight: 600, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          transition: "opacity 0.15s",
        }}>
          <span>🇬🇧 English</span>
          <span style={{ fontSize: "0.85rem", opacity: 0.6 }}>Left to right</span>
        </button>

        <button onClick={() => pick("ar")} style={{
          padding: "18px 24px", borderRadius: 16,
          border: "2px solid #2c3e6b", background: "#fff",
          color: "#2c3e6b", fontFamily: "'Scheherazade New', serif",
          fontSize: "1.2rem", fontWeight: 700, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          direction: "rtl", transition: "opacity 0.15s",
        }}>
          <span>🇸🇦 العربية</span>
          <span style={{ fontSize: "0.85rem", opacity: 0.6, fontFamily: "'DM Sans', sans-serif" }}>يمين إلى يسار</span>
        </button>
      </div>
    </div>
  );
}
