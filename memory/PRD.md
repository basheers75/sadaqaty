# PRD — Sadaqa Jaryeh (صدقة جارية)

## Problem statement
User uploaded `sadaqaty-main.zip` — a React + TypeScript + Vite Islamic web app. Asked
to complete the missing **Azkar** and **Audio Quran** features.

## Tech stack
- React 19 + TypeScript + Vite 7
- Tailwind CSS 3 (configured but app primarily uses inline styles)
- LocalStorage for all persistence (no backend)
- Public CDNs: everyayah.com (verse-by-verse audio), mp3quran.net (full surahs),
  Nominatim (geocoding)
- Bilingual AR/EN with full RTL support

## User personas
1. **Daily Muslim user** — wants prayer times, Quran reading progress, and daily adhkar
   on phone, works offline-first for cached features.
2. **Multilingual user** — Arabic native or English speaker, switchable from settings.

## Core requirements (static)
- All times computed client-side (no backend)
- Authentic adhkar from canonical sources (Bukhari, Muslim, Abu Dawud, etc.)
- Multiple reciters for audio Quran with verse-by-verse highlighting
- Smart contextual UI (e.g., Home shows morning vs evening adhkar based on time/prayer)

## What's been implemented (Jan 2026)
### Already in original zip (verified working)
- Language picker (EN/AR), Home dashboard, Quran reader (604 pages, juz nav,
  bookmarks, font-size, immersive mode), Prayer Times (5 calc methods, GPS,
  per-prayer offsets, notifications), Settings.

### Session 1 (iter 1) — Azkar + Audio Quran
- **AzkarScreen** with 9 categories, 77 bilingual adhkar, tap counters, sources
- **AudioQuranScreen** with 5 reciters, verse-by-verse, full surah, sticky player
- Audio dock button enabled; App routing extended; PWA manifest added

### Session 2 (iter 2) — Qibla + Tafsir + PWA + Hisn-aligned Azkar
- **All truncated verse references in Azkar expanded inline** (آية الكرسي،
  آخر آيتي البقرة، الإخلاص، المعوذتين in evening/after-prayer/sleep sections)
  — verified clean of `...` shorthand
- **QiblaScreen** (`/app/frontend/src/screens/QiblaScreen.tsx`):
  - Great-circle bearing to Kaaba (21.4225°N, 39.8262°E)
  - Haversine distance in km
  - Compass dial with Kaaba icon, rotating arrow, cardinal letters (شجقغ/NESW)
  - DeviceOrientation API with iOS permission flow + webkitCompassHeading + Android alpha
  - "Aligned" pulse animation when device faces qibla
  - Home card link added
- **TafsirModal** (`/app/frontend/src/screens/TafsirModal.tsx`):
  - Long-press on any verse in QuranScreen opens action bar → tafsir trigger
  - Fetches Al-Muyassar from api.alquran.cloud, fallback quranenc.com
  - 30-day localStorage cache (key `tafsir_muyassar_cache_v1`)
  - Beautiful modal with verse highlight + tafsir + source attribution
- **PWA Service Worker** (`/app/frontend/public/sw.js`):
  - Audio cache-first (everyayah.com, mp3quran.net) — works offline after first play
  - Static font/image cache-first
  - App shell network-first with cache fallback
  - APIs pass-through (always fresh)
  - Versioned cache cleanup on activate
  - Registered in main.tsx on window 'load'

## Testing status
- Iteration 1: testing_agent_v3 frontend E2E → **100% pass, zero bugs**
- Iteration 2: testing_agent_v3 frontend E2E → **100% pass on Qibla / Tafsir / PWA / expanded Azkar**
  - Service Worker verified `activated` at `/sw.js`
  - Qibla bearing math validated (Cairo → 136.1°, 1287 km — correct)
  - Tafsir live fetch from api.alquran.cloud succeeds (435-char Al-Muyassar)
  - All `...` truncations in Azkar source confirmed removed

## Prioritized backlog
### P1 — High impact
- Tafsir / translation toggle in Quran reading screen
- Sharing Ayah / Zikr (Web Share API)
- Tasbeeh standalone counter screen
- Qibla compass screen

### P2 — Medium
- Full PWA service worker for offline audio caching
- Adhan audio (real recorded call to prayer at notification time)
- Hijri calendar with events (Ramadan, Eid, etc.)
- Quran search across all 114 surahs

### P3 — Nice to have
- Dark mode toggle in Settings
- Sadaqa tracker / charity log (matches app name)
- Iftar/Sahoor countdown during Ramadan
- Cloud sync (Firebase) for cross-device progress

## Next tasks list (after user review)
1. Add Tafsir/translation panel to QuranScreen
2. Build Qibla compass with device orientation API
3. Full PWA: register service worker, cache shell + verse audio
4. Hijri events calendar

## File map
- `src/App.tsx` — root router
- `src/screens/HomeScreen.tsx` — dashboard
- `src/screens/QuranScreen.tsx` — Mushaf reader (604 pages)
- `src/screens/PrayerTimesScreen.tsx` — 5 prayers + sunrise
- `src/screens/SettingsScreen.tsx` — location, calc method, language, offsets
- `src/screens/LanguagePicker.tsx` — first-launch lang selection
- `src/screens/AzkarScreen.tsx` — adhkar with counters ⭐ NEW
- `src/screens/AudioQuranScreen.tsx` — audio Quran player ⭐ NEW
- `src/screens/prayerUtils.ts` — astro calc + geocoding + prefs store
- `src/screens/langStore.ts` — language store + EN/AR translation dict
- `src/data/quran.json` — full Quran text (114 surahs)
- `src/data/pageMap.ts` — verse → page mapping (Mushaf 604 pages)
- `src/data/azkar.ts` — bilingual adhkar database ⭐ NEW
- `src/data/reciters.ts` — reciter catalog + URL builders ⭐ NEW

## Notes
- No auth, no backend — fully client-side app
- Original zip had a Cloudflare Wrangler config — removed to run on supervisor
  via plain Vite dev server on port 3000
